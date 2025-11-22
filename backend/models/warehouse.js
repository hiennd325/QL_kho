const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

const db = new sqlite3.Database(path.join(__dirname, '../database.db'), (err) => {
    if (err) {
        console.error('Could not connect to database:', err.message);
    }
});

const createWarehouse = async (name, location, capacity, custom_id = null) => {
    try {
        // Ensure location is not null to satisfy schema constraints. If the UI omits location,
        // default to an empty string.
        const safeLocation = location || '';
        const safeCapacity = capacity !== undefined && capacity !== null ? capacity : 0;
        
        // Validate that custom_id is provided
        if (!custom_id) {
            throw new Error('custom_id is required');
        }
        
        // Check if warehouse with this custom_id already exists
        const existingWarehouse = await getWarehouseById(custom_id);
        if (existingWarehouse) {
            throw new Error('Mã kho đã tồn tại');
        }
        
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

module.exports = {
    createWarehouse,
    getWarehouses,
    getWarehouseById,
    updateWarehouse,
    getWarehouseProducts,
    deleteWarehouse,
    getWarehousesCount
};