// Module quản lý sản phẩm - models/product.js
// Module này cung cấp các chức năng CRUD (tạo, đọc, cập nhật, xóa) cho sản phẩm,
// bao gồm tìm kiếm, lọc, phân trang và quản lý thông tin chi tiết của sản phẩm.

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

// Hàm tạo sản phẩm mới
// Tham số:
// - name: Tên sản phẩm
// - description: Mô tả sản phẩm
// - price: Giá sản phẩm
// - category: Danh mục sản phẩm
// - brand: Thương hiệu
// - supplierId: ID nhà cung cấp
// - customId: Mã sản phẩm tùy chỉnh (tùy chọn)
// Trả về: Đối tượng chứa ID của sản phẩm vừa tạo
const createProduct = async (name, description, price, category, brand, supplierId, customId) => {
    try {
        // Xử lý customId: loại bỏ khoảng trắng đầu cuối, chuyển thành chuỗi nếu cần
        const trimmedCustomId = customId ? customId.toString().trim() : '';

        // Kiểm tra xem mã sản phẩm đã tồn tại chưa (nếu có customId)
        if (trimmedCustomId) {
            const existingProduct = await new Promise((resolve, reject) => {
                db.get('SELECT custom_id FROM products WHERE custom_id = ?', [trimmedCustomId], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });

            if (existingProduct) {
                throw new Error('Mã sản phẩm đã tồn tại');
            }
        }

        // Chèn sản phẩm mới vào CSDL
        const result = await new Promise((resolve, reject) => {
            // Xây dựng query động dựa trên có customId hay không
            const query = trimmedCustomId
                ? 'INSERT INTO products (custom_id, name, description, price, category, brand, supplier_id) VALUES (?, ?, ?, ?, ?, ?, ?)'
                : 'INSERT INTO products (name, description, price, category, brand, supplier_id) VALUES (?, ?, ?, ?, ?, ?)';
            const params = trimmedCustomId
                ? [trimmedCustomId, name, description, price, category, brand, supplierId]
                : [name, description, price, category, brand, supplierId];

            db.run(query, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    // Trả về customId nếu có, ngược lại trả về lastID tự động
                    resolve({ id: trimmedCustomId || this.lastID });
                }
            });
        });
        return result;
    } catch (err) {
        throw err;
    }
};

// Hàm lấy danh sách sản phẩm với bộ lọc và phân trang
// Tham số:
// - search: Từ khóa tìm kiếm (trong tên, mã, mô tả, thương hiệu, tên NCC)
// - category: Lọc theo danh mục
// - brand: Lọc theo thương hiệu
// - supplier: Lọc theo ID nhà cung cấp
// - page: Trang hiện tại (mặc định 1)
// - limit: Số sản phẩm mỗi trang (mặc định 10)
// Trả về: Đối tượng chứa danh sách sản phẩm, tổng số, tổng trang, trang hiện tại
const getProducts = async (search = '', category = '', brand = '', supplier = '', page = 1, limit = 10) => {
    try {
        // Tính offset cho phân trang
        const offset = (page - 1) * limit;

        // Xây dựng mệnh đề WHERE động dựa trên các bộ lọc
        let whereClause = '';
        const whereParams = [];

        if (search || category || brand || supplier) {
            const conditions = [];

            if (search) {
                // Tìm kiếm trong nhiều trường với LIKE
                conditions.push('(p.name LIKE ? OR p.custom_id LIKE ? OR p.description LIKE ? OR p.brand LIKE ? OR s.name LIKE ?)');
                whereParams.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
            }

            if (category) {
                conditions.push('category = ?');
                whereParams.push(category);
            }

            if (brand) {
                conditions.push('brand = ?');
                whereParams.push(brand);
            }

            if (supplier) {
                conditions.push('supplier_id = ?');
                whereParams.push(supplier);
            }

            whereClause = ' WHERE ' + conditions.join(' AND ');
        }

        // Lấy tổng số sản phẩm phù hợp với bộ lọc
        const totalCount = await new Promise((resolve, reject) => {
            let countSql = `SELECT COUNT(DISTINCT p.custom_id) as count
                            FROM products p
                            LEFT JOIN suppliers s ON p.supplier_id = s.id`;
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

        // Lấy danh sách sản phẩm với phân trang
        const products = await new Promise((resolve, reject) => {
            // Query JOIN để lấy thông tin sản phẩm, nhà cung cấp và tổng tồn kho
            let sql = `SELECT p.custom_id as id, p.custom_id, p.name, p.description, p.price, p.category, p.brand, p.supplier_id, p.created_at, s.name as supplier_name, COALESCE(SUM(i.quantity), 0) as quantity
                       FROM products p
                       LEFT JOIN suppliers s ON p.supplier_id = s.id
                       LEFT JOIN inventory i ON p.custom_id = i.product_id`;
            if (whereClause) {
                sql += whereClause;
            }
            // Nhóm theo các trường và sắp xếp theo ngày tạo giảm dần
            sql += ' GROUP BY p.custom_id, p.name, p.description, p.price, p.category, p.brand, p.supplier_id, p.created_at, s.name ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
            const params = [...whereParams, limit, offset];

            db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        // Trả về kết quả phân trang
        return {
            products,
            totalCount,
            totalPages,
            currentPage: page
        };
    } catch (err) {
        throw err;
    }
};

// Hàm lấy thông tin chi tiết của một sản phẩm theo ID
// Tham số: id - Mã sản phẩm (custom_id)
// Trả về: Đối tượng sản phẩm với tổng tồn kho hoặc null nếu không tìm thấy
const getProductById = async (id) => {
    try {
        return await new Promise((resolve, reject) => {
            // Query lấy thông tin sản phẩm và tổng tồn kho từ tất cả kho
            db.get(`SELECT p.custom_id as id, p.custom_id, p.name, p.description, p.price, p.category, p.brand, p.supplier_id, p.created_at, COALESCE(SUM(i.quantity), 0) as quantity
                    FROM products p
                    LEFT JOIN inventory i ON p.custom_id = i.product_id
                    WHERE p.custom_id = ?
                    GROUP BY p.custom_id, p.name, p.description, p.price, p.category, p.brand, p.supplier_id, p.created_at`, [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    } catch (err) {
        throw err;
    }
};

// Hàm cập nhật thông tin sản phẩm
// Tham số: id - Mã sản phẩm hiện tại, updates - Đối tượng chứa các trường cần cập nhật
// Trả về: Đối tượng sản phẩm sau khi cập nhật
const updateProduct = async (id, updates) => {
    try {
        const { name, description, price, category, brand, supplierId, customId } = updates;
        
        // Xử lý customId để loại bỏ khoảng trắng thừa
        let processedCustomId = customId;
        if (customId !== undefined) {
            processedCustomId = customId === null ? null : customId.toString().trim();
            // Nếu sau khi trim mà rỗng thì đặt thành null
            if (processedCustomId === '') {
                processedCustomId = null;
            }
        }
        
        // Kiểm tra mã sản phẩm đã tồn tại chưa (nếu đang cập nhật mã)
        if (processedCustomId && processedCustomId !== id) {
            const existingProduct = await new Promise((resolve, reject) => {
                db.get('SELECT custom_id FROM products WHERE custom_id = ?', [processedCustomId], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });
            
            if (existingProduct) {
                throw new Error('Mã sản phẩm đã tồn tại');
            }
        }
        
        const setClause = [];
        const values = [];
        if (name !== undefined) {
            setClause.push('name = ?');
            values.push(name);
        }
        if (description !== undefined) {
            setClause.push('description = ?');
            values.push(description);
        }
        if (price !== undefined) {
            setClause.push('price = ?');
            values.push(price);
        }
        if (category !== undefined) {
            setClause.push('category = ?');
            values.push(category);
        }
        if (brand !== undefined) {
            setClause.push('brand = ?');
            values.push(brand);
        }
        if (supplierId !== undefined) {
            setClause.push('supplier_id = ?');
            values.push(supplierId);
        }
        if (processedCustomId !== undefined && processedCustomId !== id) {
            setClause.push('custom_id = ?');
            values.push(processedCustomId);
        }
        if (setClause.length === 0) {
            throw new Error('No updates provided');
        }
        values.push(id);
        await new Promise((resolve, reject) => {
            db.run(`UPDATE products SET ${setClause.join(', ')} WHERE custom_id = ?`, values, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        return await getProductById(processedCustomId || id);
    } catch (err) {
        throw err;
    }
};

// Hàm xóa sản phẩm và các bản ghi tồn kho liên quan
// Tham số: id - Mã sản phẩm cần xóa
// Trả về: Thông báo xóa thành công
const deleteProduct = async (id) => {
    try {
        // First check if product exists
        const product = await getProductById(id);
        if (!product) {
            throw new Error('Product not found');
        }
        
        // Delete related inventory records first
        await new Promise((resolve, reject) => {
            db.run('DELETE FROM inventory WHERE product_id = ?', [id], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        
        // Then delete the product
        await new Promise((resolve, reject) => {
            db.run('DELETE FROM products WHERE custom_id = ?', [id], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        return { message: 'Product deleted successfully' };
    } catch (err) {
        throw err;
    }
};

// Hàm lấy tổng số sản phẩm trong hệ thống
// Trả về: Số lượng sản phẩm
const getProductsCount = async () => {
    try {
        return await new Promise((resolve, reject) => {
            db.get('SELECT COUNT(*) as count FROM products', (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        });
    } catch (err) {
        throw err;
    }
};

// Hàm lấy danh sách các thương hiệu duy nhất từ sản phẩm
// Trả về: Mảng các thương hiệu, sắp xếp theo thứ tự alphabet
const getUniqueBrands = async () => {
    try {
        return await new Promise((resolve, reject) => {
            db.all('SELECT DISTINCT brand FROM products WHERE brand IS NOT NULL AND brand != "" ORDER BY brand', (err, rows) => {
                if (err) reject(err);
                else resolve(rows.map(row => row.brand));
            });
        });
    } catch (err) {
        throw err;
    }
};

// Xuất các hàm để sử dụng trong các module khác
module.exports = {
    createProduct, // Tạo sản phẩm mới
    getProducts, // Lấy danh sách sản phẩm với bộ lọc và phân trang
    getProductById, // Lấy sản phẩm theo ID
    updateProduct, // Cập nhật sản phẩm
    deleteProduct, // Xóa sản phẩm
    getProductsCount, // Đếm tổng số sản phẩm
    getUniqueBrands // Lấy danh sách thương hiệu duy nhất
};
