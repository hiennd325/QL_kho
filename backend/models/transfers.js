// Module quản lý chuyển kho - models/transfers.js
// Module này xử lý việc tạo, quản lý và cập nhật trạng thái các phiếu chuyển kho
// giữa các kho khác nhau, bao gồm kiểm tra tồn kho và cập nhật số lượng.

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

// Hàm tạo phiếu chuyển kho mới
// Tham số: transferData - Đối tượng chứa from_warehouse_id, to_warehouse_id, items (mảng sản phẩm), user_id, notes
// Trả về: Đối tượng chứa ID và mã code của phiếu chuyển kho
const createTransfer = async (transferData) => {
    try {
        const { from_warehouse_id, to_warehouse_id, items, user_id, notes } = transferData;
        // Tạo mã code duy nhất cho phiếu chuyển kho
        const code = `DC${Date.now()}`;

        return await new Promise((resolve, reject) => {
            // Sử dụng transaction để đảm bảo tính toàn vẹn dữ liệu
            db.serialize(() => {
                // Bắt đầu transaction
                db.run('BEGIN TRANSACTION');

                // Chèn thông tin phiếu chuyển kho
                db.run(`INSERT INTO transfers (code, from_warehouse_id, to_warehouse_id, status, user_id, notes)
                        VALUES (?, ?, ?, 'pending', ?, ?)`,
                    [code, from_warehouse_id, to_warehouse_id, user_id, notes],
                    function(err) {
                        if (err) {
                            db.run('ROLLBACK'); // Rollback nếu có lỗi
                            return reject(err);
                        }

                        const transferId = this.lastID;
                        // Chuẩn bị statement để chèn các item
                        const itemStmt = db.prepare(`INSERT INTO transfer_items (transfer_id, product_id, quantity) VALUES (?, ?, ?)`);

                        // Chèn từng item trong phiếu chuyển kho
                        items.forEach(item => {
                            itemStmt.run(transferId, item.product_id, item.quantity, (err) => {
                                if (err) {
                                    db.run('ROLLBACK');
                                    return reject(err);
                                }
                            });
                        });

                        // Hoàn tất statement
                        itemStmt.finalize((err) => {
                            if (err) {
                                db.run('ROLLBACK');
                                return reject(err);
                            }
                            // Commit transaction
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

// Hàm lấy danh sách phiếu chuyển kho với giới hạn
// Tham số: limit - Số lượng phiếu cần lấy (mặc định 10)
// Trả về: Mảng phiếu chuyển kho với thông tin chi tiết
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

// Hàm lấy thông tin chi tiết phiếu chuyển kho theo ID
// Tham số: id - ID phiếu chuyển kho
// Trả về: Đối tượng phiếu chuyển kho với danh sách items hoặc null
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

// Hàm cập nhật trạng thái phiếu chuyển kho
// Khi hoàn thành, sẽ cập nhật tồn kho và kiểm tra dung lượng kho đích
// Tham số: id - ID phiếu chuyển kho, status - Trạng thái mới
// Trả về: Kết quả cập nhật
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

// Hàm hỗ trợ cập nhật tồn kho cho việc chuyển kho
// Tham số: productId - ID sản phẩm, warehouseCustomId - ID kho, quantityChange - Thay đổi số lượng
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

// Hàm xóa phiếu chuyển kho
// Tham số: id - ID phiếu chuyển kho cần xóa
// Trả về: Kết quả xóa
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

// Xuất các hàm để sử dụng trong các module khác
module.exports = {
    createTransfer, // Tạo phiếu chuyển kho mới
    getTransfers, // Lấy danh sách phiếu chuyển kho
    getTransferById, // Lấy phiếu chuyển kho theo ID
    updateTransferStatus, // Cập nhật trạng thái phiếu
    deleteTransfer // Xóa phiếu chuyển kho
};