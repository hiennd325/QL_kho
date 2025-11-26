const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, '../database.db'), (err) => {
    if (err) {
        console.error('Could not connect to database:', err.message);
    }
});

// System health check function
async function checkSystemHealth() {
    const healthStatus = {
        status: 'healthy',
        message: 'Hệ thống hoạt động ổn định',
        details: []
    };

    try {
        // 1. Database connectivity check
        await new Promise((resolve, reject) => {
            db.get('SELECT 1', (err, row) => {
                if (err) {
                    healthStatus.status = 'critical';
                    healthStatus.message = 'Lỗi kết nối cơ sở dữ liệu';
                    healthStatus.details.push('Database connection failed');
                    reject(err);
                } else {
                    healthStatus.details.push('Database connection: OK');
                    resolve();
                }
            });
        });

        // 2. Check for critical errors in recent logs (if log file exists)
        const fs = require('fs').promises;
        const path = require('path');
        const logPath = path.join(__dirname, '../server.log');

        try {
            const logContent = await fs.readFile(logPath, 'utf8');
            const recentLogs = logContent.split('\n').slice(-50); // Last 50 lines
            const errorCount = recentLogs.filter(line =>
                line.toLowerCase().includes('error') ||
                line.toLowerCase().includes('critical') ||
                line.toLowerCase().includes('failed')
            ).length;

            if (errorCount > 5) {
                healthStatus.status = 'warning';
                healthStatus.message = 'Hệ thống có nhiều lỗi gần đây';
                healthStatus.details.push(`Found ${errorCount} error entries in recent logs`);
            } else {
                healthStatus.details.push('Log analysis: OK');
            }
        } catch (logErr) {
            // Log file might not exist, that's OK
            healthStatus.details.push('Log file not accessible');
        }

        // 3. Check for low inventory alerts
        const lowStockProducts = await new Promise((resolve, reject) => {
            db.all(`
                SELECT p.name, COALESCE(SUM(i.quantity), 0) as total_quantity
                FROM products p
                LEFT JOIN inventory i ON p.custom_id = i.product_id
                GROUP BY p.custom_id, p.name
                HAVING total_quantity <= 10 AND total_quantity > 0
                ORDER BY total_quantity ASC
                LIMIT 5
            `, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        if (lowStockProducts.length > 0) {
            if (healthStatus.status === 'healthy') {
                healthStatus.status = 'warning';
                healthStatus.message = 'Một số sản phẩm sắp hết hàng';
            }
            healthStatus.details.push(`${lowStockProducts.length} products with low stock`);
        }

        // 4. Check for out of stock products
        const outOfStockProducts = await new Promise((resolve, reject) => {
            db.get(`
                SELECT COUNT(*) as count
                FROM (
                    SELECT p.custom_id
                    FROM products p
                    LEFT JOIN inventory i ON p.custom_id = i.product_id
                    GROUP BY p.custom_id
                    HAVING COALESCE(SUM(i.quantity), 0) = 0
                )
            `, (err, row) => {
                if (err) reject(err);
                else resolve(row.count || 0);
            });
        });

        if (outOfStockProducts > 0) {
            if (healthStatus.status === 'healthy') {
                healthStatus.status = 'warning';
                healthStatus.message = 'Một số sản phẩm đã hết hàng';
            }
            healthStatus.details.push(`${outOfStockProducts} products out of stock`);
        }

        // 5. Check server uptime (basic check - if server is responding)
        const serverStartTime = process.uptime();
        const uptimeHours = Math.floor(serverStartTime / 3600);
        healthStatus.details.push(`Server uptime: ${uptimeHours} hours`);

        // 6. Check for pending orders that need attention
        const pendingOrders = await new Promise((resolve, reject) => {
            db.get(`
                SELECT COUNT(*) as count
                FROM orders
                WHERE status = 'pending' AND created_at < datetime('now', '-1 day')
            `, (err, row) => {
                if (err) reject(err);
                else resolve(row.count || 0);
            });
        });

        if (pendingOrders > 0) {
            if (healthStatus.status === 'healthy') {
                healthStatus.status = 'warning';
                healthStatus.message = 'Có đơn hàng đang chờ xử lý';
            }
            healthStatus.details.push(`${pendingOrders} orders pending for more than 1 day`);
        }

    } catch (error) {
        healthStatus.status = 'critical';
        healthStatus.message = 'Lỗi kiểm tra hệ thống';
        healthStatus.details.push(`Health check error: ${error.message}`);
    }

    return healthStatus;
}

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

        // Get system health status
        const systemHealth = await checkSystemHealth();

        res.json({
            newOrders,
            systemStatus: systemHealth.message,
            systemHealth: systemHealth.status,
            systemDetails: systemHealth.details
        });
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
                SELECT COALESCE(SUM(products.price * COALESCE(inventory.quantity, 0)), 0) as total
                FROM products
                LEFT JOIN inventory ON products.custom_id = inventory.product_id
                WHERE products.price IS NOT NULL AND products.price > 0
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
                    transaction_date as time
                FROM inventory_transactions it
                JOIN products p ON it.product_id = p.custom_id
                ORDER BY transaction_date DESC
                LIMIT 5
            `, (err, rows) => {
                if (err) reject(err);
                else {
                    // Format time to Vietnamese
                    const formattedRows = rows.map(row => ({
                        ...row,
                        time: new Date(row.time).toLocaleString('vi-VN')
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