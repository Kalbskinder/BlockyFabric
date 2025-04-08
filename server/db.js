import sqlite3 from "sqlite3";
import { open } from "sqlite";

const db = await open({
    filename: "./database/database.sqlite",
    driver: sqlite3.Database
});

await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        profileImage TEXT,
        theme TEXT DEFAULT 'default'
    )
`);

await db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        banner TEXT,
        minecraft_version TEXT NOT NULL,
        visibility TEXT CHECK(visibility IN ('public', 'private')),
        views INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
`);

console.log('\x1b[36m%s\x1b[0m', "[Server] Connected to SQLite database and ensured tables exist.");

export default db;
