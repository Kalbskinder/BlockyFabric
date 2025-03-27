import sqlite3 from "sqlite3";
import { open } from "sqlite";

const db = await open({
    filename: "./database/database.sqlite",
    driver: sqlite3.Database
});

// Sicherstellen, dass die Tabelle existiert, und die profileImage-Spalte hinzufügen, wenn sie noch nicht vorhanden ist
await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        profileImage TEXT
    )
`);

console.log("Connected to SQLite database and ensured users table exists.");

// Überprüfe, ob die Spalte 'profileImage' bereits existiert, und wenn nicht, füge sie hinzu
const result = await db.all("PRAGMA table_info(users);");  // Verwende db.all statt db.get
const columnNames = result.map((column) => column.name);
if (!columnNames.includes('profileImage')) {
    await db.exec("ALTER TABLE users ADD COLUMN profileImage TEXT;");
    console.log("Added profileImage column to users table.");
}

export default db;
