// models/inventory.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dotenv = require('dotenv');
const warehouseModel = require('./warehouse');
dotenv.config();

const db = new sqlite3.Database(path.join(__dirname, '../database.db'), (err) => {
    if (err) {
        console.error('Could not connect to database:', err.message);
    }
});

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

const updateInventoryQuantity = async (productId, quantityChange, warehouseId) => {
    try {
        const current = await getInventoryByProductId(productId, warehouseId);
        if (!current) {
            // Nếu sản phẩm chưa có trong kho, thêm mới với số lượng bằng quantityChange
            await new Promise((resolve, reject) => {
                db.run('INSERT INTO inventory (product_id, warehouse_id, quantity) VALUES (?, ?, ?)', [productId, warehouseId, Math.max(0, quantityChange)], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            // Update warehouse current usage
            await warehouseModel.updateCurrentUsage(warehouseId);
            return { product_id: productId, warehouse_id: warehouseId, quantity: Math.max(0, quantityChange) };
        }
        
        const newQuantity = current.quantity + quantityChange;
        // Đảm bảo số lượng không âm
        const finalQuantity = Math.max(0, newQuantity);
        
        await new Promise((resolve, reject) => {
            db.run('UPDATE inventory SET quantity = ? WHERE product_id = ? AND warehouse_id = ?', [finalQuantity, productId, warehouseId], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        // Update warehouse current usage
        await warehouseModel.updateCurrentUsage(warehouseId);
        return { product_id: productId, warehouse_id: warehouseId, quantity: finalQuantity };
    } catch (err) {
        throw err;
    }
};

const addInventoryItem = async (productId, quantity, warehouseId) => {
    try {
        const current = await getInventoryByProductId(productId, warehouseId);
        if (current) {
            // Nếu sản phẩm đã tồn tại, cộng thêm số lượng
            return updateInventoryQuantity(productId, quantity, warehouseId);
        } else {
            // Nếu sản phẩm chưa tồn tại, thêm mới với số lượng
            await new Promise((resolve, reject) => {
                db.run('INSERT INTO inventory (product_id, warehouse_id, quantity) VALUES (?, ?, ?)', [productId, warehouseId, Math.max(0, quantity)], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            // Update warehouse current usage
            await warehouseModel.updateCurrentUsage(warehouseId);
            return { product_id: productId, warehouse_id: warehouseId, quantity: Math.max(0, quantity) };
        }
    } catch (err) {
        throw err;
    }
};

const getAllInventory = async () => {
    try {
        return await new Promise((resolve, reject) => {
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

module.exports = {
    getInventoryByProductId,
    updateInventoryQuantity,
    addInventoryItem,
    getAllInventory
};