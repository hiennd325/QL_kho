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
                SELECT products.id as product_id, products.name, products.description, SUM(inventory.quantity) as quantity, products.price
                FROM inventory
                JOIN products ON inventory.product_id = products.id
                GROUP BY products.id, products.name, products.description, products.price
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
        const { startDate, endDate, warehouse, status, page = 1, limit = 10 } = req.query;
        let query = `
            SELECT
                a.id, a.code, a.date, a.discrepancy, a.status, a.notes,
                w.name as warehouse_name,
                u.username as created_by_username
            FROM audits a
            JOIN warehouses w ON a.warehouse_id = w.id
            JOIN users u ON a.created_by_user_id = u.id
        `;
        let countQuery = `SELECT COUNT(*) as count FROM audits a JOIN warehouses w ON a.warehouse_id = w.id JOIN users u ON a.created_by_user_id = u.id`;

        let whereClause = ' WHERE 1=1 ';
        const params = [];

        if (startDate) {
            whereClause += ' AND date(a.date) >= date(?)';
            params.push(startDate);
        }
        if (endDate) {
            whereClause += ' AND date(a.date) <= date(?)';
            params.push(endDate);
        }
        if (warehouse && warehouse !== 'Tất cả kho') {
            whereClause += ' AND w.name = ?';
            params.push(warehouse);
        }
        if (status && status !== 'Tất cả trạng thái') {
            whereClause += ' AND a.status = ?';
            params.push(status);
        }

        countQuery += whereClause;
        query += whereClause;

        query += ' ORDER BY a.date DESC LIMIT ? OFFSET ?';
        params.push(limit, (page - 1) * limit);

        const audits = await new Promise((resolve, reject) => {
            db.all(query, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        const total = await new Promise((resolve, reject) => {
            // Remove limit and offset from params for count
            const countParams = params.slice(0, -2);
            db.get(countQuery, countParams, (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        });

        res.json({
            audits,
            totalPages: Math.ceil(total / limit)
        });
    } catch (err) {
        console.error('Failed to get audits', err)
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

// Export single audit to CSV
router.get('/audits/:id/export', async (req, res) => {
    try {
        const { id } = req.params;
        const audit = await new Promise((resolve, reject) => {
            const query = `
                SELECT a.id, a.code, a.date, a.discrepancy, a.status, w.name as warehouse_name, u.username as created_by_username, a.notes
                FROM audits a
                JOIN warehouses w ON a.warehouse_id = w.id
                JOIN users u ON a.created_by_user_id = u.id
                WHERE a.id = ?
            `;
            db.get(query, [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (!audit) {
            return res.status(404).json({ error: 'Audit not found' });
        }

        let csv = 'Mã phiếu,Ngày kiểm,Kho,Người tạo,Chênh lệch,Trạng thái,Ghi chú\n';
        const formattedDate = new Date(audit.date).toLocaleDateString('vi-VN');
        csv += `"${audit.code}","${formattedDate}","${audit.warehouse_name}","${audit.created_by_username}",${audit.discrepancy},"${audit.status}","${audit.notes || ''}"\n`;

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="audit_${audit.code}.csv"`);
        res.send(csv);
    } catch (err) {
        res.status(500).json({ error: 'Failed to export audit' });
    }
});

// Export audits to CSV
router.get('/audits/export', async (req, res) => {
    try {
        const { startDate, endDate, warehouse, status } = req.query;
        let query = `
            SELECT a.id, a.code, a.date, a.discrepancy, a.status, w.name as warehouse_name, u.username as created_by_username
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

        let csv = 'ID,Mã phiếu,Ngày kiểm,Kho,Người tạo,Chênh lệch,Trạng thái\n';
        audits.forEach(a => {
            const formattedDate = new Date(a.date).toLocaleDateString('vi-VN');
            csv += `${a.id},"${a.code}","${formattedDate}","${a.warehouse_name}","${a.created_by_username}",${a.discrepancy},"${a.status}"\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="audits.csv"');
        res.send(csv);
    } catch (err) {
        res.status(500).json({ error: 'Failed to export audits' });
    }
});

// Export inventory report to CSV
router.get('/inventory/export', async (req, res) => {
    try {
        const inventory = await new Promise((resolve, reject) => {
            db.all(`
                SELECT p.id as product_id, p.name, p.description, SUM(i.quantity) as quantity, p.price, (p.price * SUM(i.quantity)) as total_value
                FROM inventory i
                JOIN products p ON i.product_id = p.id
                GROUP BY p.id, p.name, p.description, p.price
            `, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        let csv = 'Mã SP,Tên sản phẩm,Số lượng,Đơn giá,Thành tiền\n';
        inventory.forEach(item => {
            csv += `"${item.product_id}","${item.name}",${item.quantity},${item.price},${item.total_value}\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="inventory_report.csv"');
        res.send(csv);
    } catch (err) {
        res.status(500).json({ error: 'Failed to export inventory report' });
    }
});

// Export transactions to CSV
router.get('/transactions/export', async (req, res) => {
    try {
        const { type, warehouseId, startDate, endDate } = req.query;
        let whereClause = ' WHERE 1=1 ';
        const whereParams = [];

        if (type) {
            whereClause += ' AND it.type = ? ';
            whereParams.push(type);
        }
        if (warehouseId) {
            whereClause += ' AND it.warehouse_id = ? ';
            whereParams.push(warehouseId);
        }
        if (startDate) {
            whereClause += ' AND DATE(it.transaction_date) >= ? ';
            whereParams.push(startDate);
        }
        if (endDate) {
            whereClause += ' AND DATE(it.transaction_date) <= ? ';
            whereParams.push(endDate);
        }

        const transactions = await new Promise((resolve, reject) => {
            const sql = `
                SELECT it.id, it.transaction_date, p.name as product_name, it.quantity, w.name as warehouse_name, it.type
                FROM inventory_transactions it
                JOIN products p ON it.product_id = p.id
                JOIN warehouses w ON it.warehouse_id = w.id
                ${whereClause}
                ORDER BY it.transaction_date DESC
            `;
            db.all(sql, whereParams, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        let csv = 'ID,Ngày giao dịch,Sản phẩm,Số lượng,Kho,Loại\n';
        transactions.forEach(t => {
            const formattedDate = new Date(t.transaction_date).toLocaleDateString('vi-VN');
            const typeLabel = t.type === 'nhap' ? 'Nhập kho' : 'Xuất kho';
            csv += `${t.id},"${formattedDate}","${t.product_name}",${t.quantity},"${t.warehouse_name}","${typeLabel}"\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="transactions.csv"');
        res.send(csv);
    } catch (err) {
        res.status(500).json({ error: 'Failed to export transactions' });
    }
});


module.exports = router;