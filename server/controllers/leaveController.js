const Leave = require("../models/Leave");
const Employee = require("../models/Employee");
const User = require("../models/User");
const notify = require("../utils/notify");
const { getTeamIds, toDay, httpError } = require("../utils/helpers");
const { fileUrl } = require("../middleware/uploadMiddleware");

const DAY = 24 * 60 * 60 * 1000;
const fmt = (d) => d.toISOString().slice(0, 10);

const populateLeave = (query) =>
  query
    .populate({
      path: "employee",
      select: "firstName lastName employeeId department manager",
      populate: { path: "department", select: "name" },
    })
    .populate("reviewedBy", "email role");

// POST /api/leaves  — multipart allowed, optional field "attachment"
exports.applyLeave = async (req, res) => {
  if (!req.employee) throw httpError(400, "No employee profile linked to this account");
  const { type, startDate, endDate, reason } = req.body || {};

  if (!type || !startDate || !endDate || !reason) {
    throw httpError(400, "type, startDate, endDate and reason are required");
  }
  const start = toDay(startDate);
  const end = toDay(endDate);
  if (!start || !end) throw httpError(400, "Invalid dates");
  if (end < start) throw httpError(400, "End date cannot be before start date");

  const days = Math.round((end - start) / DAY) + 1;

  if (type !== "unpaid") {
    const balance = req.employee.leaveBalance?.[type];
    if (balance === undefined) throw httpError(400, "Invalid leave type");
    if (days > balance) throw httpError(400, `Not enough ${type} leave: ${balance} day(s) left, ${days} requested`);
  }

  const overlap = await Leave.exists({
    employee: req.employee._id,
    status: { $in: ["pending", "approved"] },
    startDate: { $lte: end },
    endDate: { $gte: start },
  });
  if (overlap) throw httpError(409, "You already have a leave request covering these dates");

  const leave = await Leave.create({
    employee: req.employee._id,
    type,
    startDate: start,
    endDate: end,
    days,
    reason,
    attachment: fileUrl(req.file),
  });

  // tell the manager (or every HR user if there is no manager)
  const name = `${req.employee.firstName} ${req.employee.lastName}`;
  const msg = `${name} applied for ${days} day(s) of ${type} leave (${fmt(start)} to ${fmt(end)})`;
  if (req.employee.manager) {
    const manager = await Employee.findById(req.employee.manager).select("user");
    await notify(manager?.user, "leave", msg, "/manager/leaves");
  } else {
    const hrUsers = await User.find({ role: "hr", isActive: true, _id: { $ne: req.user._id } }).distinct("_id");
    await notify(hrUsers, "leave", msg, "/hr/leaves");
  }

  res.status(201).json(await populateLeave(Leave.findById(leave._id)));
};

// GET /api/leaves/my
exports.getMyLeaves = async (req, res) => {
  if (!req.employee) return res.json([]);
  const leaves = await populateLeave(Leave.find({ employee: req.employee._id }).sort({ createdAt: -1 }));
  res.json(leaves);
};

// GET /api/leaves  (HR: all, Manager: own team) ?status=pending&employee=<id>
exports.getLeaves = async (req, res) => {
  const filter = {};
  if (req.user.role === "manager") filter.employee = { $in: await getTeamIds(req.employee) };
  if (req.query.employee) {
    if (filter.employee && !filter.employee.$in.some((id) => String(id) === req.query.employee)) {
      return res.json([]);
    }
    filter.employee = req.query.employee;
  }
  if (req.query.status) filter.status = req.query.status;
  if (req.query.type) filter.type = req.query.type;

  const leaves = await populateLeave(Leave.find(filter).sort({ status: -1, createdAt: -1 }));
  res.json(leaves);
};

// PATCH /api/leaves/:id/status  (Manager for own team, HR for anyone) { status, reviewComment }
exports.updateLeaveStatus = async (req, res) => {
  const { status, reviewComment } = req.body || {};
  if (!["approved", "rejected"].includes(status)) throw httpError(400, "Status must be approved or rejected");

  const leave = await Leave.findById(req.params.id);
  if (!leave) throw httpError(404, "Leave request not found");
  if (leave.status !== "pending") throw httpError(400, `This request is already ${leave.status}`);

  const employee = await Employee.findById(leave.employee);
  if (!employee) throw httpError(404, "Employee for this request no longer exists");
  if (String(employee.user) === String(req.user._id)) throw httpError(403, "You cannot review your own leave");
  if (req.user.role === "manager" && String(employee.manager) !== String(req.employee?._id)) {
    throw httpError(403, "You can only review leave for your own team");
  }

  if (status === "approved" && leave.type !== "unpaid") {
    const balance = employee.leaveBalance[leave.type];
    if (leave.days > balance) {
      throw httpError(400, `Employee only has ${balance} ${leave.type} day(s) left`);
    }
    employee.leaveBalance[leave.type] = balance - leave.days;
    await employee.save();
  }

  leave.status = status;
  leave.reviewComment = reviewComment;
  leave.reviewedBy = req.user._id;
  leave.approverRole = req.user.role;
  leave.reviewedAt = new Date();
  await leave.save();

  await notify(
    employee.user,
    "leave",
    `Your ${leave.type} leave (${fmt(leave.startDate)} to ${fmt(leave.endDate)}) was ${status}` +
      (reviewComment ? `: ${reviewComment}` : ""),
    "/leaves"
  );

  res.json(await populateLeave(Leave.findById(leave._id)));
};

// PATCH /api/leaves/:id/cancel  (owner, pending only)
exports.cancelLeave = async (req, res) => {
  const leave = await Leave.findById(req.params.id);
  if (!leave) throw httpError(404, "Leave request not found");
  if (!req.employee || String(leave.employee) !== String(req.employee._id)) {
    throw httpError(403, "You can only cancel your own requests");
  }
  if (leave.status !== "pending") throw httpError(400, "Only pending requests can be cancelled");

  leave.status = "cancelled";
  await leave.save();
  res.json(leave);
};

// GET /api/leaves/report  (HR) ?year=2026
exports.getLeaveReport = async (req, res) => {
  const year = Number(req.query.year) || new Date().getFullYear();
  const match = {
    startDate: { $gte: new Date(Date.UTC(year, 0, 1)), $lt: new Date(Date.UTC(year + 1, 0, 1)) },
  };

  const [byStatus, byType, byMonth, byDepartment] = await Promise.all([
    Leave.aggregate([{ $match: match }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
    Leave.aggregate([
      { $match: { ...match, status: "approved" } },
      { $group: { _id: "$type", requests: { $sum: 1 }, days: { $sum: "$days" } } },
    ]),
    Leave.aggregate([
      { $match: { ...match, status: "approved" } },
      { $group: { _id: { $month: "$startDate" }, days: { $sum: "$days" } } },
      { $sort: { _id: 1 } },
    ]),
    Leave.aggregate([
      { $match: { ...match, status: "approved" } },
      { $lookup: { from: "employees", localField: "employee", foreignField: "_id", as: "emp" } },
      { $unwind: "$emp" },
      { $lookup: { from: "departments", localField: "emp.department", foreignField: "_id", as: "dept" } },
      { $group: { _id: { $ifNull: [{ $first: "$dept.name" }, "Unassigned"] }, days: { $sum: "$days" } } },
      { $sort: { days: -1 } },
    ]),
  ]);

  res.json({
    year,
    byStatus: Object.fromEntries(byStatus.map((s) => [s._id, s.count])),
    byType: byType.map((t) => ({ type: t._id, requests: t.requests, days: t.days })),
    byMonth: byMonth.map((m) => ({ month: m._id, days: m.days })),
    byDepartment: byDepartment.map((d) => ({ department: d._id, days: d.days })),
  });
};
