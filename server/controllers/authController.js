const User = require("../models/User");
const Employee = require("../models/Employee");
const generateToken = require("../utils/generateToken");

const profileFor = (userId) =>
  Employee.findOne({ user: userId })
    .populate("department", "name")
    .populate("manager", "firstName lastName employeeId");

// POST /api/auth/login
exports.login = async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }
  if (!user.isActive) {
    return res.status(403).json({ message: "Your account has been deactivated. Contact HR." });
  }

  res.json({
    token: generateToken(user),
    user: { _id: user._id, email: user.email, role: user.role },
    employee: await profileFor(user._id),
  });
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  res.json({
    user: { _id: req.user._id, email: req.user.email, role: req.user.role },
    employee: await profileFor(req.user._id),
  });
};

// PUT /api/auth/change-password
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "Current and new password are required" });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ message: "New password must be at least 6 characters" });
  }

  const user = await User.findById(req.user._id).select("+password");
  if (!(await user.matchPassword(currentPassword))) {
    return res.status(401).json({ message: "Current password is incorrect" });
  }

  user.password = newPassword;
  await user.save();
  res.json({ message: "Password updated" });
};
