const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, '../database.db'), (err) => {
    if (err) {
        console.error('Could not connect to database:', err.message);
    }
});

// Get alert data
router.get('/alerts', async (req, res) => {
    try {
        // New orders: count of pending orders in last 24 hours
        const newOrders = await new Promise((resolve, reject) => {
            db.all(`
                SELECT COUNT(*) as count
                FROM orders
                WHERE status = 'pending' AND created_at >= datetime('now', '-24 hours')
            `, (err, rows) => {
                if (err) reject(err);
                else resolve(rows[0].count);
            });
        });

        res.json({ newOrders, systemStatus: 'Hệ thống hoạt động ổn định' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to get alerts' });
    }
});

// Get stats data
router.get('/stats', async (req, res) => {
    try {
        // Total products (count of product types)
        const totalProducts = await new Promise((resolve, reject) => {
            db.get('SELECT COUNT(*) as total FROM products', (err, row) => {
                if (err) reject(err);
                else resolve(row.total || 0);
            });
        });

        // Monthly imports: sum of quantities from 'nhap' transactions in current month
        const monthlyImports = await new Promise((resolve, reject) => {
            db.get(`
                SELECT SUM(quantity) as total
                FROM inventory_transactions
                WHERE type = 'nhap' AND strftime('%Y-%m', transaction_date) = strftime('%Y-%m', 'now')
            `, (err, row) => {
                if (err) reject(err);
                else resolve(row.total || 0);
            });
        });

        // Monthly exports: sum of quantities from 'xuat' transactions in current month
        const monthlyExports = await new Promise((resolve, reject) => {
            db.get(`
                SELECT SUM(quantity) as total
                FROM inventory_transactions
                WHERE type = 'xuat' AND strftime('%Y-%m', transaction_date) = strftime('%Y-%m', 'now')
            `, (err, row) => {
                if (err) reject(err);
                else resolve(row.total || 0);
            });
        });

        // Total value: sum of (price * quantity) for all products in inventory
        const totalValue = await new Promise((resolve, reject) => {
            db.get(`
                SELECT SUM(products.price * inventory.quantity) as total
                FROM products
                JOIN inventory ON products.id = inventory.product_id
            `, (err, row) => {
                if (err) reject(err);
                else resolve(row.total || 0);
            });
        });

        res.json({
            totalProducts,
            monthlyImports,
            monthlyExports,
            totalValue
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to get stats' });
    }
});

// Get recent activities
router.get('/recent-activities', async (req, res) => {
    try {
        const activities = await new Promise((resolve, reject) => {
            db.all(`
                SELECT
                    CASE
                        WHEN type = 'nhap' THEN 'Nhập kho'
                        WHEN type = 'xuat' THEN 'Xuất kho'
                        ELSE 'Giao dịch kho'
                    END as title,
                    CASE
                        WHEN type = 'nhap' THEN p.name || ' - Nhập ' || quantity || ' đơn vị'
                        WHEN type = 'xuat' THEN p.name || ' - Xuất ' || quantity || ' đơn vị'
                        ELSE p.name || ' - Giao dịch ' || quantity || ' đơn vị'
                    END as description,
                    CASE
                        WHEN type = 'nhap' THEN 'log-in'
                        WHEN type = 'xuat' THEN 'log-out'
                        ELSE 'package'
                    END as icon,
                    CASE
                        WHEN type = 'nhap' THEN 'green'
                        WHEN type = 'xuat' THEN 'red'
                        ELSE 'blue'
                    END as color,
                    datetime(transaction_date, 'localtime') as time
                FROM inventory_transactions it
                JOIN products p ON it.product_id = p.id
                ORDER BY transaction_date DESC
                LIMIT 5
            `, (err, rows) => {
                if (err) reject(err);
                else {
                    // Format time to Vietnamese
                    const formattedRows = rows.map(row => ({
                        ...row,
                        description: row.description + ' - ' + new Date(row.time).toLocaleString('vi-VN')
                    }));
                    resolve(formattedRows);
                }
            });
        });
        res.json(activities);
    } catch (err) {
        res.status(500).json({ error: 'Failed to get recent activities' });
    }
});



module.exports = router;