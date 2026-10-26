const Announcement = require("../models/Announcement");
const Employee = require("../models/Employee");
const User = require("../models/User");
const notify = require("../utils/notify");
const { httpError } = require("../utils/helpers");

const authorNameFor = (req) =>
  req.employee ? `${req.employee.firstName} ${req.employee.lastName}` : req.user.email;

// what a non-HR user is allowed to see
const visibleTo = (req) => {
  const or = [{ audience: "all" }, { audience: `${req.user.role}s` }];
  if (req.employee?.department) or.push({ audience: "department", department: req.employee.department });
  return { $or: or };
};

const canEdit = (req, a) => req.user.role === "hr" || String(a.postedBy) === String(req.user._id);

// GET /api/announcements — HR sees all; others see "all", their role's and their department's
exports.getAnnouncements = async (req, res) => {
  const filter = req.user.role === "hr" ? {} : visibleTo(req);
  const limit = Math.min(Number(req.query.limit) || 100, 200);
  const items = await Announcement.find(filter)
    .sort({ pinned: -1, createdAt: -1 })
    .limit(limit)
    .populate("department", "name");
  res.json(items);
};

// POST /api/announcements  (HR, Manager)
exports.createAnnouncement = async (req, res) => {
  const { title, content, audience = "all", department, pinned } = req.body || {};
  if (!title || !content) throw httpError(400, "title and content are required");
  if (!["all", "department", "employees", "managers"].includes(audience)) throw httpError(400, "Invalid audience");
  if (audience === "department" && !department) throw httpError(400, "Pick a department for this announcement");

  const announcement = await Announcement.create({
    title,
    content,
    audience,
    department: audience === "department" ? department : undefined,
    pinned: Boolean(pinned),
    postedBy: req.user._id,
    authorName: authorNameFor(req),
  });

  let recipients;
  if (audience === "department") {
    recipients = await Employee.find({ department }).distinct("user");
  } else if (audience === "employees" || audience === "managers") {
    recipients = await User.find({ isActive: true, role: audience.slice(0, -1) }).distinct("_id");
  } else {
    recipients = await User.find({ isActive: true }).distinct("_id");
  }
  recipients = recipients.filter((id) => String(id) !== String(req.user._id));
  await notify(recipients, "announcement", `New announcement: ${title}`, "/announcements");

  res.status(201).json(await announcement.populate("department", "name"));
};

// PUT /api/announcements/:id  (HR any, Manager own)
exports.updateAnnouncement = async (req, res) => {
  const a = await Announcement.findById(req.params.id);
  if (!a) throw httpError(404, "Announcement not found");
  if (!canEdit(req, a)) throw httpError(403, "You can only edit your own announcements");

  const { title, content, audience, department, pinned } = req.body || {};
  if (title !== undefined) a.title = title;
  if (content !== undefined) a.content = content;
  if (audience !== undefined) a.audience = audience;
  if (department !== undefined) a.department = department || undefined;
  if (a.audience !== "department") a.department = undefined;
  if (a.audience === "department" && !a.department) throw httpError(400, "Pick a department");
  if (pinned !== undefined) a.pinned = Boolean(pinned);
  await a.save();
  res.json(await a.populate("department", "name"));
};

// DELETE /api/announcements/:id  (HR any, Manager own)
exports.deleteAnnouncement = async (req, res) => {
  const a = await Announcement.findById(req.params.id);
  if (!a) throw httpError(404, "Announcement not found");
  if (!canEdit(req, a)) throw httpError(403, "You can only delete your own announcements");
  await a.deleteOne();
  res.json({ message: "Announcement deleted" });
};
