import express from 'express';
import db from '../db.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

const baseBannerDir = path.join(__dirname, "../../frontend/public/images/users/");
const MAX_BANNER_SIZE = 1 * 1024 * 1024; // 1MB Limit
const ALLOWED_BANNER_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];

if (!fs.existsSync(baseBannerDir)) {
    fs.mkdirSync(baseBannerDir, { recursive: true });
    console.log(`Base banner folder created: ${baseBannerDir}`);
}

// Multer Storage für Banner
const bannerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (!req.session.user) {
            return cb(new Error("User not authenticated"), false);
        }

        const userId = req.session.user.id;
        const username = req.session.user.username.replace(/[^a-zA-Z0-9-_]/g, "_");
        const userBannerDir = path.join(baseBannerDir, `${userId}_${username}/banners`);

        if (!fs.existsSync(userBannerDir)) {
            fs.mkdirSync(userBannerDir, { recursive: true });
            console.log(`User banner folder created: ${userBannerDir}`);
        }

        cb(null, userBannerDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const modName = req.body.name.replace(/[^a-zA-Z0-9-_]/g, "_");
        cb(null, `banner_${modName}_${Date.now()}${ext}`);
    }
});

const bannerFileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_BANNER_EXTENSIONS.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error(`Invalid file type. Allowed: ${ALLOWED_BANNER_EXTENSIONS.join(', ')}`));
    }
};

// Multer Upload Middleware für Banner
const bannerUpload = multer({
    storage: bannerStorage,
    limits: { fileSize: MAX_BANNER_SIZE },
    fileFilter: bannerFileFilter
}).single("banner");

// Create new mod
router.post("/create", (req, res) => {
    bannerUpload(req, res, async function (err) {
        if (err instanceof multer.MulterError) {
            if (err.code === "LIMIT_FILE_SIZE") {
                return res.status(400).json({ error: "File too large (max. 1MB)" });
            }
        } else if (err) {
            return res.status(400).json({ error: err.message });
        }

        const { name, description, minecraft_version } = req.body;
        let user_id;
        if (req.session.user) {
            user_id = req.session.user.id;
        } else {
            return res.status(401).json({ error: "Not authorized" });
        }

        if (!name || !minecraft_version) {
            return res.status(400).json({ error: "Missing required fields." });
        }

        let bannerUrl = null;
        if (req.file) {
            const userId = req.session.user.id;
            const username = req.session.user.username.replace(/[^a-zA-Z0-9-_]/g, "_");
            bannerUrl = `/images/users/${userId}_${username}/banners/${req.file.filename}`;
        }

        try {
            const result = await db.run(
                "INSERT INTO projects (user_id, name, description, banner, minecraft_version) VALUES (?, ?, ?, ?, ?)",
                [user_id, name, description, bannerUrl, minecraft_version]
            );

            res.json({ success: true, id: result.lastID, bannerUrl });
        } catch (error) {
            res.status(500).json({ error: "Database error", details: error.message });
        }
    });
});

router.get("/get/:id", async (req, res) => {
    const { id } = req.params;
    let user_id;
    if (req.session.user) {
        user_id = req.session.user.id;
    } else {
        return res.status(401).json({ error: "Unauthorized" });
    }
    try {
        const project = await db.get("SELECT * FROM projects WHERE id =? AND user_id =?", [id, user_id]);
        if (!project) {
            return res.status(404).json({ error: "Project not found" });
        }
        res.json(project);
    } catch (error) {
        res.status(500).json({ error: "Database error", details: error.message });
    }
});

router.get("/get", async (req, res) => {
    let user_id;
    if (req.session.user) {
        user_id = req.session.user.id;
    } else {
        console.log(req.session.user)
        return res.status(401).json({ error: "Unauthorized" });
    }
    try {
        const projects = await db.all("SELECT * FROM projects WHERE user_id = ?", [user_id]);
        res.json(projects);
    } catch (error) {
        res.status(500).json({ error: "Database error", details: error.message });
    }
});

router.delete('/delete/:id', async (req, res) => {
    const { id } = req.params;
    let user_id;

    if (req.session.user) {
        user_id = req.session.user.id;
    } else {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        const project = await db.get("SELECT * FROM projects WHERE id = ? AND user_id = ?", [id, user_id]);

        if (!project) {
            return res.status(403).json({ error: "Forbidden: Project not found or not owned by user" });
        }

        if (project.banner) {
            const imagePath = path.join(__dirname, "../../frontend/public", project.banner);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            } else {
                console.log(`Tried deleting banner img but failed at path: ${imagePath}`);
            }
        }

        await db.run("DELETE FROM projects WHERE id = ?", [id]);

        res.json({ success: true, message: "Project & banner deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Database error", details: error.message });
    }
});


export default router;
