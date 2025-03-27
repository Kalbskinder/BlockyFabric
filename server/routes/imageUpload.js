import fs from 'fs';
import path from 'path';
import multer from 'multer';
import express from 'express';
import db from "../db.js";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

// Definiere den Speicherort
const uploadDir = path.join(__dirname, "../../frontend/public/images/users/profileimages");
const MAX_FILE_SIZE = 2 * 1024 * 1024;

// Überprüfen, ob der Ordner existiert und gegebenenfalls erstellen
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true }); // rekursiv, um auch Unterordner zu erstellen
    console.log(`Ordner erstellt: ${uploadDir}`);
}

// Multer Storage-Konfiguration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Hier wird der Upload-Ordner verwendet
        cb(null, uploadDir); // speichert die Datei im richtigen Ordner
    },
    filename: (req, file, cb) => {
        // Speichert die Datei mit einem eindeutigen Namen (user_id)
        cb(null, `user_${req.session.user.id}${path.extname(file.originalname)}`);
    }
});

// Multer initialisieren
const upload = multer({ 
    storage: storage,
    limits: { fileSize: MAX_FILE_SIZE },
});

// POST-Route für den Bild-Upload
router.post("/upload-profile-image", upload.single("profileImage"), (req, res) => {
    console.log("Upload attempt!");

    if (!req.file) {
        return res.status(400).json({ error: "Keine Datei hochgeladen!" });
    }

    const imageUrl = `/images/users/profileimages/${req.file.filename}`;
    req.session.user.profileImage = imageUrl;
    console.log("File saved as:", imageUrl);

    db.run("UPDATE users SET profileImage = ? WHERE id = ?", [imageUrl, req.session.user.id], (err) => {
        if (err) return res.status(500).json({ error: "Database error" });
        req.session.user.profileImage = imageUrl; // Update the session
        res.json({ success: true, imageUrl });
    });

    res.status(200).json({ "success": true});
});

router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({ error: "File too big (max. 4MB) or no file provided" });
        }
    } else if (err) {
        return res.status(400).json({ error: err.message });
    } 
    next();
});

export default router;