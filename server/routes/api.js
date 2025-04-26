import express from 'express';
import db from '../db.js';

const router = express.Router();

router.get('/loggedIn', (req, res) => {
    if (req.session.user) {
        res.json({ loggedIn: true });
    } else {
        res.json({ loggedIn: false });
    }
    return res.status(200);
});

router.get('/users/:id', async (req, res) => { 
    let userId = parseInt(req.params.id, 10);

    if (isNaN(userId)) {
        if (req.session.user) {
            userId = req.session.user.id;
        } else {
            return res.status(401).json({ error: "You must be logged in to view your Profile" });
        }
    }

    try {
        const user = await db.get(
            'SELECT id, username, profileImage FROM users WHERE id = ?',
            [userId]
        );

        if (!user) {    
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ error: 'Database error', details: error.message });
    }
});

router.get('/getproject/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const projects = await db.all("SELECT * FROM projects WHERE visibility = 'public' AND user_id = ?", [id]);

        if (!projects) {
            if (!projects || projects.length === 0) {
                return res.json([]);
            }
        }

        res.json(projects);
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ error: 'Database error', details: error.message });
    }
});

router.get('/getSettings/:id', async (req, res) => {
    const { id } = req.params;
    let user_id;

    if (req.session.user) {
        user_id = req.session.user.id;
    } else {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        const project = await db.get("SELECT name, description, visibility FROM projects WHERE id =? AND user_id =?", [id, user_id]);
        if (!project) {
            return res.status(404).json({ error: "Project not found" });
        }
        res.json(project);
    } catch (error) {    
        res.status(500).json({ error: "Database error", details: error.message });
    }
});

router.post('/updateSettings/:id', async (req, res) => {
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
        const { name, description, visibility } = req.body;
        await db.run("UPDATE projects SET name = ?, description = ?, visibility = ? WHERE id = ?", [name, description, visibility, id]);
        res.json({ success: true, message: "Settings updated successfully" });
    } catch (error) {    
        res.status(500).json({ error: "Database error", details: error.message });
    }
});

export default router;