// Import các module cần thiết
const jwt = require('jsonwebtoken'); // Module để tạo và verify JWT tokens
const dotenv = require('dotenv'); // Module để load biến môi trường
dotenv.config(); // Load biến từ file .env

/**
 * Middleware để xác thực JWT token
 * Kiểm tra token trong header Authorization
 * Nếu hợp lệ, thêm thông tin user vào req.user
 */
function authenticate(req, res, next) {
  // Lấy token từ header Authorization (format: "Bearer <token>")
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    // Verify token với secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Lưu thông tin user đã decode vào request
    next(); // Tiếp tục xử lý request
  } catch (err) {
    return res.status(403).json({ error: 'Forbidden' });
  }
}

/**
 * Middleware để kiểm tra quyền admin
 * Chỉ cho phép user có role 'admin' tiếp tục
 */
function authorizeAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin role required.' });
  }
  next();
}

module.exports = {
    authenticate,
    authorizeAdmin
};
