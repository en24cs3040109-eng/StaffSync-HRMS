const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    authorName: String,
    audience: { type: String, enum: ["all", "department", "employees", "managers"], default: "all" },
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
    pinned: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Announcement", announcementSchema);
