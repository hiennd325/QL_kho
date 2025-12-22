/**
 * File định nghĩa các route cho trang dashboard (bảng điều khiển)
 * Cung cấp các API để lấy dữ liệu thống kê, cảnh báo, và hoạt động gần đây
 * Bao gồm kiểm tra sức khỏe hệ thống và hiển thị thông tin tổng quan
 */

// Import các module cần thiết
const express = require('express'); // Framework web để xây dựng API
const router = express.Router(); // Tạo instance router để định nghĩa routes
const sqlite3 = require('sqlite3').verbose(); // Thư viện SQLite3 để tương tác với cơ sở dữ liệu
const path = require('path'); // Module để xử lý đường dẫn file

// Khởi tạo kết nối đến cơ sở dữ liệu SQLite
// Đường dẫn đến file database.db nằm ở thư mục cha của thư mục hiện tại
const db = new sqlite3.Database(path.join(__dirname, '../database.db'), (err) => {
    if (err) {
        // Ghi log lỗi nếu không thể kết nối database
        console.error('Could not connect to database:', err.message);
    }
});

/**
 * Hàm kiểm tra sức khỏe tổng thể của hệ thống
 * Thực hiện các kiểm tra về database, logs, tồn kho, và đơn hàng
 * Trả về object chứa trạng thái và chi tiết các vấn đề phát hiện
 */
async function checkSystemHealth() {
    // Khởi tạo object trạng thái sức khỏe với giá trị mặc định là healthy
    const healthStatus = {
        status: 'healthy', // Trạng thái: 'healthy', 'warning', 'critical'
        message: 'Hệ thống hoạt động ổn định', // Thông báo trạng thái bằng tiếng Việt
        details: [] // Mảng chứa chi tiết các kiểm tra
    };

    try {
        // 1. Kiểm tra kết nối cơ sở dữ liệu
        // Thực hiện truy vấn đơn giản để kiểm tra xem database có phản hồi không
        await new Promise((resolve, reject) => {
            db.get('SELECT 1', (err, row) => {
                if (err) {
                    // Nếu có lỗi kết nối, đặt trạng thái critical và reject promise
                    healthStatus.status = 'critical';
                    healthStatus.message = 'Lỗi kết nối cơ sở dữ liệu';
                    healthStatus.details.push('Database connection failed');
                    reject(err);
                } else {
                    // Nếu kết nối thành công, thêm thông tin OK vào details
                    healthStatus.details.push('Database connection: OK');
                    resolve();
                }
            });
        });

        // 2. Kiểm tra lỗi nghiêm trọng trong file log gần đây
        // Import module fs để đọc file log
        const fs = require('fs').promises;
        const path = require('path');
        // Đường dẫn đến file server.log
        const logPath = path.join(__dirname, '../server.log');

        try {
            // Đọc nội dung file log
            const logContent = await fs.readFile(logPath, 'utf8');
            // Lấy 50 dòng cuối cùng của log
            const recentLogs = logContent.split('\n').slice(-50);
            // Đếm số lượng dòng chứa từ khóa lỗi
            const errorCount = recentLogs.filter(line =>
                line.toLowerCase().includes('error') ||
                line.toLowerCase().includes('critical') ||
                line.toLowerCase().includes('failed')
            ).length;

            if (errorCount > 5) {
                // Nếu có nhiều hơn 5 lỗi, đặt trạng thái warning
                healthStatus.status = 'warning';
                healthStatus.message = 'Hệ thống có nhiều lỗi gần đây';
                healthStatus.details.push(`Found ${errorCount} error entries in recent logs`);
            } else {
                // Nếu ít lỗi, báo OK
                healthStatus.details.push('Log analysis: OK');
            }
        } catch (logErr) {
            // Nếu không thể đọc file log (có thể file không tồn tại), bỏ qua
            healthStatus.details.push('Log file not accessible');
        }

        // 3. Kiểm tra cảnh báo tồn kho thấp
        // Truy vấn các sản phẩm có tổng số lượng <= 10 và > 0 (sắp hết hàng)
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
            // Nếu có sản phẩm sắp hết hàng, đặt trạng thái warning nếu chưa có lỗi nghiêm trọng hơn
            if (healthStatus.status === 'healthy') {
                healthStatus.status = 'warning';
                healthStatus.message = 'Một số sản phẩm sắp hết hàng';
            }
            healthStatus.details.push(`${lowStockProducts.length} products with low stock`);
        }

        // 4. Kiểm tra sản phẩm đã hết hàng
        // Đếm số lượng sản phẩm có tổng số lượng = 0
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
            // Nếu có sản phẩm hết hàng, đặt trạng thái warning
            if (healthStatus.status === 'healthy') {
                healthStatus.status = 'warning';
                healthStatus.message = 'Một số sản phẩm đã hết hàng';
            }
            healthStatus.details.push(`${outOfStockProducts} products out of stock`);
        }

        // 5. Kiểm tra thời gian hoạt động của server
        // Lấy thời gian server đã chạy (tính bằng giây)
        const serverStartTime = process.uptime();
        // Chuyển đổi sang giờ
        const uptimeHours = Math.floor(serverStartTime / 3600);
        healthStatus.details.push(`Server uptime: ${uptimeHours} hours`);

        // 6. Kiểm tra đơn hàng đang chờ xử lý cần chú ý
        // Đếm số đơn hàng có trạng thái 'pending' và tạo từ hơn 1 ngày trước
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
            // Nếu có đơn hàng chờ xử lý lâu, đặt trạng thái warning
            if (healthStatus.status === 'healthy') {
                healthStatus.status = 'warning';
                healthStatus.message = 'Có đơn hàng đang chờ xử lý';
            }
            healthStatus.details.push(`${pendingOrders} orders pending for more than 1 day`);
        }

    } catch (error) {
        // Nếu có lỗi trong quá trình kiểm tra, đặt trạng thái critical
        healthStatus.status = 'critical';
        healthStatus.message = 'Lỗi kiểm tra hệ thống';
        healthStatus.details.push(`Health check error: ${error.message}`);
    }

    // Trả về object trạng thái sức khỏe
    return healthStatus;
}

/**
 * Route lấy dữ liệu cảnh báo cho dashboard
 * Phương thức: GET
 * Đường dẫn: /dashboard/alerts
 * Trả về: Số đơn hàng mới và trạng thái sức khỏe hệ thống
 */
router.get('/alerts', async (req, res) => {
    try {
        // Đếm số đơn hàng mới: số đơn hàng pending trong 24 giờ qua
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

        // Lấy trạng thái sức khỏe hệ thống bằng cách gọi hàm checkSystemHealth
        const systemHealth = await checkSystemHealth();

        // Trả về dữ liệu JSON chứa thông tin cảnh báo
        res.json({
            newOrders, // Số đơn hàng mới
            systemStatus: systemHealth.message, // Thông báo trạng thái hệ thống
            systemHealth: systemHealth.status, // Trạng thái sức khỏe ('healthy', 'warning', 'critical')
            systemDetails: systemHealth.details // Chi tiết các kiểm tra
        });
    } catch (err) {
        // Trả về lỗi 500 nếu có lỗi trong quá trình xử lý
        res.status(500).json({ error: 'Failed to get alerts' });
    }
});

/**
 * Route lấy dữ liệu thống kê cho dashboard
 * Phương thức: GET
 * Đường dẫn: /dashboard/stats
 * Trả về: Các chỉ số thống kê như tổng sản phẩm, nhập/xuất tháng, giá trị tồn kho
 */
router.get('/stats', async (req, res) => {
    try {
        // Tổng số loại sản phẩm (đếm số bản ghi trong bảng products)
        const totalProducts = await new Promise((resolve, reject) => {
            db.get('SELECT COUNT(*) as total FROM products', (err, row) => {
                if (err) reject(err);
                else resolve(row.total || 0);
            });
        });

        // Nhập hàng tháng: tổng số lượng từ các giao dịch 'nhap' trong tháng hiện tại
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

        // Xuất hàng tháng: tổng số lượng từ các giao dịch 'xuat' trong tháng hiện tại
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

        // Tổng giá trị tồn kho: tính tổng (giá * số lượng) cho tất cả sản phẩm có tồn kho
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

        // Trả về dữ liệu thống kê
        res.json({
            totalProducts, // Tổng số sản phẩm
            monthlyImports, // Số lượng nhập tháng này
            monthlyExports, // Số lượng xuất tháng này
            totalValue // Tổng giá trị tồn kho
        });
    } catch (err) {
        // Trả về lỗi 500 nếu có lỗi trong quá trình truy vấn
        res.status(500).json({ error: 'Failed to get stats' });
    }
});

/**
 * Route lấy danh sách hoạt động gần đây
 * Phương thức: GET
 * Đường dẫn: /dashboard/recent-activities
 * Trả về: 5 hoạt động nhập/xuất kho gần nhất với thông tin chi tiết
 */
router.get('/recent-activities', async (req, res) => {
    try {
        // Truy vấn 5 giao dịch kho gần nhất, kết hợp với thông tin sản phẩm
        const activities = await new Promise((resolve, reject) => {
            db.all(`
                SELECT
                    CASE
                        WHEN type = 'nhap' THEN 'Nhập kho'  -- Tiêu đề cho giao dịch nhập
                        WHEN type = 'xuat' THEN 'Xuất kho'  -- Tiêu đề cho giao dịch xuất
                        ELSE 'Giao dịch kho'  -- Tiêu đề mặc định
                    END as title,
                    CASE
                        WHEN type = 'nhap' THEN p.name || ' - Nhập ' || quantity || ' đơn vị'  -- Mô tả nhập
                        WHEN type = 'xuat' THEN p.name || ' - Xuất ' || quantity || ' đơn vị'  -- Mô tả xuất
                        ELSE p.name || ' - Giao dịch ' || quantity || ' đơn vị'  -- Mô tả mặc định
                    END as description,
                    CASE
                        WHEN type = 'nhap' THEN 'log-in'  -- Icon cho nhập
                        WHEN type = 'xuat' THEN 'log-out'  -- Icon cho xuất
                        ELSE 'package'  -- Icon mặc định
                    END as icon,
                    CASE
                        WHEN type = 'nhap' THEN 'green'  -- Màu cho nhập
                        WHEN type = 'xuat' THEN 'red'  -- Màu cho xuất
                        ELSE 'blue'  -- Màu mặc định
                    END as color,
                    transaction_date as time  -- Thời gian giao dịch
                FROM inventory_transactions it
                JOIN products p ON it.product_id = p.custom_id  -- Kết hợp với bảng products
                ORDER BY transaction_date DESC  -- Sắp xếp theo thời gian giảm dần
                LIMIT 5  -- Giới hạn 5 bản ghi
            `, (err, rows) => {
                if (err) reject(err);
                else {
                    // Định dạng thời gian sang tiếng Việt
                    const formattedRows = rows.map(row => ({
                        ...row,
                        time: new Date(row.time).toLocaleString('vi-VN') // Chuyển sang định dạng địa phương Việt Nam
                    }));
                    resolve(formattedRows);
                }
            });
        });

        // Trả về danh sách hoạt động
        res.json(activities);
    } catch (err) {
        // Trả về lỗi 500 nếu có lỗi trong quá trình truy vấn
        res.status(500).json({ error: 'Failed to get recent activities' });
    }
});

// Xuất router để sử dụng trong ứng dụng chính
module.exports = router;