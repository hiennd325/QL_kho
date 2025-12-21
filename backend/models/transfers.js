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

const createTransfer = async (transferData) => {
    try {
        const { from_warehouse_id, to_warehouse_id, items, user_id, notes } = transferData;
        const code = `DC${Date.now()}`;

        return await new Promise((resolve, reject) => {
            db.serialize(() => {
                db.run('BEGIN TRANSACTION');

                db.run(`INSERT INTO transfers (code, from_warehouse_id, to_warehouse_id, status, user_id, notes)
                        VALUES (?, ?, ?, 'pending', ?, ?)`,
                    [code, from_warehouse_id, to_warehouse_id, user_id, notes],
                    function(err) {
                        if (err) {
                            db.run('ROLLBACK');
                            return reject(err);
                        }
                        
                        const transferId = this.lastID;
                        const itemStmt = db.prepare(`INSERT INTO transfer_items (transfer_id, product_id, quantity) VALUES (?, ?, ?)`);
                        
                        items.forEach(item => {
                            itemStmt.run(transferId, item.product_id, item.quantity, (err) => {
                                if (err) {
                                    db.run('ROLLBACK');
                                    return reject(err);
                                }
                            });
                        });

                        itemStmt.finalize((err) => {
                            if (err) {
                                db.run('ROLLBACK');
                                return reject(err);
                            }
                            db.run('COMMIT', (err) => {
                                if (err) reject(err);
                                else resolve({ id: transferId, code });
                            });
                        });
                    }
                );
            });
        });
    } catch (err) {
        throw err;
    }
};

const getTransfers = async (limit = 10) => {
    try {
        const query = `SELECT t.id, t.code, t.status, t.created_at, t.updated_at,
                              fw.name as from_warehouse_name, tw.name as to_warehouse_name,
                              u.username as user_name,
                              (SELECT COUNT(*) FROM transfer_items WHERE transfer_id = t.id) as item_count,
                              (SELECT GROUP_CONCAT(p.name, ', ') 
                               FROM transfer_items ti 
                               JOIN products p ON ti.product_id = p.custom_id 
                               WHERE ti.transfer_id = t.id) as product_names
                       FROM transfers t
                       JOIN warehouses fw ON t.from_warehouse_id = fw.custom_id
                       JOIN warehouses tw ON t.to_warehouse_id = tw.custom_id
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
        const transferQuery = `SELECT t.*, fw.name as from_warehouse_name, tw.name as to_warehouse_name,
                                      u.username as user_name
                               FROM transfers t
                               JOIN warehouses fw ON t.from_warehouse_id = fw.custom_id
                               JOIN warehouses tw ON t.to_warehouse_id = tw.custom_id
                               JOIN users u ON t.user_id = u.id
                               WHERE t.id = ?`;

        const itemsQuery = `SELECT ti.*, p.name as product_name
                            FROM transfer_items ti
                            JOIN products p ON ti.product_id = p.custom_id
                            WHERE ti.transfer_id = ?`;

        const transfer = await new Promise((resolve, reject) => {
            db.get(transferQuery, [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (!transfer) return null;

        const items = await new Promise((resolve, reject) => {
            db.all(itemsQuery, [id], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        transfer.items = items;
        return transfer;
    } catch (err) {
        throw err;
    }
};

const updateTransferStatus = async (id, status) => {
    try {
        // First get the transfer details with items
        const transfer = await getTransferById(id);
        if (!transfer) throw new Error('Transfer not found');

        // If status is completed, check capacity before updating inventory
        if (status === 'completed') {
            // Get to_warehouse capacity and current usage
            const toWarehouse = await new Promise((resolve, reject) => {
                db.get('SELECT capacity, current_usage FROM warehouses WHERE custom_id = ?', [transfer.to_warehouse_id], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });

            if (!toWarehouse) throw new Error('Destination warehouse not found');

            // Calculate total quantity to be added
            let totalTransferQuantity = 0;
            for (const item of transfer.items) {
                totalTransferQuantity += item.quantity;
            }

            // Check if transfer would exceed capacity
            if (toWarehouse.current_usage + totalTransferQuantity > toWarehouse.capacity) {
                throw new Error(`Cannot complete transfer. Destination warehouse capacity exceeded. Current usage: ${toWarehouse.current_usage}, Capacity: ${toWarehouse.capacity}, Trying to add: ${totalTransferQuantity}`);
            }
        }

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

        // If status is completed, update inventory for ALL items
        if (status === 'completed') {
            for (const item of transfer.items) {
                // Reduce inventory in from_warehouse
                await updateInventoryForTransfer(item.product_id, transfer.from_warehouse_id, -item.quantity);
                // Increase inventory in to_warehouse
                await updateInventoryForTransfer(item.product_id, transfer.to_warehouse_id, item.quantity);
            }

            // Update current_usage for both warehouses after all inventory updates
            await warehouseModel.updateCurrentUsage(transfer.from_warehouse_id);
            await warehouseModel.updateCurrentUsage(transfer.to_warehouse_id);
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