const { getDatabase } = require('../config/database');

class UserRepository {
    findAll() {
        const db = getDatabase();
        return db.prepare('SELECT id, name, email, age, role, created_at, updated_at FROM users').all();
    }

    findById(id) {
        const db = getDatabase();
        return db.prepare('SELECT id, name, email, age, role, created_at, updated_at FROM users WHERE id = ?').get(id);
    }

    findByIdWithPassword(id) {
        const db = getDatabase();
        return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    }

    findByName(name) {
        const db = getDatabase();
        return db.prepare('SELECT id, name, email, age, role, created_at, updated_at FROM users WHERE name LIKE ?').all(`%${name}%`);
    }

    findByEmail(email) {
        const db = getDatabase();
        return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    }

    create(user) {
        const db = getDatabase();
        const stmt = db.prepare(`
      INSERT INTO users (id, name, email, age, password, role)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
        stmt.run(user.id, user.name, user.email, user.age, user.password, user.role);
        return this.findById(user.id);
    }

    update(id, data) {
        const db = getDatabase();
        const fields = [];
        const values = [];

        if (data.name !== undefined) {
            fields.push('name = ?');
            values.push(data.name);
        }
        if (data.email !== undefined) {
            fields.push('email = ?');
            values.push(data.email);
        }
        if (data.age !== undefined) {
            fields.push('age = ?');
            values.push(data.age);
        }
        if (data.password !== undefined) {
            fields.push('password = ?');
            values.push(data.password);
        }
        if (data.role !== undefined) {
            fields.push('role = ?');
            values.push(data.role);
        }

        if (fields.length === 0) return this.findById(id);

        fields.push("updated_at = datetime('now')");
        values.push(id);

        db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);
        return this.findById(id);
    }

    delete(id) {
        const db = getDatabase();
        const result = db.prepare('DELETE FROM users WHERE id = ?').run(id);
        return result.changes > 0;
    }
}

module.exports = new UserRepository();
