import express from "express";
import db from "../db.js";
import bcrypt from "bcrypt";

const router = express.Router();

// Change username
router.post("/username", async (req, res) => {
    const userId = req.session.user.id;
    const { username } = req.body;

    if (!userId || !username) {
        return res.status(400).json({ error: "Something went wrong" });
    }

    const usernameRegex = /^[a-zA-Z0-9]+$/;
    if (username.length > 12) {
        return res.status(400).json({ error: "Username cannot be longer than 12 characters." });
    }
    if (!usernameRegex.test(username)) {
        return res.status(400).json({ error: "Username can only contain letters and numbers." });
    }

    try {
        const existing = await db.get("SELECT id FROM users WHERE username = ?", [username]);
        if (existing) {
            return res.status(400).json({ error: "Username is already taken" });
        }

        await db.run("UPDATE users SET username = ? WHERE id = ?", [username, userId]);
        req.session.user.username = username; // Update the session with the new username
        res.json({ message: "Username has been updated!" });
    } catch (err) {
        res.status(500).json({ error: "Servererror", details: err.message });
    }
});
router.post("/password", async (req, res) => {
    const userId = req.session.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!userId || !currentPassword || !newPassword) {
        return res.status(400).json({ error: "Please fill in all fields." });
    }

    if (newPassword.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters long" });
    }

    try {
        const user = await db.get("SELECT * FROM users WHERE id = ?", [userId]);

        if (!user) {
            return res.status(400).json({ error: "User not found" });
        }

        const match = await bcrypt.compare(currentPassword, user.password);
        if (!match) {
            return res.status(400).json({ error: "Current password is incorrect" });
        }

        const hashed = await bcrypt.hash(newPassword, 10);
        await db.run("UPDATE users SET password = ? WHERE id = ?", [hashed, userId]);
        res.json({ message: "Password updated" });
    } catch (err) {
        res.status(500).json({ error: "Servererror", details: err.message });
    }
});

router.post("/themes", (req, res) => {
    const userId = req.session.user.id;
    const { theme } = req.body;

    if (!userId) {
        return res.status(401).json({ error: "Not authorized" });
    }

    if (!theme) {
        return res.status(400).json({ error: "Theme is required" });
    }

    try {
        req.session.user.theme = theme;
        db.run("UPDATE users SET theme = ? WHERE id = ?", [theme, userId], (err) => {
            if (err) {
                return res.status(500).json({ error: "Database error", details: err.message });
            }
        });
        return res.status(200).json({ message: "Theme updated" });
    } catch (error) {
        return res.status(500).json({ error: "Server error", details: error.message });
    }

});

export default router;