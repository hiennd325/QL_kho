/**
 * File định nghĩa các route liên quan đến đơn hàng (orders)
 * Hiện tại chỉ có endpoint đếm số lượng đơn hàng
 */

// Import các module cần thiết
const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Khởi tạo kết nối database
const db = new sqlite3.Database(path.join(__dirname, '..', 'database.db'), (err) => {
    if (err) {
        console.error('Could not connect to database:', err.message);
    }
});

/**
 * Route lấy số lượng đơn hàng
 * Phương thức: GET
 * Đường dẫn: /orders/count
 * Trả về: Số lượng đơn hàng trong hệ thống
 */
router.get('/count', async (req, res) => {
    try {
        // Truy vấn đếm tổng số đơn hàng
        db.get('SELECT COUNT(*) as count FROM orders', (err, row) => {
            if (err) return res.status(500).json({ error: 'Failed to get orders count' });
            // Trả về số lượng, mặc định 0 nếu không có dữ liệu
            res.json({ count: row ? row.count : 0 });
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to get orders count' });
    }
});

// Xuất router
module.exports = router;
