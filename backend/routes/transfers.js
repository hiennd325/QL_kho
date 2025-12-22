/**
 * File định nghĩa các route quản lý việc chuyển hàng giữa các kho (transfers)
 * Bao gồm: lấy danh sách, tạo, cập nhật trạng thái, xóa phiếu chuyển kho
 * Tất cả routes đều yêu cầu xác thực JWT
 */

// Import các module cần thiết
const express = require('express'); // Framework web
const router = express.Router(); // Tạo router instance
const { createTransfer, getTransfers, getTransferById, updateTransferStatus, deleteTransfer } = require('../models/transfers'); // Các hàm model
const jwt = require('jsonwebtoken'); // Thư viện JWT

/**
 * Middleware xác thực JWT token
 * Kiểm tra token trong header Authorization
 * Nếu hợp lệ, lưu thông tin user vào req.user
 */
const authenticateToken = (req, res, next) => {
    // Lấy token từ header Authorization: "Bearer <token>"
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    // Nếu không có token, trả về lỗi 401
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    // Xác minh token với secret key
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
        if (err) {
            // Token không hợp lệ, trả về lỗi 403
            return res.status(403).json({ error: 'Invalid token' });
        }
        // Lưu thông tin user vào request
        req.user = user;
        next(); // Tiếp tục xử lý
    });
};

/**
 * Route lấy danh sách phiếu chuyển kho gần đây
 * Phương thức: GET
 * Đường dẫn: /transfers
 * Query parameters: limit (mặc định 10)
 * Yêu cầu: Xác thực JWT
 */
router.get('/', authenticateToken, async (req, res) => {
    try {
        // Lấy tham số limit, mặc định 10
        const limit = parseInt(req.query.limit) || 10;

        // Lấy danh sách transfers từ model
        const transfers = await getTransfers(limit);

        // Định dạng dữ liệu cho frontend
        const formattedTransfers = transfers.map(transfer => ({
            id: transfer.id,
            code: transfer.code, // Mã phiếu
            date: new Date(transfer.created_at).toLocaleDateString('vi-VN'), // Ngày tạo (định dạng VN)
            from_warehouse: transfer.from_warehouse_name, // Tên kho nguồn
            to_warehouse: transfer.to_warehouse_name, // Tên kho đích
            item_count: transfer.item_count, // Số lượng mặt hàng
            product_names: transfer.product_names, // Tên các sản phẩm
            status: transfer.status, // Trạng thái
            user: transfer.user_name // Tên người tạo
        }));

        // Trả về danh sách đã định dạng
        res.json(formattedTransfers);
    } catch (error) {
        console.error('Error fetching transfers:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Route lấy chi tiết một phiếu chuyển kho theo ID
 * Phương thức: GET
 * Đường dẫn: /transfers/:id
 * Yêu cầu: Xác thực JWT
 */
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        // Lấy transfer theo ID
        const transfer = await getTransferById(req.params.id);
        if (!transfer) {
            // Không tìm thấy transfer
            return res.status(404).json({ error: 'Transfer not found' });
        }
        // Trả về thông tin transfer
        res.json(transfer);
    } catch (error) {
        console.error('Error fetching transfer:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Route tạo phiếu chuyển kho mới
 * Phương thức: POST
 * Đường dẫn: /transfers
 * Body: { from_warehouse_id, to_warehouse_id, items: [{product_id, quantity}], notes? }
 * Yêu cầu: Xác thực JWT
 */
router.post('/', authenticateToken, async (req, res) => {
    try {
        // Lấy dữ liệu từ request body
        const { from_warehouse_id, to_warehouse_id, items, notes } = req.body;

        // Kiểm tra dữ liệu bắt buộc
        if (!from_warehouse_id || !to_warehouse_id || !items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Missing required fields or empty items list' });
        }

        // Kiểm tra kho nguồn và đích khác nhau
        if (from_warehouse_id === to_warehouse_id) {
            return res.status(400).json({ error: 'From and to warehouses cannot be the same' });
        }

        // Chuẩn bị dữ liệu cho model
        const transferData = {
            from_warehouse_id, // ID kho nguồn
            to_warehouse_id, // ID kho đích
            items: items.map(item => ({
                product_id: item.product_id, // ID sản phẩm
                quantity: parseInt(item.quantity) // Số lượng chuyển
            })),
            user_id: req.user.id, // ID người tạo (từ JWT)
            notes // Ghi chú
        };

        // Tạo transfer mới
        const result = await createTransfer(transferData);
        res.status(201).json({ message: 'Transfer created successfully', transfer: result });
    } catch (error) {
        console.error('Error creating transfer:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Route cập nhật trạng thái phiếu chuyển kho
 * Phương thức: PUT
 * Đường dẫn: /transfers/:id/status
 * Body: { status: 'pending' | 'in_progress' | 'completed' | 'cancelled' }
 * Yêu cầu: Xác thực JWT
 */
router.put('/:id/status', authenticateToken, async (req, res) => {
    try {
        const { status } = req.body;
        // Các trạng thái hợp lệ
        const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];

        // Kiểm tra trạng thái hợp lệ
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        // Cập nhật trạng thái
        const result = await updateTransferStatus(req.params.id, status);
        if (result.changes === 0) {
            // Không tìm thấy transfer
            return res.status(404).json({ error: 'Transfer not found' });
        }

        // Thành công
        res.json({ message: 'Transfer status updated successfully' });
    } catch (error) {
        console.error('Error updating transfer status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Route xóa phiếu chuyển kho
 * Phương thức: DELETE
 * Đường dẫn: /transfers/:id
 * Yêu cầu: Xác thực JWT
 */
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        // Xóa transfer
        const result = await deleteTransfer(req.params.id);
        if (result.changes === 0) {
            // Không tìm thấy transfer để xóa
            return res.status(404).json({ error: 'Transfer not found' });
        }
        // Thành công
        res.json({ message: 'Transfer deleted successfully' });
    } catch (error) {
        console.error('Error deleting transfer:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Xuất router để sử dụng trong ứng dụng
module.exports = router;