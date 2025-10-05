const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, '../database.db'), (err) => {
    if (err) {
        console.error('Could not connect to database:', err.message);
    }
});

// Get inventory report
router.get('/inventory', async (req, res) => {
    try {
        const inventory = await new Promise((resolve, reject) => {
            db.all(`
                SELECT inventory.id, inventory.product_id, products.name, products.description, inventory.quantity
                FROM inventory
                JOIN products ON inventory.product_id = products.id
            `, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        res.json(inventory);
    } catch (err) {
        res.status(500).json({ error: 'Failed to get inventory report' });
    }
});

// Get sales report for the last 30 days
router.get('/sales', async (req, res) => {
    try {
        const sales = await new Promise((resolve, reject) => {
            db.all(`
                SELECT p.name, SUM(oi.quantity) as total_quantity, SUM(oi.price * oi.quantity) as total_sales
                FROM order_items oi
                JOIN products p ON oi.product_id = p.id
                JOIN orders o ON oi.order_id = o.id
                WHERE o.created_at >= datetime('now', '-30 days')
                GROUP BY p.id
            `, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        res.json(sales);
    } catch (err) {
        res.status(500).json({ error: 'Failed to get sales report' });
    }
});

router.get('/alerts', async (req, res) => {
    try {
        const alerts = await new Promise((resolve, reject) => {
            db.all(`
                SELECT p.id, p.name, i.quantity, w.name as warehouse_name
                FROM inventory i
                JOIN products p ON i.product_id = p.id
                JOIN warehouses w ON i.warehouse_id = w.id
                WHERE i.quantity <= 10
            `, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        res.json(alerts);
    } catch (err) {
        res.status(500).json({ error: 'Failed to get alerts' });
    }
});

router.get('/quick-stats', async (req, res) => {
    try {
        const stats = await new Promise((resolve, reject) => {
            db.all(`
                SELECT
                    (SELECT SUM(quantity) FROM inventory_transactions WHERE type = 'nhap' AND transaction_date >= DATE('now', '-1 month')) as total_import,
                    (SELECT SUM(quantity) FROM inventory_transactions WHERE type = 'xuat' AND transaction_date >= DATE('now', '-1 month')) as total_export,
                    (SELECT SUM(quantity) FROM inventory) as total_inventory,
                    (SELECT SUM(p.price * i.quantity) FROM inventory i JOIN products p ON i.product_id = p.id) as total_value
            `, (err, rows) => {
                if (err) reject(err);
                else resolve(rows[0]);
            });
        });
        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: 'Failed to get quick stats' });
    }
});

router.get('/audits', async (req, res) => {
    try {
        const audits = await new Promise((resolve, reject) => {
            db.all(`
                SELECT 
                    'PKK' || substr('000' || id, -3) as code,
                    created_at as date,
                    'Kho chính' as warehouse,
                    'Nguyễn Văn A' as createdBy,
                    0 as discrepancy,
                    'completed' as status
                FROM inventory_transactions
                WHERE type = 'nhap'
                LIMIT 10
            `, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        res.json(audits);
    } catch (err) {
        res.status(500).json({ error: 'Failed to get audits' });
    }
});

module.exports = router;