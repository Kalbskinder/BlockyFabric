import fs from 'fs';
import path from 'path';
import multer from 'multer';
import express from 'express';
import db from "../db.js";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

const uploadDir = path.join(__dirname, "../../frontend/public/images/users/profileimages");
const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1 MB

// Allowed file extensions
const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];

// Create directory if not exists
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log(`Folder created: ${uploadDir}`);
}

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `user_${req.session.user.id}${path.extname(file.originalname)}`);
    }
});

// File filter to allow only specific formats
const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_EXTENSIONS.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error(`Invalid file type. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`));
    }
};

// Initialize multer
const upload = multer({ 
    storage: storage,
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter: fileFilter
});

// Profile image upload route
router.post("/upload-profile-image", upload.single("profileImage"), (req, res) => {

    if (!req.file) {
        return res.status(400).json({ error: "No file selected" });
    }

    const imageUrl = `/images/users/profileimages/${req.file.filename}`;
    req.session.user.profileImage = imageUrl;
    console.log("File saved as:", imageUrl);

    db.run("UPDATE users SET profileImage = ? WHERE id = ?", [imageUrl, req.session.user.id], (err) => {
        if (err) return res.status(500).json({ error: "Database error" });
        req.session.user.profileImage = imageUrl; // Update session
        res.json({ success: true, imageUrl });
    });

});

// Global error handler for multer errors
router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({ error: "File too big (max. 1MB)" });
        }
    } else if (err) {
        return res.status(400).json({ error: err.message });
    } 
    next();
});

export default router;
