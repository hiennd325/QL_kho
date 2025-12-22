// Module quản lý kho - models/warehouse.js
// Module này cung cấp các chức năng CRUD cho kho hàng,
// bao gồm quản lý dung lượng, cập nhật mức sử dụng hiện tại và truy vấn sản phẩm trong kho.

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

// Hàm tạo kho mới
// Tham số: name - Tên kho, location - Địa điểm, capacity - Dung lượng, custom_id - Mã kho tùy chỉnh
// Trả về: Đối tượng chứa custom_id của kho vừa tạo
const createWarehouse = async (name, location, capacity, custom_id = null) => {
    try {
        // Đảm bảo location không null, mặc định là chuỗi rỗng nếu không cung cấp
        const safeLocation = location || '';
        const safeCapacity = capacity !== undefined && capacity !== null ? capacity : 0;

        // Kiểm tra custom_id phải được cung cấp
        if (!custom_id) {
            throw new Error('custom_id is required');
        }

        // Kiểm tra mã kho đã tồn tại chưa
        const existingWarehouse = await getWarehouseById(custom_id);
        if (existingWarehouse) {
            throw new Error('Mã kho đã tồn tại');
        }

        // Chèn kho mới vào CSDL
        const result = await new Promise((resolve, reject) => {
            db.run('INSERT INTO warehouses (custom_id, name, location, capacity) VALUES (?, ?, ?, ?)', [custom_id, name, safeLocation, safeCapacity], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ custom_id: custom_id });
                }
            });
        });
        return result;
    } catch (err) {
        throw err;
    }
};

// Hàm lấy danh sách tất cả kho
// Trả về: Mảng các kho
const getWarehouses = async () => {
    try {
        return await new Promise((resolve, reject) => {
            db.all('SELECT * FROM warehouses', (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    } catch (err) {
        throw err;
    }
};

// Hàm lấy thông tin kho theo custom_id
// Tham số: custom_id - Mã kho
// Trả về: Đối tượng kho hoặc null
const getWarehouseById = async (custom_id) => {
    try {
        return await new Promise((resolve, reject) => {
            db.get('SELECT * FROM warehouses WHERE custom_id = ?', [custom_id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    } catch (err) {
        throw err;
    }
};

// Hàm cập nhật thông tin kho
// Tham số: custom_id - Mã kho, updates - Đối tượng chứa các trường cần cập nhật
// Trả về: Đối tượng kho sau khi cập nhật
const updateWarehouse = async (custom_id, updates) => {
    try {
        const { name, location, capacity } = updates;
        const setClause = [];
        const values = [];
        if (name) {
            setClause.push('name = ?');
            values.push(name);
        }
        if (location) {
            setClause.push('location = ?');
            values.push(location);
        }
        if (capacity !== undefined) {
            setClause.push('capacity = ?');
            values.push(capacity);
        }
        if (setClause.length === 0) {
            throw new Error('No updates provided');
        }
        values.push(custom_id);
        await new Promise((resolve, reject) => {
            db.run(`UPDATE warehouses SET ${setClause.join(', ')} WHERE custom_id = ?`, values, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        return getWarehouseById(custom_id);
    } catch (err) {
        throw err;
    }
};

// Hàm lấy danh sách sản phẩm trong một kho cụ thể
// Tham số: warehouseCustomId - Mã kho
// Trả về: Mảng sản phẩm với số lượng tồn kho
const getWarehouseProducts = async (warehouseCustomId) => {
    try {
        const query = `SELECT p.custom_id as id, p.name, p.price, i.quantity
                       FROM inventory i
                       JOIN products p ON i.product_id = p.custom_id
                       WHERE i.warehouse_id = ?
                       ORDER BY p.name`;

        return await new Promise((resolve, reject) => {
            db.all(query, [warehouseCustomId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    } catch (err) {
        throw err;
    }
};

// Hàm xóa kho (chỉ khi kho trống)
// Tham số: custom_id - Mã kho cần xóa
// Trả về: Thông báo xóa thành công
const deleteWarehouse = async (custom_id) => {
    try {
        const inventoryCount = await new Promise((resolve, reject) => {
            db.get('SELECT COUNT(*) as count FROM inventory WHERE warehouse_id = ?', [custom_id], (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        });

        if (inventoryCount > 0) {
            throw new Error('Kho vẫn còn hàng, không thể xóa.');
        }

        await new Promise((resolve, reject) => {
            db.run('DELETE FROM warehouses WHERE custom_id = ?', [custom_id], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        return { message: 'Warehouse deleted successfully' };
    } catch (err) {
        throw err;
    }
};

// Hàm cập nhật mức sử dụng hiện tại của kho
// Tính tổng số lượng sản phẩm trong kho và cập nhật vào bảng warehouses
// Tham số: warehouseCustomId - Mã kho
// Trả về: Tổng số lượng sản phẩm trong kho
const updateCurrentUsage = async (warehouseCustomId) => {
    try {
        // Tính tổng số lượng tồn kho trong kho này
        const totalUsage = await new Promise((resolve, reject) => {
            db.get('SELECT SUM(quantity) as total FROM inventory WHERE warehouse_id = ?', [warehouseCustomId], (err, row) => {
                if (err) reject(err);
                else resolve(row.total || 0);
            });
        });

        // Cập nhật current_usage trong bảng warehouses
        await new Promise((resolve, reject) => {
            db.run('UPDATE warehouses SET current_usage = ? WHERE custom_id = ?', [totalUsage, warehouseCustomId], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        return totalUsage;
    } catch (err) {
        throw err;
    }
};

// Hàm đếm tổng số kho
// Trả về: Số lượng kho
const getWarehousesCount = async () => {
    try {
        return await new Promise((resolve, reject) => {
            db.get('SELECT COUNT(*) as count FROM warehouses', (err, row) => {
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
    createWarehouse, // Tạo kho mới
    getWarehouses, // Lấy danh sách tất cả kho
    getWarehouseById, // Lấy kho theo ID
    updateWarehouse, // Cập nhật thông tin kho
    getWarehouseProducts, // Lấy sản phẩm trong kho
    deleteWarehouse, // Xóa kho
    getWarehousesCount, // Đếm tổng số kho
    updateCurrentUsage // Cập nhật mức sử dụng kho
};