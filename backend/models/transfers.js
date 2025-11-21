const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

const db = new sqlite3.Database(path.join(__dirname, '../database.db'), (err) => {
    if (err) {
        console.error('Could not connect to database:', err.message);
    }
});

const createTransfer = async (transferData) => {
    try {
        const { from_warehouse_id, to_warehouse_id, product_id, quantity, user_id, notes } = transferData;
        const code = `DC${Date.now()}`;

        const result = await new Promise((resolve, reject) => {
            db.run(`INSERT INTO transfers (code, from_warehouse_id, to_warehouse_id, product_id, quantity, status, user_id, notes)
                    VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)`,
                [code, from_warehouse_id, to_warehouse_id, product_id, quantity, user_id, notes],
                function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ id: this.lastID, code });
                    }
                });
        });
        return result;
    } catch (err) {
        throw err;
    }
};

const getTransfers = async (limit = 10) => {
    try {
        const query = `SELECT t.id, t.code, t.quantity, t.status, t.created_at, t.updated_at,
                              fw.name as from_warehouse_name, tw.name as to_warehouse_name,
                              p.name as product_name, u.username as user_name
                       FROM transfers t
                       JOIN warehouses fw ON t.from_warehouse_id = fw.custom_id
                       JOIN warehouses tw ON t.to_warehouse_id = tw.custom_id
                       JOIN products p ON t.product_id = p.id
                       JOIN users u ON t.user_id = u.id
                       ORDER BY t.created_at DESC
                       LIMIT ?`;

        return await new Promise((resolve, reject) => {
            db.all(query, [limit], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    } catch (err) {
        throw err;
    }
};

const getTransferById = async (id) => {
    try {
        const query = `SELECT t.*, fw.name as from_warehouse_name, tw.name as to_warehouse_name,
                              p.name as product_name, u.username as user_name
                       FROM transfers t
                       JOIN warehouses fw ON t.from_warehouse_id = fw.custom_id
                       JOIN warehouses tw ON t.to_warehouse_id = tw.custom_id
                       JOIN products p ON t.product_id = p.id
                       JOIN users u ON t.user_id = u.id
                       WHERE t.id = ?`;

        return await new Promise((resolve, reject) => {
            db.get(query, [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    } catch (err) {
        throw err;
    }
};

const updateTransferStatus = async (id, status) => {
    try {
        // First get the transfer details
        const transfer = await getTransferById(id);
        
        // Update the transfer status
        const result = await new Promise((resolve, reject) => {
            db.run('UPDATE transfers SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [status, id], function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ changes: this.changes });
                    }
                });
        });
        
        // If status is completed, update inventory
        if (status === 'completed' && transfer) {
            // Reduce inventory in from_warehouse
            await updateInventoryForTransfer(transfer.product_id, transfer.from_warehouse_id, -transfer.quantity);
            // Increase inventory in to_warehouse
            await updateInventoryForTransfer(transfer.product_id, transfer.to_warehouse_id, transfer.quantity);
        }
        
        return result;
    } catch (err) {
        throw err;
    }
};

// Helper function to update inventory for a transfer
const updateInventoryForTransfer = async (productId, warehouseCustomId, quantityChange) => {
    try {
        // Check if inventory record exists
        const inventoryRecord = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM inventory WHERE product_id = ? AND warehouse_id = ?', 
                [productId, warehouseCustomId], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
        });
        
        if (inventoryRecord) {
            // Update existing record
            const newQuantity = inventoryRecord.quantity + quantityChange;
            if (newQuantity < 0) {
                throw new Error('Insufficient inventory');
            }
            
            await new Promise((resolve, reject) => {
                db.run('UPDATE inventory SET quantity = ? WHERE product_id = ? AND warehouse_id = ?', 
                    [newQuantity, productId, warehouseCustomId], (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
            });
        } else {
            // Create new record
            if (quantityChange < 0) {
                throw new Error('Insufficient inventory');
            }
            
            await new Promise((resolve, reject) => {
                db.run('INSERT INTO inventory (product_id, warehouse_id, quantity) VALUES (?, ?, ?)', 
                    [productId, warehouseCustomId, quantityChange], (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
            });
        }
        
        // Add transaction record
        await new Promise((resolve, reject) => {
            db.run('INSERT INTO inventory_transactions (product_id, warehouse_id, quantity, type) VALUES (?, ?, ?, ?)',
                [productId, warehouseCustomId, Math.abs(quantityChange), quantityChange > 0 ? 'nhap' : 'xuat'],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                });
        });
    } catch (err) {
        throw err;
    }
};

const deleteTransfer = async (id) => {
    try {
        const result = await new Promise((resolve, reject) => {
            db.run('DELETE FROM transfers WHERE id = ?', [id], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ changes: this.changes });
                }
            });
        });
        return result;
    } catch (err) {
        throw err;
    }
};

module.exports = {
    createTransfer,
    getTransfers,
    getTransferById,
    updateTransferStatus,
    deleteTransfer
};