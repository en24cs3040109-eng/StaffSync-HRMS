const Department = require("../models/Department");
const Employee = require("../models/Employee");
const { httpError } = require("../utils/helpers");

// GET /api/departments
exports.getDepartments = async (req, res) => {
  const departments = await Department.find().sort({ name: 1 }).populate("head", "firstName lastName").lean();
  const counts = await Employee.aggregate([{ $group: { _id: "$department", count: { $sum: 1 } } }]);
  const byId = Object.fromEntries(counts.map((c) => [String(c._id), c.count]));
  res.json(departments.map((d) => ({ ...d, employeeCount: byId[String(d._id)] || 0 })));
};

// POST /api/departments  (HR)
exports.createDepartment = async (req, res) => {
  const { name, description, head } = req.body || {};
  if (!name) throw httpError(400, "Department name is required");
  const dept = await Department.create({ name, description, head: head || undefined });
  res.status(201).json(dept);
};

// PUT /api/departments/:id  (HR)
exports.updateDepartment = async (req, res) => {
  const dept = await Department.findById(req.params.id);
  if (!dept) throw httpError(404, "Department not found");
  const { name, description, head } = req.body || {};
  if (name !== undefined) dept.name = name;
  if (description !== undefined) dept.description = description;
  if (head !== undefined) dept.head = head || undefined;
  await dept.save();
  res.json(dept);
};

// DELETE /api/departments/:id  (HR)
exports.deleteDepartment = async (req, res) => {
  const inUse = await Employee.countDocuments({ department: req.params.id });
  if (inUse) throw httpError(400, `Move the ${inUse} employee(s) in this department first`);
  const dept = await Department.findByIdAndDelete(req.params.id);
  if (!dept) throw httpError(404, "Department not found");
  res.json({ message: "Department deleted" });
};
