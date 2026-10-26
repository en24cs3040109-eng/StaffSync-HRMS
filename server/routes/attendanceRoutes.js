const router = require("express").Router();
const c = require("../controllers/attendanceController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect);

router.post("/check-in", c.checkIn);
router.post("/check-out", c.checkOut);
router.get("/today", c.getToday);
router.get("/my", c.getMyAttendance);
router.get("/report", authorize("hr"), c.getAttendanceReport);
router.post("/mark", authorize("hr"), c.markAttendance);
router.get("/", authorize("hr", "manager"), c.getAttendance);
router.put("/:id", authorize("hr"), c.updateAttendance);

module.exports = router;
