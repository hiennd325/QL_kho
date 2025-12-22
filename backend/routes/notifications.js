/**
 * File định nghĩa các route liên quan đến thông báo (notifications)
 * Hiện tại sử dụng dữ liệu mock từ cảnh báo tồn kho thấp
 * Trong triển khai thực tế sẽ có bảng notifications riêng
 */

// Import các module cần thiết
const express = require('express'); // Framework web để xây dựng API
const router = express.Router(); // Tạo instance router
const sqlite3 = require('sqlite3').verbose(); // Thư viện SQLite3
const path = require('path'); // Module xử lý đường dẫn

// Khởi tạo kết nối database
const db = new sqlite3.Database(path.join(__dirname, '../database.db'), (err) => {
    if (err) {
        console.error('Could not connect to database:', err.message);
    }
});

/**
 * Route lấy danh sách tất cả thông báo
 * Phương thức: GET
 * Đường dẫn: /notifications
 * Hiện tại trả về cảnh báo tồn kho thấp dưới dạng thông báo
 */
router.get('/', async (req, res) => {
    try {
        // Tạm thời trả về cảnh báo tồn kho thấp làm thông báo
        const notifications = await new Promise((resolve, reject) => {
            db.all(`
                SELECT
                    'warning' as type,  -- Loại thông báo: warning
                    'alert-triangle' as icon,  -- Icon hiển thị
                    'Cảnh báo tồn kho thấp' as title,  -- Tiêu đề thông báo
                    p.name || ' chỉ còn ' || i.quantity || ' sản phẩm' as message,  -- Nội dung thông báo
                    i.id as id,  -- ID của thông báo (dùng inventory ID)
                    datetime('now') as created_at  -- Thời gian tạo (hiện tại)
                FROM inventory i
                JOIN products p ON i.product_id = p.id  -- Kết hợp với bảng products
                WHERE i.quantity <= 10  -- Lọc sản phẩm có số lượng <= 10
                ORDER BY i.quantity ASC  -- Sắp xếp theo số lượng tăng dần
                LIMIT 10  -- Giới hạn 10 thông báo
            `, (err, rows) => {
                if (err) reject(err);
                else {
                    // Thêm trường is_read cho mỗi thông báo (tạm thời false)
                    const notificationsWithReadStatus = rows.map(row => ({
                        ...row,
                        is_read: false  // Đánh dấu chưa đọc
                    }));
                    resolve(notificationsWithReadStatus);
                }
            });
        });

        // Trả về danh sách thông báo
        res.json(notifications);
    } catch (err) {
        // Trả về lỗi 500 nếu có lỗi
        res.status(500).json({ error: 'Failed to get notifications' });
    }
});

/**
 * Route lấy số lượng thông báo chưa đọc
 * Phương thức: GET
 * Đường dẫn: /notifications/count
 * Trong triển khai thực tế sẽ đếm từ bảng notifications
 */
router.get('/count', async (req, res) => {
    try {
        // Tạm thời trả về số lượng sản phẩm tồn kho thấp làm số thông báo chưa đọc
        // Trong triển khai thực tế, sẽ đếm từ bảng notifications với điều kiện is_read = false
        const count = await new Promise((resolve, reject) => {
            db.get(`
                SELECT COUNT(*) as count
                FROM inventory i
                WHERE i.quantity <= 10  -- Đếm sản phẩm có số lượng <= 10
            `, (err, row) => {
                if (err) reject(err);
                else resolve(row.count);  // Trả về số lượng
            });
        });

        // Trả về object chứa số lượng
        res.json({ count });
    } catch (err) {
        // Trả về lỗi 500 nếu có lỗi
        res.status(500).json({ error: 'Failed to get notification count' });
    }
});

/**
 * Route đánh dấu một thông báo đã đọc
 * Phương thức: PUT
 * Đường dẫn: /notifications/:id/read
 * Trong triển khai thực tế sẽ cập nhật trường is_read trong bảng notifications
 */
router.put('/:id/read', async (req, res) => {
    try {
        // Tạm thời chỉ trả về thành công vì đang dùng mock data
        // Trong triển khai thực tế sẽ cập nhật bảng notifications:
        // UPDATE notifications SET is_read = true WHERE id = ?
        res.json({ message: 'Notification marked as read' });
    } catch (err) {
        // Trả về lỗi 500 nếu có lỗi
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
});

/**
 * Route đánh dấu tất cả thông báo đã đọc
 * Phương thức: PUT
 * Đường dẫn: /notifications/read-all
 * Trong triển khai thực tế sẽ cập nhật tất cả thông báo của user thành đã đọc
 */
router.put('/read-all', async (req, res) => {
    try {
        // Tạm thời chỉ trả về thành công vì đang dùng mock data
        // Trong triển khai thực tế sẽ cập nhật:
        // UPDATE notifications SET is_read = true WHERE user_id = ?
        res.json({ message: 'All notifications marked as read' });
    } catch (err) {
        // Trả về lỗi 500 nếu có lỗi
        res.status(500).json({ error: 'Failed to mark all notifications as read' });
    }
});

// Xuất router để sử dụng trong ứng dụng
module.exports = router;