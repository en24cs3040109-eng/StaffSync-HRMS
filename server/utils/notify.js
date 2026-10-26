const Notification = require("../models/Notification");

// recipients: one user id or an array of user ids
const notify = async (recipients, type, message, link) => {
  const list = (Array.isArray(recipients) ? recipients : [recipients]).filter(Boolean);
  if (!list.length) return;
  try {
    await Notification.insertMany(list.map((recipient) => ({ recipient, type, message, link })));
  } catch (err) {
    console.error("Notification failed:", err.message);
  }
};

module.exports = notify;
