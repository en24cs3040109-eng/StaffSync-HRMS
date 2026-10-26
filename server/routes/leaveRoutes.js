const router = require("express").Router();
const c = require("../controllers/leaveController");
const { protect, authorize } = require("../middleware/authMiddleware");
const { upload } = require("../middleware/uploadMiddleware");

router.use(protect);

router.post("/", upload.single("attachment"), c.applyLeave);
router.get("/my", c.getMyLeaves);
router.get("/report", authorize("hr"), c.getLeaveReport);
router.get("/", authorize("hr", "manager"), c.getLeaves);
router.patch("/:id/status", authorize("hr", "manager"), c.updateLeaveStatus);
router.patch("/:id/cancel", c.cancelLeave);

module.exports = router;
