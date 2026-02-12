const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, '..', '..', 'database.db');

let db;

function getDatabase() {
    if (!db) {
        db = new Database(DB_PATH);
        db.pragma('journal_mode = WAL');
        initializeDatabase();
    }
    return db;
}

function initializeDatabase() {
    db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      age INTEGER NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'USER',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

    // Seed an admin user if no users exist
    const count = db.prepare('SELECT COUNT(*) as count FROM users').get();
    if (count.count === 0) {
        const { v4: uuidv4 } = require('uuid');
        const hashedPassword = bcrypt.hashSync('admin123!', 10);
        db.prepare(`
      INSERT INTO users (id, name, email, age, password, role)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), 'Admin', 'admin@example.com', 30, hashedPassword, 'ADMIN');
    }
}

module.exports = { getDatabase };
