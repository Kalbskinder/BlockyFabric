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

router.post('/register', async (req, res) => {
    const { username, email, password, confirmPassword } = req.body;
    const db = await dbPromise;

    let errors = []; // Save multiple errors

    // Check if fields were provided
    if (!username || !email || !password || !confirmPassword) {
        errors.push({ field: 'general', error: 'All fields are required.' });
    }

    // Check username for lenght and format
    const usernameRegex = /^[a-zA-Z0-9]+$/;
    if (username.length > 12) {
        errors.push({ field: 'username', error: 'Username cannot be longer than 12 characters.' });
    }
    if (!usernameRegex.test(username)) {
        errors.push({ field: 'username', error: 'Username can only contain letters and numbers.' });
    }

    // Check email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        errors.push({ field: 'email', error: 'Invalid email format.' });
    }

    // Check password length
    if (password.length < 8) {
        errors.push({ field: 'password', error: 'Password must be at least 8 characters long.' });
    }

    // Check if both password math
    if (password !== confirmPassword) {
        errors.push({ field: 'confirm-password', error: 'Passwords do not match.' });
    }

    // Check if username or email already exists
    const existingUser = await db.get('SELECT * FROM users WHERE username = ? OR email = ?', [username, email]);
    if (existingUser) {
        errors.push({ field: 'email', error: 'Username or email is already taken.' });
    }

    // If there were errors, return them
    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }

    // Set default profilepicture and hash password
    const defaultProfileImage = "/images/users/profileimages/default.png";
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        await db.run(
            "INSERT INTO users (username, email, password, profileImage) VALUES (?, ?, ?, ?)",
            [username, email, hashedPassword, defaultProfileImage]
        );
        res.json({ success: true, message: "User registered successfully!" });
    } catch (err) {
        console.error("Database error:", err);
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
        email: user.email,
        theme: user.theme || 'default'
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

        res.redirect("/");
    });
});

export default router;
