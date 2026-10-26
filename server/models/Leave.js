const mongoose = require("mongoose");

const leaveSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
    type: { type: String, enum: ["casual", "sick", "earned", "unpaid"], required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    days: { type: Number, required: true },
    reason: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled"],
      default: "pending",
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    approverRole: { type: String, enum: ["hr", "manager"] },
    reviewComment: String,
    reviewedAt: Date,
    attachment: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Leave", leaveSchema);
