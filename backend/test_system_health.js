const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs').promises;

const db = new sqlite3.Database(path.join(__dirname, 'database.db'), (err) => {
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
        const logPath = path.join(__dirname, 'server.log');

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

// Test the function
checkSystemHealth().then(result => {
    console.log('System Health Check Result:');
    console.log(JSON.stringify(result, null, 2));
    db.close();
}).catch(err => {
    console.error('Test failed:', err);
    db.close();
});