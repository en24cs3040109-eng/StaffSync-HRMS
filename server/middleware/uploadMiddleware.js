const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "..", "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
  },
});

const allowed = [".jpg", ".jpeg", ".png", ".webp", ".pdf", ".doc", ".docx"];

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) return cb(null, true);
    const err = new Error("Only images, PDF and Word files are allowed");
    err.statusCode = 400;
    cb(err);
  },
});

const fileUrl = (file) => (file ? `/uploads/${file.filename}` : undefined);

module.exports = { upload, fileUrl };
