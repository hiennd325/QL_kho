/**
 * File định nghĩa các route quản lý người dùng (users)
 * Bao gồm: lấy danh sách, tạo, cập nhật, xóa người dùng
 * Các route tạo, cập nhật, xóa yêu cầu quyền admin
 */

// Import các module cần thiết
const express = require('express'); // Framework web
const router = express.Router(); // Tạo router instance
const userModel = require('../models/user'); // Model xử lý logic người dùng
const { authorizeAdmin } = require('../middleware/auth'); // Middleware kiểm tra quyền admin

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
router.post('/', authorizeAdmin, async (req, res) => {
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
router.put('/:id', authorizeAdmin, async (req, res) => {
    try {
        const userIdToUpdate = req.params.id;

        // Get user info to check their username
        const userToUpdate = await userModel.getUserById(userIdToUpdate);

        if (!userToUpdate) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Prevent editing the main 'admin' account, but allow the admin to edit their own info if their ID matches.
        // This handles the case where the logged-in admin is the one being edited.
        if (userToUpdate.username === 'admin' && userToUpdate.id != req.user.id) {
             return res.status(403).json({ error: 'Không thể chỉnh sửa tài khoản quản trị viên mặc định.' });
        }

        // A more specific check: prevent changing the role of the default admin
        if (userToUpdate.username === 'admin' && req.body.role && req.body.role !== 'admin') {
            return res.status(403).json({ error: 'Không thể thay đổi vai trò của quản trị viên mặc định.' });
        }
        
        const { username, password, role, email, status } = req.body;

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
router.delete('/:id', authorizeAdmin, async (req, res) => {
    try {
        const userIdToDelete = req.params.id;
        const requestingUserId = req.user.id;

        // Prevent user from deleting themselves
        if (userIdToDelete == requestingUserId) {
            return res.status(403).json({ error: 'Bạn không thể tự xóa tài khoản của mình.' });
        }

        // Get user info to check their username
        const userToDelete = await userModel.getUserById(userIdToDelete);

        if (!userToDelete) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Prevent deleting the main 'admin' account
        if (userToDelete.username === 'admin') {
            return res.status(403).json({ error: 'Không thể xóa tài khoản quản trị viên mặc định.' });
        }

        const result = await userModel.deleteUser(userIdToDelete);
        res.json(result);
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// Xuất router để sử dụng trong ứng dụng chính
module.exports = router;