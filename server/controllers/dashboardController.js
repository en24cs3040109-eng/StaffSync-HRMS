const User = require("../models/User");
const Employee = require("../models/Employee");
const Department = require("../models/Department");
const Leave = require("../models/Leave");
const Attendance = require("../models/Attendance");
const Announcement = require("../models/Announcement");
const Training = require("../models/Training");
const Notification = require("../models/Notification");
const { getTeamIds, today } = require("../utils/helpers");

const onLeaveToday = (employeeFilter) => {
  const d = today();
  return Leave.countDocuments({ ...employeeFilter, status: "approved", startDate: { $lte: d }, endDate: { $gte: d } });
};

const recentAnnouncements = (req) => {
  const filter =
    req.user.role === "hr"
      ? {}
      : {
          $or: [
            { audience: "all" },
            { audience: `${req.user.role}s` },
            ...(req.employee?.department ? [{ audience: "department", department: req.employee.department }] : []),
          ],
        };
  return Announcement.find(filter).sort({ pinned: -1, createdAt: -1 }).limit(5).select("title authorName createdAt pinned");
};

// GET /api/dashboard/stats — shape depends on the caller's role
exports.getStats = async (req, res) => {
  const role = req.user.role;
  const unreadNotifications = await Notification.countDocuments({ recipient: req.user._id, read: false });
  const announcements = await recentAnnouncements(req);

  if (role === "hr") {
    const activeUsers = await User.find({ isActive: true }).select("role");
    const activeUserIds = activeUsers.map((u) => u._id);
    const [departments, pendingLeaves, presentToday, leaveToday, activeTrainings] = await Promise.all([
      Department.countDocuments(),
      Leave.countDocuments({ status: "pending" }),
      Attendance.countDocuments({ date: today(), status: { $in: ["present", "half-day"] } }),
      onLeaveToday({}),
      Training.countDocuments({ endDate: { $gte: today() } }),
    ]);
    const totalEmployees = await Employee.countDocuments({ user: { $in: activeUserIds } });
    const byRole = activeUsers.reduce((acc, u) => ({ ...acc, [u.role]: (acc[u.role] || 0) + 1 }), {});

    return res.json({
      role,
      totalEmployees,
      byRole,
      departments,
      pendingLeaves,
      presentToday,
      onLeaveToday: leaveToday,
      activeTrainings,
      unreadNotifications,
      announcements,
    });
  }

  const own = req.employee
    ? {
        leaveBalance: req.employee.leaveBalance,
        todayAttendance: await Attendance.findOne({ employee: req.employee._id, date: today() }),
        myPendingLeaves: await Leave.countDocuments({ employee: req.employee._id, status: "pending" }),
      }
    : {};

  if (role === "manager") {
    const team = await getTeamIds(req.employee);
    const [pendingTeamLeaves, teamPresentToday, teamOnLeave, myTrainings] = await Promise.all([
      Leave.countDocuments({ employee: { $in: team }, status: "pending" }),
      Attendance.countDocuments({ employee: { $in: team }, date: today(), status: { $in: ["present", "half-day"] } }),
      onLeaveToday({ employee: { $in: team } }),
      Training.countDocuments({ createdBy: req.user._id, endDate: { $gte: today() } }),
    ]);
    return res.json({
      role,
      teamSize: team.length,
      pendingTeamLeaves,
      teamPresentToday,
      teamOnLeaveToday: teamOnLeave,
      activeTrainingsCreated: myTrainings,
      unreadNotifications,
      announcements,
      ...own,
    });
  }

  const d = today();
  const monthStart = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
  const [daysPresentThisMonth, trainings] = await Promise.all([
    req.employee
      ? Attendance.countDocuments({
          employee: req.employee._id,
          date: { $gte: monthStart },
          status: { $in: ["present", "half-day"] },
        })
      : 0,
    req.employee ? Training.find({ "participants.employee": req.employee._id }).select("participants") : [],
  ]);
  const trainingStatus = { assigned: 0, "in-progress": 0, completed: 0 };
  trainings.forEach((t) => {
    const p = t.participants.find((x) => String(x.employee) === String(req.employee._id));
    if (p) trainingStatus[p.status] += 1;
  });

  res.json({ role, daysPresentThisMonth, trainingStatus, unreadNotifications, announcements, ...own });
};
