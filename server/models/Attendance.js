const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
    date: { type: Date, required: true },
    checkIn: Date,
    checkOut: Date,
    status: {
      type: String,
      enum: ["present", "absent", "half-day", "leave"],
      default: "present",
    },
    workHours: { type: Number, default: 0 },
    note: String,
  },
  { timestamps: true }
);

attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", attendanceSchema);
