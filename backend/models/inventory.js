// Module quản lý tồn kho - models/inventory.js
// Module này xử lý các thao tác liên quan đến tồn kho sản phẩm trong các kho khác nhau.
// Bao gồm việc cập nhật số lượng, thêm sản phẩm mới vào kho và truy vấn tồn kho.

const sqlite3 = require('sqlite3').verbose(); // Thư viện SQLite3 để quản lý CSDL
const path = require('path'); // Xử lý đường dẫn file
const dotenv = require('dotenv'); // Tải biến môi trường
const warehouseModel = require('./warehouse'); // Import model kho để cập nhật sử dụng kho
dotenv.config(); // Khởi tạo biến môi trường

// Kết nối CSDL SQLite
const db = new sqlite3.Database(path.join(__dirname, '../database.db'), (err) => {
    if (err) {
        console.error('Could not connect to database:', err.message);
    }
});

// Hàm lấy thông tin tồn kho của một sản phẩm trong một kho cụ thể
// Tham số: productId - ID sản phẩm, warehouseId - ID kho
// Trả về: Đối tượng tồn kho hoặc null nếu không tìm thấy
const getInventoryByProductId = async (productId, warehouseId) => {
    try {
        return await new Promise((resolve, reject) => {
            db.get('SELECT * FROM inventory WHERE product_id = ? AND warehouse_id = ?', [productId, warehouseId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    } catch (err) {
        throw err;
    }
};

// Hàm cập nhật số lượng tồn kho của sản phẩm
// Tham số: productId - ID sản phẩm, quantityChange - thay đổi số lượng (có thể âm), warehouseId - ID kho
// Trả về: Đối tượng chứa thông tin tồn kho sau khi cập nhật
const updateInventoryQuantity = async (productId, quantityChange, warehouseId) => {
    try {
        // Lấy thông tin tồn kho hiện tại
        const current = await getInventoryByProductId(productId, warehouseId);
        if (!current) {
            // Nếu sản phẩm chưa có trong kho, thêm mới với số lượng bằng quantityChange (đảm bảo không âm)
            await new Promise((resolve, reject) => {
                db.run('INSERT INTO inventory (product_id, warehouse_id, quantity) VALUES (?, ?, ?)', [productId, warehouseId, Math.max(0, quantityChange)], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            // Cập nhật mức sử dụng hiện tại của kho
            await warehouseModel.updateCurrentUsage(warehouseId);
            return { product_id: productId, warehouse_id: warehouseId, quantity: Math.max(0, quantityChange) };
        }

        // Tính số lượng mới
        const newQuantity = current.quantity + quantityChange;
        // Đảm bảo số lượng không âm (không cho phép tồn kho âm)
        const finalQuantity = Math.max(0, newQuantity);

        // Cập nhật số lượng trong CSDL
        await new Promise((resolve, reject) => {
            db.run('UPDATE inventory SET quantity = ? WHERE product_id = ? AND warehouse_id = ?', [finalQuantity, productId, warehouseId], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        // Cập nhật mức sử dụng hiện tại của kho
        await warehouseModel.updateCurrentUsage(warehouseId);
        return { product_id: productId, warehouse_id: warehouseId, quantity: finalQuantity };
    } catch (err) {
        throw err;
    }
};

// Hàm thêm sản phẩm vào tồn kho (tăng số lượng)
// Tham số: productId - ID sản phẩm, quantity - số lượng thêm vào, warehouseId - ID kho
// Trả về: Đối tượng chứa thông tin tồn kho sau khi thêm
const addInventoryItem = async (productId, quantity, warehouseId) => {
    try {
        // Kiểm tra xem sản phẩm đã có trong kho chưa
        const current = await getInventoryByProductId(productId, warehouseId);
        if (current) {
            // Nếu đã tồn tại, cộng thêm số lượng
            return updateInventoryQuantity(productId, quantity, warehouseId);
        } else {
            // Nếu chưa tồn tại, thêm mới với số lượng được chỉ định (đảm bảo không âm)
            await new Promise((resolve, reject) => {
                db.run('INSERT INTO inventory (product_id, warehouse_id, quantity) VALUES (?, ?, ?)', [productId, warehouseId, Math.max(0, quantity)], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            // Cập nhật mức sử dụng hiện tại của kho
            await warehouseModel.updateCurrentUsage(warehouseId);
            return { product_id: productId, warehouse_id: warehouseId, quantity: Math.max(0, quantity) };
        }
    } catch (err) {
        throw err;
    }
};

// Hàm lấy tất cả thông tin tồn kho từ tất cả các kho
// Trả về: Mảng các đối tượng chứa ID tồn kho, ID sản phẩm, tên sản phẩm, mô tả, số lượng
const getAllInventory = async () => {
    try {
        return await new Promise((resolve, reject) => {
            // Truy vấn JOIN để lấy thông tin sản phẩm cùng với tồn kho
            db.all(`
                SELECT inventory.id, inventory.product_id, products.name, products.description, inventory.quantity
                FROM inventory
                JOIN products ON inventory.product_id = products.custom_id
            `, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    } catch (err) {
        throw err;
    }
};

// Xuất các hàm để sử dụng trong các module khác
module.exports = {
    getInventoryByProductId, // Lấy tồn kho theo sản phẩm và kho
    updateInventoryQuantity, // Cập nhật số lượng tồn kho
    addInventoryItem, // Thêm sản phẩm vào tồn kho
    getAllInventory // Lấy tất cả tồn kho
};