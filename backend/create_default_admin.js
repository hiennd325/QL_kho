const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const db = new sqlite3.Database(path.join(__dirname, 'database.db'), (err) => {
    if (err) {
        console.error('Could not connect to database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

async function createDefaultAdmin() {
    try {
        // Check if admin user already exists
        const existingAdmin = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM users WHERE username = ? AND role = ?', ['admin', 'admin'], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (existingAdmin) {
            console.log('Default admin user already exists.');
            return;
        }

        // Hash the default password
        const hashedPassword = await bcrypt.hash('admin123', 10);

        // Insert default admin user
        await new Promise((resolve, reject) => {
            db.run(`INSERT INTO users (username, password, role) VALUES (?, ?, ?)`,
                ['admin', hashedPassword, 'admin'], function(err) {
                if (err) reject(err);
                else {
                    console.log('Default admin user created with ID:', this.lastID);
                    resolve();
                }
            });
        });

        console.log('Default admin user created successfully!');
        console.log('Username: admin');
        console.log('Password: admin123');
        console.log('Role: admin');

    } catch (err) {
        console.error('Error creating default admin:', err);
    } finally {
        db.close((err) => {
            if (err) {
                console.error(err.message);
            }
            console.log('Closed the database connection.');
        });
    }
}

createDefaultAdmin();