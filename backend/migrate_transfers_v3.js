const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath);

const run = (sql, params = []) => new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve(this);
    });
});

const all = (sql, params = []) => new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
    });
});

async function migrate() {
    try {
        console.log('Starting migration...');
        
        // 1. Ensure transfer_items exists
        await run(`CREATE TABLE IF NOT EXISTS transfer_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            transfer_id INTEGER NOT NULL,
            product_id TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            FOREIGN KEY (transfer_id) REFERENCES transfers(id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products(custom_id)
        )`);

        // 2. Get data from transfers
        const transfers = await all(`SELECT id, product_id, quantity FROM transfers`);
        console.log(`Found ${transfers.length} transfers to migrate.`);

        // 3. Insert into transfer_items
        for (const t of transfers) {
            await run(`INSERT INTO transfer_items (transfer_id, product_id, quantity) VALUES (?, ?, ?)`, [t.id, t.product_id, t.quantity]);
        }
        console.log('Migrated data to transfer_items.');

        // 4. Create new transfers table
        await run(`CREATE TABLE transfers_new (
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

        // 5. Copy data to new transfers table
        await run(`INSERT INTO transfers_new (id, code, from_warehouse_id, to_warehouse_id, status, user_id, notes, created_at, updated_at)
                   SELECT id, code, from_warehouse_id, to_warehouse_id, status, user_id, notes, created_at, updated_at FROM transfers`);
        console.log('Copied data to transfers_new.');

        // 6. Replace old table
        await run(`DROP TABLE transfers`);
        await run(`ALTER TABLE transfers_new RENAME TO transfers`);
        
        console.log('Migration completed successfully.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        db.close();
    }
}

migrate();
