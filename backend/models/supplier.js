// Module quản lý nhà cung cấp - models/supplier.js
// Module này cung cấp các chức năng CRUD cho nhà cung cấp,
// bao gồm tạo, đọc, cập nhật, xóa và thống kê nhà cung cấp hàng đầu.

const sqlite3 = require('sqlite3').verbose(); // Thư viện SQLite3 để quản lý CSDL
const path = require('path'); // Xử lý đường dẫn file
const dotenv = require('dotenv'); // Tải biến môi trường
dotenv.config(); // Khởi tạo biến môi trường

// Kết nối CSDL SQLite
const db = new sqlite3.Database(path.join(__dirname, '../database.db'), (err) => {
    if (err) {
        console.error('Could not connect to database:', err.message);
    }
});

// Hàm tạo nhà cung cấp mới
// Tham số: code, name, contactPerson, phone, email, address
// Trả về: Đối tượng chứa ID của nhà cung cấp vừa tạo
const createSupplier = async (code, name, contactPerson, phone, email, address) => {
    try {
        // Kiểm tra mã nhà cung cấp đã tồn tại chưa
        const existingSupplier = await getSupplierByCode(code);
        if (existingSupplier) {
            throw new Error('Mã nhà cung cấp đã tồn tại');
        }

        const result = await new Promise((resolve, reject) => {
            // Chèn nhà cung cấp mới vào CSDL
            db.run('INSERT INTO suppliers (code, name, contact_person, phone, email, address) VALUES (?, ?, ?, ?, ?, ?)', [code, name, contactPerson, phone, email, address], function(err) {
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

// Hàm lấy danh sách nhà cung cấp với khả năng tìm kiếm theo tên
// Tham số: searchTerm - Từ khóa tìm kiếm (tùy chọn)
// Trả về: Mảng các nhà cung cấp
const getSuppliers = async (searchTerm) => {
    try {
        return await new Promise((resolve, reject) => {
            let sql = 'SELECT * FROM suppliers';
            const params = [];
            if (searchTerm) {
                sql += ' WHERE name LIKE ?';
                params.push(`%${searchTerm}%`);
            }
            db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    } catch (err) {
        throw err;
    }
};

// Hàm lấy thông tin nhà cung cấp theo ID
// Tham số: id - ID nhà cung cấp
// Trả về: Đối tượng nhà cung cấp hoặc null
const getSupplierById = async (id) => {
    try {
        return await new Promise((resolve, reject) => {
            db.get('SELECT * FROM suppliers WHERE id = ?', [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    } catch (err) {
        throw err;
    }
};

// Hàm lấy thông tin nhà cung cấp theo mã code
// Tham số: code - Mã nhà cung cấp
// Trả về: Đối tượng nhà cung cấp hoặc null
const getSupplierByCode = async (code) => {
    try {
        return await new Promise((resolve, reject) => {
            db.get('SELECT * FROM suppliers WHERE code = ?', [code], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    } catch (err) {
        throw err;
    }
};

// Hàm cập nhật thông tin nhà cung cấp
// Tham số: id - ID nhà cung cấp, updates - Đối tượng chứa các trường cần cập nhật
// Trả về: Đối tượng nhà cung cấp sau khi cập nhật
const updateSupplier = async (id, updates) => {
    try {
        const { code, name, contact_person, phone, email, address } = updates;
        const setClause = [];
        const values = [];
        
        // Check if code is being updated and already exists for another supplier
        if (code) {
            const existingSupplier = await getSupplierByCode(code);
            if (existingSupplier && existingSupplier.id != id) {
                throw new Error('Mã nhà cung cấp đã tồn tại');
            }
            setClause.push('code = ?');
            values.push(code);
        }
        
        if (name) {
            setClause.push('name = ?');
            values.push(name);
        }
        if (contact_person) {
            setClause.push('contact_person = ?');
            values.push(contact_person);
        }
        if (phone) {
            setClause.push('phone = ?');
            values.push(phone);
        }
        if (email) {
            setClause.push('email = ?');
            values.push(email);
        }
        if (address) {
            setClause.push('address = ?');
            values.push(address);
        }
        if (setClause.length === 0) {
            throw new Error('No updates provided');
        }
        values.push(id);
        await new Promise((resolve, reject) => {
            db.run(`UPDATE suppliers SET ${setClause.join(', ')} WHERE id = ?`, values, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        return getSupplierById(id);
    } catch (err) {
        throw err;
    }
};

// Hàm xóa nhà cung cấp
// Tham số: id - ID nhà cung cấp cần xóa
// Trả về: Thông báo xóa thành công
const deleteSupplier = async (id) => {
    try {
        await new Promise((resolve, reject) => {
            db.run('DELETE FROM suppliers WHERE id = ?', [id], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        return { message: 'Supplier deleted successfully' };
    } catch (err) {
        throw err;
    }
};

// Hàm lấy danh sách nhà cung cấp hàng đầu dựa trên số lượng đơn hàng và tổng giá trị
// Tham số: limit - Số lượng nhà cung cấp cần lấy (mặc định 3)
// Trả về: Mảng nhà cung cấp với thông tin thống kê
const getTopSuppliers = async (limit = 3) => {
    try {
        return await new Promise((resolve, reject) => {
            const sql = `
                SELECT s.*, 
                COUNT(o.id) as order_count,
                COALESCE(SUM(o.total_amount), 0) as total_value
                FROM suppliers s
                LEFT JOIN orders o ON s.id = o.supplier_id
                GROUP BY s.id, s.name, s.contact_person, s.phone, s.email, s.address, s.created_at
                ORDER BY order_count DESC, total_value DESC
                LIMIT ?
            `;
            db.all(sql, [limit], (err, rows) => {
                if (err) reject(err);
                else {
                    rows.forEach(row => {
                        row.total_value = parseFloat(row.total_value);
                        row.order_count = parseInt(row.order_count);
                    });
                    resolve(rows);
                }
            });
        });
    } catch (err) {
        throw err;
    }
};

// Hàm đếm tổng số nhà cung cấp
// Trả về: Số lượng nhà cung cấp
const getSuppliersCount = async () => {
    try {
        return await new Promise((resolve, reject) => {
            db.get('SELECT COUNT(*) as count FROM suppliers', (err, row) => {
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
    createSupplier, // Tạo nhà cung cấp mới
    getSuppliers, // Lấy danh sách nhà cung cấp
    getSupplierById, // Lấy theo ID
    getSupplierByCode, // Lấy theo mã
    updateSupplier, // Cập nhật nhà cung cấp
    deleteSupplier, // Xóa nhà cung cấp
    getTopSuppliers, // Lấy nhà cung cấp hàng đầu
    getSuppliersCount // Đếm tổng số nhà cung cấp
};