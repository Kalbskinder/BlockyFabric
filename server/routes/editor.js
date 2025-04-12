import express from 'express';
import db from '../db.js';
import path from 'path'
import fs from 'fs';

const router = express.Router();

router.post('/save-workspace', async (req, res) => {
    const { workspaceState, projectId } = req.body;
    let userId;

    if (req.session.user) {
        userId = req.session.user.id;
    } else {
        return res.status(401).json({ message: "Not authorized" });
    }

    if (!userId || !workspaceState) {
        return res.status(400).json({ error: 'workspaceState is required' });
    }

    try {
        const query = `UPDATE projects SET workspace = ? WHERE id = ? AND user_id = ?`;
        await db.run(query, [JSON.stringify(workspaceState), projectId, userId]);

        res.json({ success: true, message: 'Workspace has been saved' });
    } catch (error) {
        res.status(500).json({ error: 'Error while trying to save the workspace', details: error.message });
    }
});

router.get('/load-workspace/:projectId', async (req, res) => {
    const { projectId } = req.params;
    let userId;

    if (req.session.user) {
        userId = req.session.user.id;
    } else {
        return res.status(401).json({ message: "Not authorized" });
    }

    try {
        const query = `SELECT workspace FROM projects WHERE id = ? AND user_id = ?`;
        const row = await db.get(query, [projectId, userId]);

        res.json({ workspaceState: JSON.parse(row.workspace) });
    } catch (error) {
        res.status(500).json({ error: 'Error while loading the workspace', details: error.message });
    }
});


router.get('/get-blocks', async (req, res) => {
    const filePath = path.join(__dirname, '../../frontend/public/src/editor/data/blocks/blocks.json');

    try {
        const jsonData = await fs.readFile(filePath, 'utf-8');
        const blocks = JSON.parse(jsonData);
        res.json(blocks);
    } catch (error) {
        console.error("Fehler beim Laden der Blöcke:", error);
        res.status(500).json({ message: "Error while loading custom blocks", error: error.message });
    }
});


export default router;
