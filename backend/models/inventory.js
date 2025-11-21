// models/inventory.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

const db = new sqlite3.Database(path.join(__dirname, '../database.db'), (err) => {
    if (err) {
        console.error('Could not connect to database:', err.message);
    }
});

const getInventoryByProductId = async (productId, warehouseCustomId = 'WH001') => {
    try {
        return await new Promise((resolve, reject) => {
            db.get('SELECT * FROM inventory WHERE product_id = ? AND warehouse_id = ?', [productId, warehouseCustomId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    } catch (err) {
        throw err;
    }
};

const updateInventoryQuantity = async (productId, quantityChange, warehouseCustomId = 'WH001') => {
    try {
        const current = await getInventoryByProductId(productId, warehouseCustomId);
        if (!current) {
            await new Promise((resolve, reject) => {
                db.run('INSERT INTO inventory (product_id, warehouse_id, quantity) VALUES (?, ?, ?)', [productId, warehouseCustomId, quantityChange], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            return { product_id: productId, warehouse_id: warehouseCustomId, quantity: quantityChange };
        }
        const newQuantity = current.quantity + quantityChange;
        await new Promise((resolve, reject) => {
            db.run('UPDATE inventory SET quantity = ? WHERE product_id = ? AND warehouse_id = ?', [newQuantity, productId, warehouseCustomId], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        return { product_id: productId, warehouse_id: warehouseCustomId, quantity: newQuantity };
    } catch (err) {
        throw err;
    }
};

const addInventoryItem = async (productId, quantity, warehouseCustomId = 'WH001') => {
    try {
        const current = await getInventoryByProductId(productId, warehouseCustomId);
        if (current) {
            return updateInventoryQuantity(productId, quantity, warehouseCustomId);
        } else {
            await new Promise((resolve, reject) => {
                db.run('INSERT INTO inventory (product_id, warehouse_id, quantity) VALUES (?, ?, ?)', [productId, warehouseCustomId, quantity], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            return { product_id: productId, warehouse_id: warehouseCustomId, quantity };
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