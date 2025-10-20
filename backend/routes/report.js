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
                SELECT products.id as product_id, products.name, products.description, SUM(inventory.quantity) as quantity
                FROM inventory
                JOIN products ON inventory.product_id = products.id
                GROUP BY products.id, products.name, products.description
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
        const { warehouse } = req.query;
        let query = `
            SELECT p.id, p.name, i.quantity, p.price, (p.price * i.quantity) as value, w.name as warehouse_name
            FROM inventory i
            JOIN products p ON i.product_id = p.id
            JOIN warehouses w ON i.warehouse_id = w.id
            WHERE i.quantity <= 10
        `;
        const params = [];
        if (warehouse) {
            query += ' AND i.warehouse_id = ?';
            params.push(warehouse);
        }
        const alerts = await new Promise((resolve, reject) => {
            db.all(query, params, (err, rows) => {
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
        const { startDate, endDate, warehouse, status } = req.query;
        let query = `
            SELECT
                a.id, a.code, a.date, a.discrepancy, a.status, a.notes,
                w.name as warehouse_name,
                u.username as created_by_username
            FROM audits a
            JOIN warehouses w ON a.warehouse_id = w.id
            JOIN users u ON a.created_by_user_id = u.id
            WHERE 1=1
        `;
        const params = [];

        if (startDate) {
            query += ' AND date(a.date) >= date(?)';
            params.push(startDate);
        }
        if (endDate) {
            query += ' AND date(a.date) <= date(?)';
            params.push(endDate);
        }
        if (warehouse && warehouse !== 'Tất cả kho') {
            query += ' AND w.name = ?';
            params.push(warehouse);
        }
        if (status && status !== 'Tất cả trạng thái') {
            query += ' AND a.status = ?';
            params.push(status);
        }

        query += ' ORDER BY a.date DESC';

        const audits = await new Promise((resolve, reject) => {
            db.all(query, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        res.json(audits);
    } catch (err) {
        res.status(500).json({ error: 'Failed to get audits' });
    }
});

// Generate report based on type and period
router.get('/generate', async (req, res) => {
    try {
        const { type, period } = req.query;

        if (!type || !period) {
            return res.status(400).json({ error: 'Type and period are required' });
        }

        let dateFilter = '';
        switch (period) {
            case 'daily':
                dateFilter = "DATE(transaction_date) = DATE('now')";
                break;
            case 'weekly':
                dateFilter = "transaction_date >= datetime('now', '-7 days')";
                break;
            case 'monthly':
                dateFilter = "transaction_date >= datetime('now', '-30 days')";
                break;
            case 'quarterly':
                dateFilter = "transaction_date >= datetime('now', '-90 days')";
                break;
            case 'yearly':
                dateFilter = "transaction_date >= datetime('now', '-365 days')";
                break;
            default:
                return res.status(400).json({ error: 'Invalid period' });
        }

        let query = '';
        let title = '';

        switch (type) {
            case 'inventory':
                query = `
                    SELECT p.name, i.quantity, p.price, (p.price * i.quantity) as total_value
                    FROM inventory i
                    JOIN products p ON i.product_id = p.id
                `;
                title = 'Báo cáo tồn kho';
                break;
            case 'import':
                query = `
                    SELECT p.name, SUM(it.quantity) as total_quantity, COUNT(it.id) as transaction_count
                    FROM inventory_transactions it
                    JOIN products p ON it.product_id = p.id
                    WHERE it.type = 'nhap' AND ${dateFilter}
                    GROUP BY p.id
                `;
                title = 'Báo cáo nhập kho';
                break;
            case 'export':
                query = `
                    SELECT p.name, SUM(it.quantity) as total_quantity, COUNT(it.id) as transaction_count
                    FROM inventory_transactions it
                    JOIN products p ON it.product_id = p.id
                    WHERE it.type = 'xuat' AND ${dateFilter}
                    GROUP BY p.id
                `;
                title = 'Báo cáo xuất kho';
                break;
            case 'financial':
                query = `
                    SELECT
                        (SELECT SUM(p.price * it.quantity) FROM inventory_transactions it JOIN products p ON it.product_id = p.id WHERE it.type = 'nhap' AND ${dateFilter}) as total_import_value,
                        (SELECT SUM(p.price * it.quantity) FROM inventory_transactions it JOIN products p ON it.product_id = p.id WHERE it.type = 'xuat' AND ${dateFilter}) as total_export_value,
                        (SELECT SUM(p.price * i.quantity) FROM inventory i JOIN products p ON i.product_id = p.id) as current_inventory_value
                `;
                title = 'Báo cáo tài chính';
                break;
            default:
                return res.status(400).json({ error: 'Invalid report type' });
        }

        const data = await new Promise((resolve, reject) => {
            db.all(query, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        res.json({
            title,
            period,
            generated_at: new Date().toISOString(),
            data
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to generate report' });
    }
});

module.exports = router;