// Module này quản lý các giao dịch tồn kho trong hệ thống quản lý kho hàng.
// Nó cung cấp các chức năng để tạo, truy vấn và quản lý các giao dịch như nhập, xuất, chuyển kho.

// Import các thư viện cần thiết
const sqlite3 = require('sqlite3').verbose(); // Sử dụng SQLite3 để quản lý cơ sở dữ liệu
const path = require('path'); // Để xử lý đường dẫn file
const dotenv = require('dotenv'); // Để tải biến môi trường từ file .env
dotenv.config(); // Khởi tạo biến môi trường

// Kết nối đến cơ sở dữ liệu SQLite
const db = new sqlite3.Database(path.join(__dirname, '../database.db'), (err) => {
    if (err) {
        console.error('Could not connect to database:', err.message);
    }
});

// Hàm tạo giao dịch tồn kho mới
// Tham số:
// - reference_id: Mã tham chiếu giao dịch (tự động tạo nếu không cung cấp)
// - productId: ID của sản phẩm
// - warehouseId: ID của kho
// - quantity: Số lượng sản phẩm trong giao dịch
// - type: Loại giao dịch (in/out/transfer)
// - supplier_id: ID nhà cung cấp (tùy chọn)
// - customer_name: Tên khách hàng (tùy chọn)
// - notes: Ghi chú (tùy chọn)
// Trả về: Đối tượng chứa reference_id của giao dịch vừa tạo
const createTransaction = async (reference_id, productId, warehouseId, quantity, type, supplier_id = null, customer_name = null, notes = null) => {
    try {
        // Tự động tạo reference_id nếu không được cung cấp
        const final_reference_id = reference_id || `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;

        const result = await new Promise((resolve, reject) => {
            // Chèn giao dịch mới vào bảng inventory_transactions
            db.run('INSERT INTO inventory_transactions (reference_id, product_id, warehouse_id, quantity, type, supplier_id, customer_name, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [final_reference_id, productId, warehouseId, quantity, type, supplier_id, customer_name, notes], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ reference_id: final_reference_id });
                }
            });
        });
        return result;
    } catch (err) {
        throw err;
    }
};

// Hàm lấy danh sách giao dịch tồn kho
// Có thể lọc theo productId hoặc warehouseId
// Trả về danh sách giao dịch với thông tin sản phẩm và kho, bao gồm giá trị giao dịch
const getTransactions = async (productId = null, warehouseId = null) => {
    try {
        // Xây dựng truy vấn SQL với JOIN để lấy thông tin sản phẩm và kho
        let query = `SELECT it.reference_id, it.product_id, it.warehouse_id, it.quantity, it.type, it.transaction_date, p.name as product_name, w.name as warehouse_name, p.price
        FROM inventory_transactions it
        JOIN products p ON it.product_id = p.custom_id
        JOIN warehouses w ON it.warehouse_id = w.custom_id`;

        let params = [];
        // Thêm điều kiện WHERE nếu có bộ lọc
        if (productId || warehouseId) {
            query += ' WHERE ';
            const conditions = [];
            if (productId) {
                conditions.push('it.product_id = ?');
                params.push(productId);
            }
            if (warehouseId) {
                conditions.push('it.warehouse_id = ?');
                params.push(warehouseId);
            }
            query += conditions.join(' AND ');
        }
        return await new Promise((resolve, reject) => {
            db.all(query, params, (err, rows) => {
                if (err) reject(err);
                else {
                    // Tính toán giá trị cho từng giao dịch (giá * số lượng)
                    const transactionsWithValues = rows.map(transaction => ({
                        ...transaction,
                        value: transaction.price ? transaction.price * transaction.quantity : 0
                    }));
                    resolve(transactionsWithValues);
                }
            });
        });
    } catch (err) {
        throw err;
    }
};

// Hàm lấy giao dịch theo mã tham chiếu
// Tham số: reference_id - Mã tham chiếu giao dịch
// Trả về: Đối tượng giao dịch hoặc null nếu không tìm thấy
const getTransactionByReferenceId = async (reference_id) => {
    try {
        return await new Promise((resolve, reject) => {
            db.get('SELECT * FROM inventory_transactions WHERE reference_id = ?', [reference_id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    } catch (err) {
        throw err;
    }
};

// Hàm lấy giao dịch theo ID (tương tự getTransactionByReferenceId, sử dụng reference_id làm ID)
const getTransactionById = async (reference_id) => {
    try {
        return await new Promise((resolve, reject) => {
            db.get('SELECT * FROM inventory_transactions WHERE reference_id = ?', [reference_id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    } catch (err) {
        throw err;
    }
};

// Hàm lấy danh sách giao dịch với phân trang và bộ lọc
// Tham số:
// - page: Trang hiện tại (mặc định 1)
// - limit: Số giao dịch mỗi trang (mặc định 10)
// - type: Loại giao dịch để lọc (tùy chọn)
// - warehouseId: ID kho để lọc (tùy chọn)
// - startDate: Ngày bắt đầu lọc (tùy chọn)
// - endDate: Ngày kết thúc lọc (tùy chọn)
// - search: Từ khóa tìm kiếm trong reference_id, tên sản phẩm, tên kho (tùy chọn)
// Trả về: Đối tượng chứa danh sách giao dịch, tổng số, tổng trang, trang hiện tại
const getTransactionsPaginated = async (page = 1, limit = 10, type = null, warehouseId = null, startDate = null, endDate = null, search = null) => {
    try {
        // Tính offset cho phân trang
        const offset = (page - 1) * limit;

        // Xây dựng mệnh đề WHERE động dựa trên các bộ lọc
        let whereClause = '';
        const whereParams = [];

        if (type || warehouseId || startDate || endDate || search) {
            const conditions = [];

            if (type) {
                conditions.push('it.type = ?');
                whereParams.push(type);
            }

            if (warehouseId) {
                conditions.push('it.warehouse_id = ?');
                whereParams.push(warehouseId);
            }

            if (startDate) {
                conditions.push('DATE(it.transaction_date) >= ?');
                whereParams.push(startDate);
            }

            if (endDate) {
                conditions.push('DATE(it.transaction_date) <= ?');
                whereParams.push(endDate);
            }

            if (search) {
                // Tìm kiếm trong reference_id, tên sản phẩm, tên kho
                conditions.push('(it.reference_id LIKE ? OR p.name LIKE ? OR w.name LIKE ?)');
                const searchTerm = `%${search}%`;
                whereParams.push(searchTerm, searchTerm, searchTerm);
            }

            whereClause = ' WHERE ' + conditions.join(' AND ');
        }

        // Lấy tổng số giao dịch phù hợp với bộ lọc
        const totalCount = await new Promise((resolve, reject) => {
            let countSql = 'SELECT COUNT(*) as count FROM inventory_transactions it JOIN products p ON it.product_id = p.custom_id JOIN warehouses w ON it.warehouse_id = w.custom_id';
            if (whereClause) {
                countSql += whereClause;
            }
            db.get(countSql, whereParams, (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        });

        // Tính tổng số trang
        const totalPages = Math.ceil(totalCount / limit);

        // Lấy danh sách giao dịch với phân trang
        const transactions = await new Promise((resolve, reject) => {
            let sql = `SELECT it.reference_id, it.product_id, it.warehouse_id, it.quantity, it.type, it.transaction_date, p.name as product_name, w.name as warehouse_name, p.price FROM inventory_transactions it JOIN products p ON it.product_id = p.custom_id JOIN warehouses w ON it.warehouse_id = w.custom_id`;
            if (whereClause) {
                sql += whereClause;
            }
            // Sắp xếp theo ngày giao dịch giảm dần, giới hạn kết quả
            sql += ' ORDER BY it.transaction_date DESC LIMIT ? OFFSET ?';
            const params = [...whereParams, limit, offset];

             db.all(sql, params, (err, rows) => {
                 if (err) {
                     console.error('DB Error:', err);
                     reject(err);
                  } else {
                      // Tính toán giá trị cho từng giao dịch (đảm bảo price là số thực)
                      const transactionsWithValues = rows.map(transaction => ({
                          ...transaction,
                          value: transaction.price ? parseFloat(transaction.price) * transaction.quantity : 0
                      }));
                      resolve(transactionsWithValues);
                  }
             });
        });

        // Trả về kết quả phân trang
        return {
            transactions,
            totalCount,
            totalPages,
            currentPage: page
        };
    } catch (err) {
        throw err;
    }
};

// Xuất các hàm để sử dụng trong các module khác
module.exports = {
    createTransaction, // Hàm tạo giao dịch mới
    getTransactions, // Hàm lấy danh sách giao dịch với bộ lọc
    getTransactionById, // Hàm lấy giao dịch theo ID
    getTransactionByReferenceId, // Hàm lấy giao dịch theo mã tham chiếu
    getTransactionsPaginated // Hàm lấy giao dịch phân trang với bộ lọc
};