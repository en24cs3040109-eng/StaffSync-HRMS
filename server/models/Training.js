const mongoose = require("mongoose");

const trainingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: String,
    trainer: String,
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    participants: [
      {
        employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
        status: {
          type: String,
          enum: ["assigned", "in-progress", "completed"],
          default: "assigned",
        },
        updatedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Training", trainingSchema);
