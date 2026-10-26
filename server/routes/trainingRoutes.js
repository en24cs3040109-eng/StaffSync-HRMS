const router = require("express").Router();
const c = require("../controllers/trainingController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect);

router.get("/", c.getTrainings);
router.post("/", authorize("hr", "manager"), c.createTraining);
router.get("/:id", c.getTraining);
router.put("/:id", authorize("hr", "manager"), c.updateTraining);
router.delete("/:id", authorize("hr", "manager"), c.deleteTraining);
router.post("/:id/assign", authorize("hr", "manager"), c.assignParticipants);
router.delete("/:id/participants/:employeeId", authorize("hr", "manager"), c.removeParticipant);
router.patch("/:id/progress", c.updateProgress);

module.exports = router;
