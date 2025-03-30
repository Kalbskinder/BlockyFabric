import express from "express";
import db from '../db.js';
import multer from 'multer';

const router = express.Router();

router.post("/create", async (req, res) => {
    const { name, description, banner, minecraft_version } = req.body;
    let user_id;
    if (req.session.user) {
        user_id = req.session.user.id;
    } else {
        res.status(401).json({ error: "Not authorized" });
    }

    if (!name || !minecraft_version) {
        return res.status(400).json({ error: "Missing required fields." });
    }

    try {
        const result = await db.run(
            "INSERT INTO projects (user_id, name, description, banner, minecraft_version) VALUES (?, ?, ?, ?, ?)",
            [user_id, name, description, banner, minecraft_version]
        );

        res.json({ success: true, id: result.lastID });
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

router.delete('/delete/:id', async (req, res) => {
    const { id } = req.params;
    let user_id;

    if (req.session.user) {
        user_id = req.session.user.id;
    } else {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        // Check if project exists and belongs to the user
        const project = await db.get("SELECT * FROM projects WHERE id = ? AND user_id = ?", [id, user_id]);

        if (!project) {
            return res.status(403).json({ error: "Forbidden: Project not found or not owned by user" });
        }

        // Delete the project from the database
        await db.run("DELETE FROM projects WHERE id = ?", [id]);

        res.json({ success: true, message: "Project deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Database error", details: error.message });
    }
});


export default router;