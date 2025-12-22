// Module quản lý người dùng - models/user.js
// Module này cung cấp các chức năng CRUD cho người dùng, bao gồm
// tạo tài khoản, xác thực đăng nhập, cập nhật thông tin và quản lý vai trò.

const sqlite3 = require('sqlite3').verbose(); // Thư viện SQLite3 để quản lý CSDL
const path = require('path'); // Xử lý đường dẫn file
const bcrypt = require('bcrypt'); // Thư viện để hash mật khẩu bảo mật
const dotenv = require('dotenv'); // Tải biến môi trường
dotenv.config(); // Khởi tạo biến môi trường

// Kết nối CSDL SQLite
const db = new sqlite3.Database(path.join(__dirname, '../database.db'), (err) => {
    if (err) {
        console.error('Could not connect to database:', err.message);
    }
});

/**
 * Tạo người dùng mới
 * @param {string} username - Tên đăng nhập
 * @param {string} password - Mật khẩu (sẽ được hash)
 * @param {string} role - Vai trò (mặc định 'staff')
 * @param {string} email - Email
 * @param {string} status - Trạng thái (mặc định 'active')
 * @returns {Object} - Đối tượng chứa id của user mới
 */
const createUser = async (username, password, role = 'staff', email = null, status = 'active') => {
    try {
        // Check if username already exists
        const existingUser = await findUserByUsername(username);
        if (existingUser) {
            throw new Error('Username already exists');
        }

        // Hash mật khẩu với salt rounds = 10
        const hashedPassword = await bcrypt.hash(password, 10);

        // Thực thi INSERT query
        const result = await new Promise((resolve, reject) => {
            db.run('INSERT INTO users (username, password, role, email, status) VALUES (?, ?, ?, ?, ?)', [username, hashedPassword, role, email, status], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID });
                }
            });
        });
        return result;
    } catch (err) {
        throw err;
    }
};

/**
 * Tìm người dùng theo username
 * @param {string} username - Tên đăng nhập
 * @returns {Object|null} - Thông tin user hoặc null nếu không tìm thấy
 */
const findUserByUsername = async (username) => {
    try {
        return await new Promise((resolve, reject) => {
            db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
                if (err) reject(err);
                else resolve(user);
            });
        });
    } catch (err) {
        throw err;
    }
};

/**
 * Lấy danh sách tất cả người dùng
 * @returns {Array} - Mảng các user objects
 */
const getAllUsers = async () => {
    try {
        return await new Promise((resolve, reject) => {
            db.all('SELECT * FROM users', (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    } catch (err) {
        throw err;
    }
};

/**
 * Lấy thông tin người dùng theo ID
 * @param {number} id - ID của user
 * @returns {Object|null} - Thông tin user hoặc null nếu không tìm thấy
 */
const getUserById = async (id) => {
    try {
        return await new Promise((resolve, reject) => {
            db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    } catch (err) {
        throw err;
    }
};

/**
 * Cập nhật thông tin người dùng
 * @param {number} id - ID của user cần cập nhật
 * @param {Object} updates - Đối tượng chứa các trường cần cập nhật {username?, password?, role?, email?, status?}
 * @returns {Object} - Thông tin user sau khi cập nhật
 */
const updateUser = async (id, updates) => {
    try {
        const { username, password, role, email, status } = updates;
        let setClause = []; // Mảng chứa các trường cần update
        let values = []; // Mảng chứa giá trị tương ứng

        // Check if username is being updated and already exists
        if (username) {
            const existingUser = await findUserByUsername(username);
            if (existingUser && existingUser.id !== parseInt(id)) {
                throw new Error('Username already exists');
            }
            setClause.push('username = ?');
            values.push(username);
        }
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            setClause.push('password = ?');
            values.push(hashedPassword);
        }
        if (role) {
            setClause.push('role = ?');
            values.push(role);
        }
        if (email !== undefined) {
            setClause.push('email = ?');
            values.push(email);
        }
        if (status) {
            setClause.push('status = ?');
            values.push(status);
        }
        values.push(id); // Thêm id vào cuối mảng values

        if (setClause.length === 0) {
            throw new Error('No updates provided');
        }

        // Thực thi UPDATE query
        await new Promise((resolve, reject) => {
            db.run(`UPDATE users SET ${setClause.join(', ')} WHERE id = ?`, values, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        // Trả về thông tin user sau khi cập nhật
        return await getUserById(id);
    } catch (err) {
        console.error('Detailed error in updateUser:', err);
        throw err;
    }
};

/**
 * Xóa người dùng theo ID
 * @param {number} id - ID của user cần xóa
 * @returns {Object} - Thông báo xóa thành công
 */
const deleteUser = async (id) => {
    try {
        await new Promise((resolve, reject) => {
            db.run('DELETE FROM users WHERE id = ?', [id], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        return { message: 'User deleted successfully' };
    } catch (err) {
        throw err;
    }
};

/**
 * Đếm tổng số người dùng trong hệ thống
 * @returns {number} - Số lượng người dùng
 */
const getUsersCount = async () => {
    try {
        return await new Promise((resolve, reject) => {
            db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        });
    } catch (err) {
        throw err;
    }
};

// Xuất các hàm để sử dụng trong các module khác
module.exports = {
    createUser, // Tạo người dùng mới với mật khẩu được hash
    findUserByUsername, // Tìm người dùng theo tên đăng nhập
    getAllUsers, // Lấy danh sách tất cả người dùng
    getUserById, // Lấy thông tin người dùng theo ID
    updateUser, // Cập nhật thông tin người dùng
    deleteUser, // Xóa người dùng
    getUsersCount // Đếm tổng số người dùng
};