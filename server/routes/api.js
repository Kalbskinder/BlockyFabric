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

export default router;