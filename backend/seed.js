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
    db.serialize(async () => {
        // Clear existing data (optional, for fresh seeding)
        db.run("DELETE FROM users");
        db.run("DELETE FROM products");
        db.run("DELETE FROM warehouses");
        db.run("DELETE FROM suppliers");
        db.run("DELETE FROM inventory");
        db.run("DELETE FROM orders");
        db.run("DELETE FROM order_items");
        db.run("DELETE FROM inventory_transactions");
        db.run("DELETE FROM transfers");
        db.run("DELETE FROM sales_orders");
        db.run("DELETE FROM sales_order_items");
        db.run("DELETE FROM audits");

        // 1. Users
        const hashedPassword = await bcrypt.hash('password123', 10);
        db.run(`INSERT INTO users (username, password, role) VALUES (?, ?, ?)`, ['admin', hashedPassword, 'admin']);
        db.run(`INSERT INTO users (username, password, role) VALUES (?, ?, ?)`, ['staff1', hashedPassword, 'staff']);

        // 2. Suppliers
        db.run(`INSERT INTO suppliers (name, contact_person, phone, email, address) VALUES (?, ?, ?, ?, ?)`, ['Supplier A', 'John Doe', '123-456-7890', 'john@example.com', '123 Main St']);
        db.run(`INSERT INTO suppliers (name, contact_person, phone, email, address) VALUES (?, ?, ?, ?, ?)`, ['Supplier B', 'Jane Smith', '098-765-4321', 'jane@example.com', '456 Oak Ave']);

        // 3. Products
        db.run(`INSERT INTO products (name, description, price, category, brand, supplier_id) VALUES (?, ?, ?, ?, ?, ?)`, ['Product X', 'Description for Product X', 100.00, 'Electronics', 'Brand A', 1]);
        db.run(`INSERT INTO products (name, description, price, category, brand, supplier_id) VALUES (?, ?, ?, ?, ?, ?)`, ['Product Y', 'Description for Product Y', 50.00, 'Clothing', 'Brand B', 2]);

        // 4. Warehouses
        db.run(`INSERT INTO warehouses (name, location, capacity, current_usage) VALUES (?, ?, ?, ?)`, ['Main Warehouse', 'City Center', 1000, 150]);
        db.run(`INSERT INTO warehouses (name, location, capacity, current_usage) VALUES (?, ?, ?, ?)`, ['Secondary Warehouse', 'Industrial Park', 500, 50]);

        // 5. Inventory (linking products to warehouses)
        db.run(`INSERT INTO inventory (product_id, warehouse_id, quantity) VALUES (?, ?, ?)`, [1, 1, 100]);
        db.run(`INSERT INTO inventory (product_id, warehouse_id, quantity) VALUES (?, ?, ?)`, [2, 1, 50]);
        db.run(`INSERT INTO inventory (product_id, warehouse_id, quantity) VALUES (?, ?, ?)`, [1, 2, 50]);

        // 6. Inventory Transactions (recent activities)
        db.run(`INSERT INTO inventory_transactions (product_id, warehouse_id, quantity, type, transaction_date) VALUES (?, ?, ?, ?, 'CURRENT_TIMESTAMP')`, [1, 1, 10, 'nhap']);
        db.run(`INSERT INTO inventory_transactions (product_id, warehouse_id, quantity, type, transaction_date) VALUES (?, ?, ?, ?, 'CURRENT_TIMESTAMP')`, [2, 1, 5, 'xuat']);
        db.run(`INSERT INTO inventory_transactions (product_id, warehouse_id, quantity, type, transaction_date) VALUES (?, ?, ?, ?, 'CURRENT_TIMESTAMP')`, [1, 2, 20, 'nhap']);

        // 7. Orders
        db.run(`INSERT INTO orders (user_id, supplier_id, total_amount, status, created_at) VALUES (?, ?, ?, ?, 'CURRENT_TIMESTAMP')`, [1, 1, 1000.00, 'completed']);
        db.run(`INSERT INTO orders (user_id, supplier_id, total_amount, status, created_at) VALUES (?, ?, ?, ?, 'CURRENT_TIMESTAMP')`, [2, 2, 250.00, 'pending']);

        // 8. Sales Orders
        db.run(`INSERT INTO sales_orders (customer_name, phone, email, address, total_amount, status, created_at, user_id) VALUES (?, ?, ?, ?, ?, ?, 'CURRENT_TIMESTAMP', ?)`, ['Customer 1', '111-222-3333', 'cust1@example.com', '789 Pine Ln', 150.00, 'completed', 1]);
        db.run(`INSERT INTO sales_orders (customer_name, phone, email, address, total_amount, status, created_at, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, ['Customer 2', '444-555-6666', 'cust2@example.com', '321 Birch Rd', 300.00, 'pending', CURRENT_TIMESTAMP, 2]);

        // 9. Audits
        db.run(`INSERT INTO audits (code, date, warehouse_id, created_by_user_id, discrepancy, status, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', '-10 minutes'))`, ['AUDIT001', CURRENT_TIMESTAMP, 1, 1, 0.00, 'completed', 'Initial audit']);

        console.log('Database seeded successfully!');
    });

    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Closed the database connection.');
    });
}

seedDatabase();
