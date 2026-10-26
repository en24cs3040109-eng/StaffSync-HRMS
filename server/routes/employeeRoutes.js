const router = require("express").Router();
const c = require("../controllers/employeeController");
const { protect, authorize } = require("../middleware/authMiddleware");
const { upload } = require("../middleware/uploadMiddleware");

router.use(protect);

router.get("/", authorize("hr", "manager"), c.getEmployees);
router.post("/", authorize("hr"), c.createEmployee);
router.get("/managers", authorize("hr"), c.getManagers);
router.get("/:id", c.getEmployee);
router.put("/:id", upload.single("avatar"), c.updateEmployee);
router.delete("/:id", authorize("hr"), c.deleteEmployee);
router.post("/:id/documents", upload.single("file"), c.uploadDocument);

module.exports = router;
