const Attendance = require("../models/Attendance");
const { getTeamIds, today, toDay, httpError } = require("../utils/helpers");

const HALF_DAY_HOURS = 4;

const populateAttendance = (query) =>
  query.populate({
    path: "employee",
    select: "firstName lastName employeeId department",
    populate: { path: "department", select: "name" },
  });

// builds { $gte, $lte } from ?from=YYYY-MM-DD&to=YYYY-MM-DD or ?month=YYYY-MM
const dateRange = (q) => {
  if (q.month) {
    const [y, m] = q.month.split("-").map(Number);
    if (!y || !m) throw httpError(400, "month must look like YYYY-MM");
    return { $gte: new Date(Date.UTC(y, m - 1, 1)), $lt: new Date(Date.UTC(y, m, 1)) };
  }
  const range = {};
  if (q.from) range.$gte = toDay(q.from);
  if (q.to) range.$lte = toDay(q.to);
  if (Object.values(range).some((v) => !v)) throw httpError(400, "Invalid from/to date");
  return Object.keys(range).length ? range : null;
};

// POST /api/attendance/check-in
exports.checkIn = async (req, res) => {
  if (!req.employee) throw httpError(400, "No employee profile linked to this account");
  const date = today();

  const existing = await Attendance.findOne({ employee: req.employee._id, date });
  if (existing?.checkIn) throw httpError(400, "You have already checked in today");

  const record = existing || new Attendance({ employee: req.employee._id, date });
  record.checkIn = new Date();
  record.status = "present";
  await record.save();
  res.status(201).json(record);
};

// POST /api/attendance/check-out
exports.checkOut = async (req, res) => {
  if (!req.employee) throw httpError(400, "No employee profile linked to this account");
  const record = await Attendance.findOne({ employee: req.employee._id, date: today() });
  if (!record?.checkIn) throw httpError(400, "You have not checked in today");
  if (record.checkOut) throw httpError(400, "You have already checked out today");

  record.checkOut = new Date();
  record.workHours = Math.round(((record.checkOut - record.checkIn) / 36e5) * 100) / 100;
  record.status = record.workHours < HALF_DAY_HOURS ? "half-day" : "present";
  await record.save();
  res.json(record);
};

// GET /api/attendance/today — the logged-in user's record for today (or null)
exports.getToday = async (req, res) => {
  if (!req.employee) return res.json(null);
  res.json(await Attendance.findOne({ employee: req.employee._id, date: today() }));
};

// GET /api/attendance/my ?month=YYYY-MM
exports.getMyAttendance = async (req, res) => {
  if (!req.employee) return res.json([]);
  const filter = { employee: req.employee._id };
  const range = dateRange(req.query);
  if (range) filter.date = range;
  res.json(await Attendance.find(filter).sort({ date: -1 }));
};

// GET /api/attendance  (HR: all, Manager: team) ?from&to | ?month, &employee=<id>
exports.getAttendance = async (req, res) => {
  const filter = {};
  if (req.user.role === "manager") filter.employee = { $in: await getTeamIds(req.employee) };
  if (req.query.employee) {
    if (filter.employee && !filter.employee.$in.some((id) => String(id) === req.query.employee)) {
      return res.json([]);
    }
    filter.employee = req.query.employee;
  }
  const range = dateRange(req.query);
  if (range) filter.date = range;

  res.json(await populateAttendance(Attendance.find(filter).sort({ date: -1 }).limit(1000)));
};

// PUT /api/attendance/:id  (HR) — correct a record
exports.updateAttendance = async (req, res) => {
  const record = await Attendance.findById(req.params.id);
  if (!record) throw httpError(404, "Attendance record not found");

  const { checkIn, checkOut, status, note } = req.body || {};
  if (checkIn !== undefined) record.checkIn = checkIn || undefined;
  if (checkOut !== undefined) record.checkOut = checkOut || undefined;
  if (status) record.status = status;
  if (note !== undefined) record.note = note;
  if (record.checkIn && record.checkOut) {
    if (record.checkOut < record.checkIn) throw httpError(400, "Check-out cannot be before check-in");
    record.workHours = Math.round(((record.checkOut - record.checkIn) / 36e5) * 100) / 100;
  }
  await record.save();
  res.json(await populateAttendance(Attendance.findById(record._id)));
};

// POST /api/attendance/mark  (HR) — create/overwrite a record, e.g. mark someone absent
exports.markAttendance = async (req, res) => {
  const { employee, date, status = "absent", note } = req.body || {};
  const day = toDay(date);
  if (!employee || !day) throw httpError(400, "employee and a valid date are required");

  const record = await Attendance.findOneAndUpdate(
    { employee, date: day },
    { $set: { status, note } },
    { upsert: true, returnDocument: "after", runValidators: true }
  );
  res.json(record);
};

// GET /api/attendance/report  (HR) ?from&to | ?month — totals per employee
exports.getAttendanceReport = async (req, res) => {
  const match = {};
  const range = dateRange(req.query);
  if (range) match.date = range;

  const rows = await Attendance.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$employee",
        present: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } },
        halfDay: { $sum: { $cond: [{ $eq: ["$status", "half-day"] }, 1, 0] } },
        absent: { $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] } },
        leave: { $sum: { $cond: [{ $eq: ["$status", "leave"] }, 1, 0] } },
        totalHours: { $sum: "$workHours" },
      },
    },
    { $lookup: { from: "employees", localField: "_id", foreignField: "_id", as: "emp" } },
    { $unwind: "$emp" },
    { $lookup: { from: "departments", localField: "emp.department", foreignField: "_id", as: "dept" } },
    {
      $project: {
        _id: 0,
        employee: "$_id",
        employeeId: "$emp.employeeId",
        name: { $concat: ["$emp.firstName", " ", "$emp.lastName"] },
        department: { $ifNull: [{ $first: "$dept.name" }, "Unassigned"] },
        present: 1,
        halfDay: 1,
        absent: 1,
        leave: 1,
        totalHours: { $round: ["$totalHours", 2] },
      },
    },
    { $sort: { name: 1 } },
  ]);

  res.json(rows);
};
