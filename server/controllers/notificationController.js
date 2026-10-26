const Notification = require("../models/Notification");
const { httpError } = require("../utils/helpers");

// GET /api/notifications ?unread=true
exports.getNotifications = async (req, res) => {
  const filter = { recipient: req.user._id };
  if (req.query.unread === "true") filter.read = false;
  const [items, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).limit(50),
    Notification.countDocuments({ recipient: req.user._id, read: false }),
  ]);
  res.json({ items, unreadCount });
};

// PATCH /api/notifications/:id/read
exports.markRead = async (req, res) => {
  const n = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id },
    { read: true },
    { returnDocument: "after" }
  );
  if (!n) throw httpError(404, "Notification not found");
  res.json(n);
};

// PATCH /api/notifications/read-all
exports.markAllRead = async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id, read: false }, { read: true });
  res.json({ message: "All notifications marked as read" });
};
