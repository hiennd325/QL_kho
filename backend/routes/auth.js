/**
 * File định nghĩa các route liên quan đến xác thực người dùng (authentication)
 * Bao gồm đăng ký, đăng nhập, và đăng xuất
 * Sử dụng JWT (JSON Web Tokens) để quản lý phiên làm việc
 */

// Import các module cần thiết từ thư viện bên ngoài
const express = require('express'); // Framework web để xây dựng API
const bcrypt = require('bcrypt'); // Thư viện để hash và so sánh mật khẩu an toàn
const jwt = require('jsonwebtoken'); // Thư viện để tạo và xác minh JWT tokens
const dotenv = require('dotenv'); // Thư viện để load biến môi trường từ file .env
dotenv.config(); // Khởi tạo dotenv để load các biến môi trường

// Import các hàm từ model user để tương tác với cơ sở dữ liệu
// createUser: Tạo người dùng mới
// findUserByUsername: Tìm người dùng theo tên đăng nhập
const { createUser, findUserByUsername } = require('../models/user');

// Tạo router instance để định nghĩa các route
const router = express.Router();

/**
 * Route xử lý đăng ký tài khoản người dùng mới
 * Phương thức: POST
 * Đường dẫn: /auth/register
 * Thân yêu cầu (request body): { username: string, password: string, role?: string }
 * Mô tả: Tạo tài khoản mới với thông tin được cung cấp, hash mật khẩu trước khi lưu
 */
router.post('/register', async (req, res) => {
    try {
        // Lấy thông tin từ thân yêu cầu
        const { username, password, role } = req.body;

        // Kiểm tra tính hợp lệ của dữ liệu đầu vào
        // Đảm bảo username và password không rỗng
        if (!username || !password) {
            // Trả về lỗi 400 nếu thiếu thông tin bắt buộc
            return res.status(400).json({ error: 'Username and password are required' });
        }

        // Gọi hàm createUser từ model để tạo người dùng mới trong cơ sở dữ liệu
        // Nếu không cung cấp role, mặc định là 'staff'
        await createUser(username, password, role || 'staff');

        // Trả về thành công với mã trạng thái 201 (Created)
        res.status(201).json({ message: 'User created successfully' });
    } catch (err) {
        // Xử lý các lỗi có thể xảy ra trong quá trình đăng ký
        // Nếu lỗi do username đã tồn tại (ràng buộc UNIQUE trong database)
        if (err.message.includes('UNIQUE constraint failed')) {
            // Trả về lỗi 400 với thông báo cụ thể
            return res.status(400).json({ error: 'Username already exists' });
        }

        // Ghi log lỗi để debug
        console.error('Registration error:', err);

        // Trả về lỗi server nội bộ cho các lỗi khác
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Route xử lý đăng nhập của người dùng
 * Phương thức: POST
 * Đường dẫn: /auth/login
 * Thân yêu cầu (request body): { username: string, password: string }
 * Mô tả: Xác thực thông tin đăng nhập, tạo JWT token nếu thành công
 */
router.post('/login', async (req, res) => {
    try {
        // Lấy thông tin đăng nhập từ thân yêu cầu
        const { username, password } = req.body;

        // Kiểm tra tính hợp lệ của dữ liệu đầu vào
        if (!username || !password) {
            // Trả về lỗi 400 nếu thiếu thông tin
            return res.status(400).json({ error: 'Username and password are required' });
        }

        // Tìm kiếm người dùng trong cơ sở dữ liệu theo username
        const user = await findUserByUsername(username);
        if (!user) {
            // Nếu không tìm thấy user, trả về lỗi xác thực không hợp lệ
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Kiểm tra trạng thái của tài khoản người dùng
        // Chỉ cho phép đăng nhập nếu tài khoản đang active
        if (user.status !== 'active') {
            // Trả về lỗi 403 nếu tài khoản bị khóa
            return res.status(403).json({ error: 'Tài khoản đã bị tạm khóa' });
        }

        // So sánh mật khẩu được cung cấp với hash mật khẩu trong database
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            // Nếu mật khẩu không khớp, trả về lỗi xác thực
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Nếu xác thực thành công, tạo JWT token chứa thông tin user
        // Token sẽ hết hạn sau 24 giờ
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET, // Khóa bí mật từ biến môi trường
            { expiresIn: '24h' } // Thời gian hết hạn
        );

        // Trả về token cho client
        res.json({ token });
    } catch (err) {
        // Ghi log lỗi để debug
        console.error('Login error:', err);

        // Trả về lỗi server nội bộ
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Route xử lý đăng xuất của người dùng
 * Phương thức: POST
 * Đường dẫn: /auth/logout
 * Thân yêu cầu: Không yêu cầu
 * Mô tả: Xử lý yêu cầu đăng xuất từ phía client
 */
router.post('/logout', (req, res) => {
    // Với hệ thống JWT stateless, việc đăng xuất chủ yếu được xử lý ở phía client
    // Client sẽ xóa JWT token khỏi localStorage hoặc sessionStorage
    // Server chỉ cần xác nhận yêu cầu và trả về phản hồi thành công

    // Trong triển khai đơn giản này, server không lưu trữ trạng thái phiên
    // Nếu hệ thống sử dụng refresh token hoặc blacklist token,
    // logic đăng xuất sẽ phức tạp hơn (ví dụ: thêm token vào blacklist)

    // Trả về phản hồi thành công với mã trạng thái 200
    res.status(200).json({ message: 'Logged out successfully' });
});

// Xuất router để có thể sử dụng trong file chính của ứng dụng
// Router này sẽ được mount vào đường dẫn /auth trong app.js
module.exports = router;