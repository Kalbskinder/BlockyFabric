// /routes/authRoutes.js
import express from 'express';
import bcrypt from 'bcrypt';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
        return res.status(401).json({ error: 'Username or email already exists.' });
    }

    const defaultProfileImage = "/images/users/profileimages/default.png";
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        await db.run(
            "INSERT INTO users (username, email, password, profileImage) VALUES (?, ?, ?, ?)",
            [username, email, hashedPassword, defaultProfileImage]
        );
        res.json({ success: true, message: "User registered successfully!" });
    } catch (err) {
        res.status(500).json({ error: "Database error." });
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

    req.session.user = { 
        id: user.id, 
        username: user.username ,
        profileImage: user.profileImage || "/images/users/profileimages/default.png",
        email: user.email
    };
    res.json({ success: true, message: 'Logged in successfully!' });
});

router.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Error destroying session:", err);
            return res.status(500).send("Logout failed");
        }

        res.clearCookie("connect.sid", {
            path: "/", 
            httpOnly: true,
            secure: false
        });

        console.log("User logged out, session & cookie deleted.");
        res.redirect("/login");
    });
});



export default router;
