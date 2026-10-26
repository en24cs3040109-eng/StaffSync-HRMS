const Training = require("../models/Training");
const Employee = require("../models/Employee");
const notify = require("../utils/notify");
const { getTeamIds, toDay, httpError } = require("../utils/helpers");

const populateTraining = (query) =>
  query.populate("participants.employee", "firstName lastName employeeId").populate("createdBy", "email role");

const isCreator = (req, t) => String(t.createdBy?._id || t.createdBy) === String(req.user._id);

// Managers may only assign their own team; HR may assign anyone
const allowedParticipants = async (req, ids) => {
  const unique = [...new Set((ids || []).map(String))];
  if (!unique.length) return [];
  if (req.user.role === "hr") {
    const found = await Employee.find({ _id: { $in: unique } }).distinct("_id");
    if (found.length !== unique.length) throw httpError(400, "Some employees were not found");
    return found;
  }
  const team = (await getTeamIds(req.employee)).map(String);
  const outside = unique.filter((id) => !team.includes(id));
  if (outside.length) throw httpError(403, "You can only assign members of your own team");
  return unique;
};

const notifyAssigned = async (employeeIds, title) => {
  const users = await Employee.find({ _id: { $in: employeeIds } }).distinct("user");
  await notify(users, "training", `You have been assigned to the training "${title}"`, "/trainings");
};

// GET /api/trainings — HR: all; Manager: created by them or assigned; Employee: assigned
exports.getTrainings = async (req, res) => {
  let filter = {};
  const mine = req.employee ? { "participants.employee": req.employee._id } : null;
  if (req.user.role === "manager") filter = { $or: [{ createdBy: req.user._id }, ...(mine ? [mine] : [])] };
  if (req.user.role === "employee") filter = mine || { _id: null };

  res.json(await populateTraining(Training.find(filter).sort({ startDate: -1 })));
};

// GET /api/trainings/:id
exports.getTraining = async (req, res) => {
  const t = await populateTraining(Training.findById(req.params.id));
  if (!t) throw httpError(404, "Training not found");
  const participant = t.participants.some((p) => String(p.employee?._id) === String(req.employee?._id));
  if (req.user.role !== "hr" && !isCreator(req, t) && !participant) throw httpError(403, "Not allowed");
  res.json(t);
};

// POST /api/trainings  (Manager, HR) { title, description, trainer, startDate, endDate, participants: [employeeId] }
exports.createTraining = async (req, res) => {
  const { title, description, trainer, startDate, endDate, participants } = req.body || {};
  if (!title || !startDate || !endDate) throw httpError(400, "title, startDate and endDate are required");
  const start = toDay(startDate);
  const end = toDay(endDate);
  if (!start || !end || end < start) throw httpError(400, "Invalid training dates");

  const ids = await allowedParticipants(req, participants);
  const t = await Training.create({
    title,
    description,
    trainer,
    startDate: start,
    endDate: end,
    createdBy: req.user._id,
    participants: ids.map((employee) => ({ employee })),
  });
  await notifyAssigned(ids, title);
  res.status(201).json(await populateTraining(Training.findById(t._id)));
};

// PUT /api/trainings/:id  (creator or HR)
exports.updateTraining = async (req, res) => {
  const t = await Training.findById(req.params.id);
  if (!t) throw httpError(404, "Training not found");
  if (req.user.role !== "hr" && !isCreator(req, t)) throw httpError(403, "Only the creator can edit this");

  const { title, description, trainer, startDate, endDate } = req.body || {};
  if (title !== undefined) t.title = title;
  if (description !== undefined) t.description = description;
  if (trainer !== undefined) t.trainer = trainer;
  if (startDate) t.startDate = toDay(startDate);
  if (endDate) t.endDate = toDay(endDate);
  if (!t.startDate || !t.endDate || t.endDate < t.startDate) throw httpError(400, "Invalid training dates");
  await t.save();
  res.json(await populateTraining(Training.findById(t._id)));
};

// DELETE /api/trainings/:id  (creator or HR)
exports.deleteTraining = async (req, res) => {
  const t = await Training.findById(req.params.id);
  if (!t) throw httpError(404, "Training not found");
  if (req.user.role !== "hr" && !isCreator(req, t)) throw httpError(403, "Only the creator can delete this");
  await t.deleteOne();
  res.json({ message: "Training deleted" });
};

// POST /api/trainings/:id/assign  (creator or HR) { employees: [employeeId] }
exports.assignParticipants = async (req, res) => {
  const t = await Training.findById(req.params.id);
  if (!t) throw httpError(404, "Training not found");
  if (req.user.role !== "hr" && !isCreator(req, t)) throw httpError(403, "Only the creator can assign people");

  const ids = await allowedParticipants(req, req.body?.employees);
  const existing = t.participants.map((p) => String(p.employee));
  const added = ids.filter((id) => !existing.includes(String(id)));
  added.forEach((employee) => t.participants.push({ employee }));
  await t.save();
  await notifyAssigned(added, t.title);
  res.json(await populateTraining(Training.findById(t._id)));
};

// DELETE /api/trainings/:id/participants/:employeeId  (creator or HR)
exports.removeParticipant = async (req, res) => {
  const t = await Training.findById(req.params.id);
  if (!t) throw httpError(404, "Training not found");
  if (req.user.role !== "hr" && !isCreator(req, t)) throw httpError(403, "Not allowed");
  t.participants = t.participants.filter((p) => String(p.employee) !== req.params.employeeId);
  await t.save();
  res.json(await populateTraining(Training.findById(t._id)));
};

// PATCH /api/trainings/:id/progress  (participant) { status }
exports.updateProgress = async (req, res) => {
  const { status } = req.body || {};
  if (!["assigned", "in-progress", "completed"].includes(status)) throw httpError(400, "Invalid status");

  const t = await Training.findById(req.params.id);
  if (!t) throw httpError(404, "Training not found");
  const p = t.participants.find((x) => String(x.employee) === String(req.employee?._id));
  if (!p) throw httpError(403, "You are not assigned to this training");

  p.status = status;
  p.updatedAt = new Date();
  await t.save();
  res.json(await populateTraining(Training.findById(t._id)));
};
