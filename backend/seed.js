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

async function seedDatabase() {
    try {
        // Clear existing data (optional, for fresh seeding)
        await new Promise((resolve, reject) => {
            db.run("DELETE FROM users", (err) => err ? reject(err) : resolve());
        });
        await new Promise((resolve, reject) => {
            db.run("DELETE FROM products", (err) => err ? reject(err) : resolve());
        });
        await new Promise((resolve, reject) => {
            db.run("DELETE FROM warehouses", (err) => err ? reject(err) : resolve());
        });
        await new Promise((resolve, reject) => {
            db.run("DELETE FROM suppliers", (err) => err ? reject(err) : resolve());
        });
        await new Promise((resolve, reject) => {
            db.run("DELETE FROM inventory", (err) => err ? reject(err) : resolve());
        });
        await new Promise((resolve, reject) => {
            db.run("DELETE FROM orders", (err) => err ? reject(err) : resolve());
        });
        await new Promise((resolve, reject) => {
            db.run("DELETE FROM order_items", (err) => err ? reject(err) : resolve());
        });
        await new Promise((resolve, reject) => {
            db.run("DELETE FROM inventory_transactions", (err) => err ? reject(err) : resolve());
        });
        await new Promise((resolve, reject) => {
            db.run("DELETE FROM transfers", (err) => err ? reject(err) : resolve());
        });
        await new Promise((resolve, reject) => {
            db.run("DELETE FROM sales_orders", (err) => err ? reject(err) : resolve());
        });
        await new Promise((resolve, reject) => {
            db.run("DELETE FROM sales_order_items", (err) => err ? reject(err) : resolve());
        });
        await new Promise((resolve, reject) => {
            db.run("DELETE FROM audits", (err) => err ? reject(err) : resolve());
        });

        // 1. Users
        const hashedPassword = await bcrypt.hash('password123', 10);
        console.log('Inserting users...');
        await new Promise((resolve, reject) => {
            db.run(`INSERT INTO users (username, password, role) VALUES (?, ?, ?)`, ['admin', hashedPassword, 'admin'], function(err) {
                if (err) reject(err);
                else {
                    console.log('Admin inserted with ID:', this.lastID);
                    resolve();
                }
            });
        });
        await new Promise((resolve, reject) => {
            db.run(`INSERT INTO users (username, password, role) VALUES (?, ?, ?)`, ['staff1', hashedPassword, 'staff'], function(err) {
                if (err) reject(err);
                else {
                    console.log('Staff1 inserted with ID:', this.lastID);
                    resolve();
                }
            });
        });

        // 2. Suppliers
        await new Promise((resolve, reject) => {
            db.run(`INSERT INTO suppliers (name, contact_person, phone, email, address) VALUES (?, ?, ?, ?, ?)`, ['Supplier A', 'John Doe', '123-456-7890', 'john@example.com', '123 Main St'], function(err) {
                if (err) reject(err);
                else resolve();
            });
        });
        await new Promise((resolve, reject) => {
            db.run(`INSERT INTO suppliers (name, contact_person, phone, email, address) VALUES (?, ?, ?, ?, ?)`, ['Supplier B', 'Jane Smith', '098-765-4321', 'jane@example.com', '456 Oak Ave'], function(err) {
                if (err) reject(err);
                else resolve();
            });
        });

        // 3. Products
        await new Promise((resolve, reject) => {
            db.run(`INSERT INTO products (name, description, price, category, brand, supplier_id) VALUES (?, ?, ?, ?, ?, ?)`, ['Product X', 'Description for Product X', 100.00, 'Electronics', 'Brand A', 1], function(err) {
                if (err) reject(err);
                else resolve();
            });
        });
        await new Promise((resolve, reject) => {
            db.run(`INSERT INTO products (name, description, price, category, brand, supplier_id) VALUES (?, ?, ?, ?, ?, ?)`, ['Product Y', 'Description for Product Y', 50.00, 'Clothing', 'Brand B', 2], function(err) {
                if (err) reject(err);
                else resolve();
            });
        });

        // 4. Warehouses
        await new Promise((resolve, reject) => {
            db.run(`INSERT INTO warehouses (name, location, capacity, current_usage) VALUES (?, ?, ?, ?)`, ['Main Warehouse', 'City Center', 1000, 150], function(err) {
                if (err) reject(err);
                else resolve();
            });
        });
        await new Promise((resolve, reject) => {
            db.run(`INSERT INTO warehouses (name, location, capacity, current_usage) VALUES (?, ?, ?, ?)`, ['Secondary Warehouse', 'Industrial Park', 500, 50], function(err) {
                if (err) reject(err);
                else resolve();
            });
        });

        // 5. Inventory (linking products to warehouses)
        await new Promise((resolve, reject) => {
            db.run(`INSERT INTO inventory (product_id, warehouse_id, quantity) VALUES (?, ?, ?)`, [1, 1, 100], function(err) {
                if (err) reject(err);
                else resolve();
            });
        });
        await new Promise((resolve, reject) => {
            db.run(`INSERT INTO inventory (product_id, warehouse_id, quantity) VALUES (?, ?, ?)`, [2, 1, 50], function(err) {
                if (err) reject(err);
                else resolve();
            });
        });
        await new Promise((resolve, reject) => {
            db.run(`INSERT INTO inventory (product_id, warehouse_id, quantity) VALUES (?, ?, ?)`, [1, 2, 50], function(err) {
                if (err) reject(err);
                else resolve();
            });
        });

        console.log('Database seeded successfully!');

        // Check users
        const users = await new Promise((resolve, reject) => {
            db.all("SELECT id, username, role FROM users", [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        console.log('Users in database:', users);

        // Check products
        const products = await new Promise((resolve, reject) => {
            db.all("SELECT id, name, brand FROM products", [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        console.log('Products in database:', products);

    } catch (err) {
        console.error('Seeding error:', err);
    } finally {
        db.close((err) => {
            if (err) {
                console.error(err.message);
            }
            console.log('Closed the database connection.');
        });
    }
}

seedDatabase();
