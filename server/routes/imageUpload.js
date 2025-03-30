import fs from 'fs';
import path from 'path';
import multer from 'multer';
import express from 'express';
import db from "../db.js";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

const baseUploadDir = path.join(__dirname, "../../frontend/public/images/users/");
const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1 MB
const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];

// Prüfen, ob der Basis-Upload-Ordner existiert
if (!fs.existsSync(baseUploadDir)) {
    fs.mkdirSync(baseUploadDir, { recursive: true });
    console.log(`Base folder created: ${baseUploadDir}`);
}

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (!req.session.user) {
            return cb(new Error("User not authenticated"), false);
        }

        const userId = req.session.user.id;
        const username = req.session.user.username.replace(/[^a-zA-Z0-9-_]/g, "_"); // Sichere Dateinamen
        const userDir = path.join(baseUploadDir, `${userId}_${username}`);

        // Erstelle den User-Ordner, falls er nicht existiert
        if (!fs.existsSync(userDir)) {
            fs.mkdirSync(userDir, { recursive: true });
            console.log(`User folder created: ${userDir}`);
        }

        cb(null, userDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `profilimage${ext}`); // Speichert als "profilimage.png/jpg/..."
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

    let userId
    let username;

    if (req.session.user) {
        userId = req.session.user.id;
        username = req.session.user.username.replace(/[^a-zA-Z0-9-_]/g, "_");
    } else {
        return res.status(401).json({ error: "Not authorized" });
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    const imageUrl = `/images/users/${userId}_${username}/profilimage${ext}`;

    // Profilbild-URL in die Session & Datenbank schreiben
    req.session.user.profileImage = imageUrl;

    db.run("UPDATE users SET profileImage = ? WHERE id = ?", [imageUrl, userId], (err) => {
        if (err) return res.status(500).json({ error: "Database error" });
    });

    res.status(200).json({ success: true, imageUrl });

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
