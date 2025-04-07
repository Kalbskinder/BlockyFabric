import express from 'express';
import db from '../db.js';

const router = express.Router();

router.get("/", (req, res) => {
    let session;
    if (req.session.user) {
        session = req.session.user;
    } else {
        res.render('pages/404');
    } 
    if (session.username === 'simon') {
        res.render('pages/admin');
    } else {
        res.render('pages/404')
    }
});


router.get("/users", async (req, res) => {
    try {
        const users = await db.all('SELECT id, username, email, profileImage FROM users WHERE id != 1');
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: "Databaseerror", details: error.message });
    }
});

router.delete('/users/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const response = await db.all('DELETE FROM users WHERE id = ?', [userId]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Fehler beim Löschen des Benutzers' });
    }
});

export default router;