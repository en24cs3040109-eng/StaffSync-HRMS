const User = require("../models/User");
const Employee = require("../models/Employee");
const { getTeamIds, httpError } = require("../utils/helpers");
const { fileUrl } = require("../middleware/uploadMiddleware");

const populateEmployee = (query) =>
  query
    .populate("user", "email role isActive")
    .populate("department", "name")
    .populate("manager", "firstName lastName employeeId");

const isSelf = (req, emp) => String(emp.user._id || emp.user) === String(req.user._id);
const isTeamMember = (req, emp) =>
  req.user.role === "manager" && req.employee && String(emp.manager?._id || emp.manager) === String(req.employee._id);

// salary is visible to HR and the employee themself, hidden from managers
const hideSalary = (req, emp) => {
  if (!emp || req.user.role === "hr" || isSelf(req, emp)) return emp;
  const obj = emp.toJSON();
  delete obj.salary;
  return obj;
};

const canView = (req, emp) => req.user.role === "hr" || isSelf(req, emp) || isTeamMember(req, emp);

const nextEmployeeId = async () => {
  const count = await Employee.countDocuments();
  let n = count + 1;
  // skip ids that are already taken
  while (await Employee.exists({ employeeId: `EMP${String(n).padStart(4, "0")}` })) n += 1;
  return `EMP${String(n).padStart(4, "0")}`;
};

// GET /api/employees  (HR: all, Manager: own team)
exports.getEmployees = async (req, res) => {
  const { department, role, search, status } = req.query;
  const filter = {};

  if (req.user.role === "manager") {
    filter._id = { $in: await getTeamIds(req.employee) };
  }
  if (department) filter.department = department;
  if (search) {
    const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ firstName: rx }, { lastName: rx }, { employeeId: rx }, { designation: rx }];
  }

  let employees = await populateEmployee(Employee.find(filter).sort({ createdAt: -1 }));

  if (role) employees = employees.filter((e) => e.user?.role === role);
  if (status === "active") employees = employees.filter((e) => e.user?.isActive);
  if (status === "inactive") employees = employees.filter((e) => !e.user?.isActive);

  res.json(employees.map((emp) => hideSalary(req, emp)));
};

// GET /api/employees/managers  (for dropdowns when assigning a manager)
exports.getManagers = async (req, res) => {
  const managerUsers = await User.find({ role: "manager", isActive: true }).distinct("_id");
  const managers = await Employee.find({ user: { $in: managerUsers } })
    .select("firstName lastName employeeId department")
    .populate("department", "name");
  res.json(managers);
};

// GET /api/employees/:id
exports.getEmployee = async (req, res) => {
  const emp = await populateEmployee(Employee.findById(req.params.id));
  if (!emp) throw httpError(404, "Employee not found");
  if (!canView(req, emp)) throw httpError(403, "You cannot view this employee");
  res.json(hideSalary(req, emp));
};

// POST /api/employees  (HR) — creates the login (User) and the profile (Employee)
exports.createEmployee = async (req, res) => {
  const { email, password, role = "employee", employeeId, firstName, lastName, ...rest } = req.body || {};

  if (!email || !password || !firstName || !lastName) {
    throw httpError(400, "email, password, firstName and lastName are required");
  }
  if (!["hr", "manager", "employee"].includes(role)) throw httpError(400, "Invalid role");
  if (await User.exists({ email: email.toLowerCase().trim() })) {
    throw httpError(409, "A user with this email already exists");
  }

  const user = await User.create({ email, password, role });

  try {
    const profile = await Employee.create({
      user: user._id,
      employeeId: employeeId || (await nextEmployeeId()),
      firstName,
      lastName,
      phone: rest.phone,
      address: rest.address,
      department: rest.department || undefined,
      designation: rest.designation,
      salary: rest.salary,
      manager: rest.manager || undefined,
      dateOfJoining: rest.dateOfJoining || undefined,
      leaveBalance: rest.leaveBalance,
    });
    res.status(201).json(await populateEmployee(Employee.findById(profile._id)));
  } catch (err) {
    await User.findByIdAndDelete(user._id); // roll back the login if the profile fails
    throw err;
  }
};

// PUT /api/employees/:id  (HR: everything, self: contact details + avatar)
exports.updateEmployee = async (req, res) => {
  const emp = await Employee.findById(req.params.id);
  if (!emp) throw httpError(404, "Employee not found");

  const body = req.body || {};
  const hr = req.user.role === "hr";
  if (!hr && !isSelf(req, emp)) throw httpError(403, "You can only edit your own profile");

  const selfFields = ["phone", "address"];
  const hrFields = [
    ...selfFields,
    "firstName",
    "lastName",
    "employeeId",
    "department",
    "designation",
    "salary",
    "manager",
    "dateOfJoining",
  ];

  for (const field of hr ? hrFields : selfFields) {
    if (body[field] !== undefined) emp[field] = body[field] === "" ? undefined : body[field];
  }
  if (hr && body.leaveBalance) {
    for (const k of ["casual", "sick", "earned"]) {
      if (body.leaveBalance[k] !== undefined) emp.leaveBalance[k] = Number(body.leaveBalance[k]);
    }
  }
  if (req.file) emp.avatar = fileUrl(req.file);
  if (hr && emp.manager && String(emp.manager) === String(emp._id)) {
    throw httpError(400, "An employee cannot be their own manager");
  }
  await emp.save();

  if (hr && (body.email || body.role || body.isActive !== undefined)) {
    const user = await User.findById(emp.user);
    if (body.email) user.email = body.email;
    if (body.role) user.role = body.role;
    if (body.isActive !== undefined) user.isActive = body.isActive === true || body.isActive === "true";
    await user.save();
  }

  res.json(await populateEmployee(Employee.findById(emp._id)));
};

// DELETE /api/employees/:id  (HR) — deactivates the account, keeps history
exports.deleteEmployee = async (req, res) => {
  const emp = await Employee.findById(req.params.id);
  if (!emp) throw httpError(404, "Employee not found");
  if (String(emp.user) === String(req.user._id)) throw httpError(400, "You cannot deactivate yourself");

  await User.findByIdAndUpdate(emp.user, { isActive: false });
  res.json({ message: "Employee deactivated" });
};

// POST /api/employees/:id/documents  (HR or self) — multipart field "file"
exports.uploadDocument = async (req, res) => {
  const emp = await Employee.findById(req.params.id);
  if (!emp) throw httpError(404, "Employee not found");
  if (req.user.role !== "hr" && !isSelf(req, emp)) throw httpError(403, "Not allowed");
  if (!req.file) throw httpError(400, "No file uploaded (use field name 'file')");

  emp.documents.push({ name: req.body?.name || req.file.originalname, url: fileUrl(req.file) });
  await emp.save();
  res.status(201).json(emp.documents);
};
