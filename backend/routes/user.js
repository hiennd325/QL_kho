// Import các module cần thiết
const express = require('express');
const router = express.Router();
const userModel = require('../models/user');

/**
 * Lấy danh sách tất cả người dùng
 * GET /users?search=...&role=...&status=...
 * Query params:
 * - search: Tìm kiếm theo username hoặc email
 * - role: Lọc theo vai trò (admin, staff)
 * - status: Lọc theo trạng thái (active, inactive)
 */
router.get('/', async (req, res) => {
    try {
        const { search, role, status } = req.query;
        let users = await userModel.getAllUsers();

        // Filter by role if specified
        if (role) {
            users = users.filter(u => u.role === role);
        }

        // Filter by status if specified
        if (status) {
            users = users.filter(u => u.status === status);
        }

        // Search by username or email if specified
        if (search) {
            const searchLower = search.toLowerCase();
            users = users.filter(u => 
                u.username.toLowerCase().includes(searchLower) ||
                (u.email && u.email.toLowerCase().includes(searchLower))
            );
        }

        res.json(users);
    } catch (err) {
        console.error('Error getting users:', err);
        res.status(500).json({ error: 'Failed to get users' });
    }
});

// Provide a simple count endpoint before '/:id' so '/count' doesn't match ':id'
/**
 * Lấy số lượng người dùng
 * GET /users/count
 */
router.get('/count', async (req, res) => {
    try {
        const count = await userModel.getUsersCount();
        res.json({ count });
    } catch (err) {
        console.error('Error getting users count:', err);
        res.status(500).json({ error: 'Failed to get users count' });
    }
});

/**
 * Lấy thông tin người dùng theo ID
 * GET /users/:id
 */
router.get('/:id', async (req, res) => {
    try {
        const user = await userModel.getUserById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        console.error('Error getting user:', err);
        res.status(500).json({ error: 'Failed to get user' });
    }
});

/**
 * Tạo người dùng mới
 * POST /users
 * Body: { username, password, role?, email?, status? }
 * Chỉ admin mới có quyền tạo
 */
router.post('/', async (req, res) => {
    try {
        const { username, password, role, email, status } = req.body;
        const newUser = await userModel.createUser(username, password, role, email, status);
        res.status(201).json(newUser);
    } catch (err) {
        console.error('Error creating user:', err);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

/**
 * Cập nhật thông tin người dùng
 * PUT /users/:id
 * Body: { username?, password?, role?, email?, status? }
 * Chỉ admin mới có thể khóa tài khoản (set status = 'inactive')
 */
router.put('/:id', async (req, res) => {
    try {
        const { username, password, role, email, status } = req.body;

        // Kiểm tra nếu đang cố gắng khóa tài khoản (set status = 'inactive'), chỉ admin mới được phép
        if (status === 'inactive' && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied. Only admin can lock user accounts.' });
        }

        const updatedUser = await userModel.updateUser(req.params.id, {
            username,
            password,
            role,
            email,
            status
        });
        res.json(updatedUser);
    } catch (err) {
        console.error('Error updating user:', err);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

/**
 * Xóa người dùng
 * DELETE /users/:id
 * Chỉ admin mới có quyền xóa
 */
router.delete('/:id', async (req, res) => {
    try {
        const result = await userModel.deleteUser(req.params.id);
        res.json(result);
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

module.exports = router;