// Import các module cần thiết
const express = require('express');
const router = express.Router();
const userModel = require('../models/user');

/**
 * Lấy danh sách tất cả người dùng
 * GET /users
 * Chỉ admin mới có quyền truy cập
 */
router.get('/', async (req, res) => {
    try {
        const users = await userModel.getAllUsers();
        res.json(users);
    } catch (err) {
        console.error('Error getting users:', err);
        res.status(500).json({ error: 'Failed to get users' });
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
 * Body: { username, password, role? }
 * Chỉ admin mới có quyền tạo
 */
router.post('/', async (req, res) => {
    try {
        const { username, password, role } = req.body;
        const newUser = await userModel.createUser(username, password, role);
        res.status(201).json(newUser);
    } catch (err) {
        console.error('Error creating user:', err);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

/**
 * Cập nhật thông tin người dùng
 * PUT /users/:id
 * Body: { username?, password?, role? }
 */
router.put('/:id', async (req, res) => {
    try {
        const { username, password, role } = req.body;
        const updatedUser = await userModel.updateUser(req.params.id, {
            username,
            password,
            role
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