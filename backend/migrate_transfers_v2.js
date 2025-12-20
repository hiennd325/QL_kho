const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // 1. Create transfer_items table
    db.run(`CREATE TABLE IF NOT EXISTS transfer_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        transfer_id INTEGER NOT NULL,
        product_id TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        FOREIGN KEY (transfer_id) REFERENCES transfers(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(custom_id)
    )`);

    // 2. Migrate data from transfers to transfer_items
    db.all(`SELECT id, product_id, quantity FROM transfers`, [], (err, rows) => {
        if (err) {
            console.error('Error selecting from transfers:', err.message);
            return;
        }

        const stmt = db.prepare(`INSERT INTO transfer_items (transfer_id, product_id, quantity) VALUES (?, ?, ?)`);
        rows.forEach(row => {
            stmt.run(row.id, row.product_id, row.quantity);
        });
        stmt.finalize();

        // 3. Recreate transfers table without product_id and quantity
        db.run(`CREATE TABLE transfers_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT UNIQUE NOT NULL,
            from_warehouse_id TEXT NOT NULL,
            to_warehouse_id TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
            user_id INTEGER NOT NULL,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (from_warehouse_id) REFERENCES warehouses(custom_id),
            FOREIGN KEY (to_warehouse_id) REFERENCES warehouses(custom_id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )`);

        db.run(`INSERT INTO transfers_new (id, code, from_warehouse_id, to_warehouse_id, status, user_id, notes, created_at, updated_at)
                SELECT id, code, from_warehouse_id, to_warehouse_id, status, user_id, notes, created_at, updated_at FROM transfers`);

        db.run(`DROP TABLE transfers`);
        db.run(`ALTER TABLE transfers_new RENAME TO transfers`);

        console.log('Migration completed successfully.');
    });
});
