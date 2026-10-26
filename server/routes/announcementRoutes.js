const router = require("express").Router();
const c = require("../controllers/announcementController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect);

router.get("/", c.getAnnouncements);
router.post("/", authorize("hr", "manager"), c.createAnnouncement);
router.put("/:id", authorize("hr", "manager"), c.updateAnnouncement);
router.delete("/:id", authorize("hr", "manager"), c.deleteAnnouncement);

module.exports = router;
