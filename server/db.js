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
        password TEXT NOT NULL
    )
`);

console.log("Connected to SQLite database.");

export default db;
