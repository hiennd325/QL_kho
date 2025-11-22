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

// Provide a simple count endpoint before '/:id' so '/count' doesn't match ':id'
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
 */
router.put('/:id', async (req, res) => {
    try {
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
router.delete('/:id', async (req, res) => {
    try {
        const result = await userModel.deleteUser(req.params.id);
        res.json(result);
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

router.get('/count', async (req, res) => {
    try {
        const count = await userModel.getUsersCount();
        res.json({ count });
    } catch (err) {
        res.status(500).json({ error: 'Failed to get users count' });
    }
});

module.exports = router;