// Fills the database with demo data. Run: npm run seed
// WARNING: wipes all StaffSync collections first.
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");
const Employee = require("../models/Employee");
const Department = require("../models/Department");
const Leave = require("../models/Leave");
const Attendance = require("../models/Attendance");
const Announcement = require("../models/Announcement");
const Training = require("../models/Training");
const Notification = require("../models/Notification");

const PASSWORD = "password123";

const people = [
  { email: "hr@staffsync.com", role: "hr", firstName: "Priya", lastName: "Sharma", dept: "Human Resources", designation: "HR Manager" },
  { email: "manager.eng@staffsync.com", role: "manager", firstName: "Rahul", lastName: "Verma", dept: "Engineering", designation: "Engineering Manager" },
  { email: "manager.sales@staffsync.com", role: "manager", firstName: "Anjali", lastName: "Mehta", dept: "Sales", designation: "Sales Manager" },
  { email: "amit@staffsync.com", role: "employee", firstName: "Amit", lastName: "Patel", dept: "Engineering", designation: "Software Engineer", mgr: "manager.eng@staffsync.com" },
  { email: "sneha@staffsync.com", role: "employee", firstName: "Sneha", lastName: "Gupta", dept: "Engineering", designation: "Frontend Developer", mgr: "manager.eng@staffsync.com" },
  { email: "rohan@staffsync.com", role: "employee", firstName: "Rohan", lastName: "Singh", dept: "Engineering", designation: "QA Engineer", mgr: "manager.eng@staffsync.com" },
  { email: "kavya@staffsync.com", role: "employee", firstName: "Kavya", lastName: "Iyer", dept: "Sales", designation: "Sales Executive", mgr: "manager.sales@staffsync.com" },
  { email: "vikram@staffsync.com", role: "employee", firstName: "Vikram", lastName: "Joshi", dept: "Sales", designation: "Account Manager", mgr: "manager.sales@staffsync.com" },
];

const day = (offset) => {
  const d = new Date();
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate() + offset));
};

(async () => {
  await connectDB();
  await Promise.all(
    [User, Employee, Department, Leave, Attendance, Announcement, Training, Notification].map((m) => m.deleteMany({}))
  );

  const departments = {};
  for (const name of ["Human Resources", "Engineering", "Sales"]) {
    departments[name] = await Department.create({ name, description: `${name} department` });
  }

  const byEmail = {};
  let n = 1;
  for (const p of people) {
    const user = await User.create({ email: p.email, password: PASSWORD, role: p.role });
    byEmail[p.email] = await Employee.create({
      user: user._id,
      employeeId: `EMP${String(n++).padStart(4, "0")}`,
      firstName: p.firstName,
      lastName: p.lastName,
      phone: `98765${String(43210 + n).slice(-5)}`,
      address: "Indore, Madhya Pradesh",
      department: departments[p.dept]._id,
      designation: p.designation,
      salary: { hr: 85000, manager: 110000, employee: 60000 }[p.role],
      dateOfJoining: day(-365 + n * 20),
    });
    byEmail[p.email].userId = user._id;
  }
  for (const p of people.filter((x) => x.mgr)) {
    await Employee.updateOne({ _id: byEmail[p.email]._id }, { manager: byEmail[p.mgr]._id });
  }
  for (const [name, email] of [["Human Resources", "hr@staffsync.com"], ["Engineering", "manager.eng@staffsync.com"], ["Sales", "manager.sales@staffsync.com"]]) {
    await Department.updateOne({ _id: departments[name]._id }, { head: byEmail[email]._id });
  }

  // last 5 working days of attendance for everyone
  const records = [];
  for (const emp of Object.values(byEmail)) {
    for (let i = 1; i <= 7; i++) {
      const date = day(-i);
      if ([0, 6].includes(date.getUTCDay())) continue;
      const checkIn = new Date(date.getTime() + (3.5 + Math.random()) * 36e5); // ~9:00-10:00 IST
      const hours = 7 + Math.random() * 2;
      records.push({ employee: emp._id, date, checkIn, checkOut: new Date(checkIn.getTime() + hours * 36e5), workHours: Math.round(hours * 100) / 100, status: "present" });
    }
  }
  await Attendance.insertMany(records);

  const hrUser = byEmail["hr@staffsync.com"].userId;
  await Leave.create([
    { employee: byEmail["amit@staffsync.com"]._id, type: "casual", startDate: day(3), endDate: day(4), days: 2, reason: "Family function" },
    { employee: byEmail["kavya@staffsync.com"]._id, type: "sick", startDate: day(-10), endDate: day(-9), days: 2, reason: "Fever", status: "approved", reviewedBy: byEmail["manager.sales@staffsync.com"].userId, approverRole: "manager", reviewedAt: day(-11) },
  ]);
  await Employee.updateOne({ _id: byEmail["kavya@staffsync.com"]._id }, { $inc: { "leaveBalance.sick": -2 } });

  await Announcement.create([
    { title: "Welcome to StaffSync", content: "All HR processes now run through StaffSync. Mark your attendance daily and apply for leave here.", postedBy: hrUser, authorName: "Priya Sharma", pinned: true },
    { title: "Sprint review on Friday", content: "Engineering sprint review at 4 PM in the main conference room.", postedBy: byEmail["manager.eng@staffsync.com"].userId, authorName: "Rahul Verma", audience: "department", department: departments.Engineering._id },
    { title: "Manager sync every Monday", content: "All managers: weekly sync at 10 AM to review leave and training plans.", postedBy: hrUser, authorName: "Priya Sharma", audience: "managers" },
  ]);

  await Training.create({
    title: "React Best Practices",
    description: "Hooks, state management and testing for the frontend team.",
    trainer: "Rahul Verma",
    startDate: day(7),
    endDate: day(9),
    createdBy: byEmail["manager.eng@staffsync.com"].userId,
    participants: [{ employee: byEmail["amit@staffsync.com"]._id }, { employee: byEmail["sneha@staffsync.com"]._id, status: "in-progress" }],
  });

  console.log("\nSeed complete. Log in with any of these (password: " + PASSWORD + "):");
  people.forEach((p) => console.log(`  ${p.role.padEnd(8)} ${p.email}`));
  await mongoose.disconnect();
})().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
