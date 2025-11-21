// Import các module cần thiết
const express = require('express');
const bcrypt = require('bcrypt'); // Để hash và so sánh mật khẩu
const jwt = require('jsonwebtoken'); // Để tạo JWT tokens
const dotenv = require('dotenv');
dotenv.config(); // Load biến môi trường

// Import user model để tương tác với database
const { createUser, findUserByUsername } = require('../models/user');

const router = express.Router();

/**
 * Route đăng ký người dùng mới
 * POST /auth/register
 * Body: { username, password, role? }
 */
router.post('/register', async (req, res) => {
    try {
        const { username, password, role } = req.body;

        // Validate input
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        // Tạo user mới sử dụng model
        await createUser(username, password, role || 'staff');
        res.status(201).json({ message: 'User created successfully' });
    } catch (err) {
        // Xử lý lỗi (ví dụ: username đã tồn tại)
        if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Username already exists' });
        }
        console.error('Registration error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Route đăng nhập
 * POST /auth/login
 * Body: { username, password }
 */
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validate input
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        // Tìm user theo username
        const user = await findUserByUsername(username);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // So sánh mật khẩu
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Tạo JWT token
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ token });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Route đăng xuất
 * POST /auth/logout
 */
router.post('/logout', (req, res) => {
    // Đối với JWT, việc "đăng xuất" chủ yếu là xóa token ở phía client.
    // Server không cần làm gì nhiều ngoài việc xác nhận yêu cầu.
    // Nếu có sử dụng refresh token hoặc blacklist token, logic sẽ phức tạp hơn.
    res.status(200).json({ message: 'Logged out successfully' });
});

module.exports = router;