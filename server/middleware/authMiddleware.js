const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Employee = require("../models/Employee");

// Verifies the Bearer token and attaches req.user (+ req.employee profile)
const protect = async (req, res, next) => {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  let decoded;
  try {
    decoded = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ message: "Not authorized, invalid or expired token" });
  }

  const user = await User.findById(decoded.id);
  if (!user || !user.isActive) {
    return res.status(401).json({ message: "Account not found or deactivated" });
  }

  req.user = user;
  req.employee = await Employee.findOne({ user: user._id });
  next();
};

// Usage: authorize("hr", "manager")
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: `Role '${req.user.role}' is not allowed to do this` });
  }
  next();
};

module.exports = { protect, authorize };
