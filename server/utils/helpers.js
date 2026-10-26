const Employee = require("../models/Employee");
const User = require("../models/User");

// Employee _ids of active accounts that report to this manager's Employee profile
const getTeamIds = async (managerEmployee) => {
  if (!managerEmployee) return [];
  const activeUsers = await User.find({ isActive: true }).distinct("_id");
  return Employee.find({ manager: managerEmployee._id, user: { $in: activeUsers } }).distinct("_id");
};

// Today's date at 00:00 UTC, based on the server's local calendar day
const today = () => {
  const d = new Date();
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
};

// Parses "YYYY-MM-DD" (or any date) to 00:00 UTC of that day
const toDay = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

const httpError = (status, message) => {
  const err = new Error(message);
  err.statusCode = status;
  return err;
};

module.exports = { getTeamIds, today, toDay, httpError };
