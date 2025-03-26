// /routes/authRoutes.js
import express from 'express';
import bcrypt from 'bcrypt';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import session from 'express-session';

const router = express.Router();
const dbPromise = open({
    filename: './database/database.sqlite',
    driver: sqlite3.Database
});

// Registrierung
router.post('/register', async (req, res) => {
    const { username, email, password, confirmPassword } = req.body;

    if (!username || !email || !password || password.length < 8 || password !== confirmPassword) {
        return res.status(400).json({ error: 'Invalid input data.' });
    }

    const db = await dbPromise;
    const existingUser = await db.get('SELECT * FROM users WHERE username = ? OR email = ?', [username, email]);

    if (existingUser) {
        return res.status(400).json({ error: 'Username or email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    try {
        await db.run('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [username, email, hashedPassword]);
        res.json({ success: true, message: 'User registered successfully!' });
    } catch (err) {
        res.status(500).json({ error: 'Database error.' });
    }
});

// Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const db = await dbPromise;
    
    // Check if user exists (either username or email)
    const user = await db.get('SELECT * FROM users WHERE email = ? OR username = ?', [email, email]);

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: 'Invalid credentials.' });
    }

    req.session.user = { id: user.id, username: user.username };
    res.json({ success: true, message: 'Logged in successfully!' });
    console.log("Logged in successfully as " + user.username)
});

export default router;
