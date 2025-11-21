const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

const db = new sqlite3.Database(path.join(__dirname, '../database.db'), (err) => {
    if (err) {
        console.error('Could not connect to database:', err.message);
    }
});

const createTransaction = async (reference_id, productId, warehouseId, quantity, type, supplier_id = null, customer_name = null, notes = null) => {
    try {
        // Kiểm tra nếu reference_id đã tồn tại
        const existingTransaction = await getTransactionByReferenceId(reference_id);
        if (existingTransaction) {
            throw new Error('Mã giao dịch đã tồn tại');
        }
        
        const result = await new Promise((resolve, reject) => {
            db.run('INSERT INTO inventory_transactions (reference_id, product_id, warehouse_id, quantity, type, supplier_id, customer_name, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', 
            [reference_id, productId, warehouseId, quantity, type, supplier_id, customer_name, notes], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ reference_id: reference_id });
                }
            });
        });
        return result;
    } catch (err) {
        throw err;
    }
};

const getTransactions = async (productId = null, warehouseId = null) => {
    try {
        let query = `SELECT it.reference_id, it.product_id, it.warehouse_id, it.quantity, it.type, it.transaction_date, p.name as product_name, w.name as warehouse_name
        FROM inventory_transactions it
        JOIN products p ON it.product_id = p.id
        JOIN warehouses w ON it.warehouse_id = w.id`;
        
        let params = [];
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
                else resolve(rows);
            });
        });
    } catch (err) {
        throw err;
    }
};

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

const getTransactionsPaginated = async (page = 1, limit = 10, type = null, warehouseId = null, startDate = null, endDate = null) => {
    try {
        const offset = (page - 1) * limit;

        // Build WHERE clause dynamically
        let whereClause = '';
        const whereParams = [];

        if (type || warehouseId || startDate || endDate) {
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

            whereClause = ' WHERE ' + conditions.join(' AND ');
        }

        // Get total count
        const totalCount = await new Promise((resolve, reject) => {
            let countSql = 'SELECT COUNT(*) as count FROM inventory_transactions it';
            if (whereClause) {
                countSql += whereClause;
            }
            db.get(countSql, whereParams, (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        });

        // Calculate total pages
        const totalPages = Math.ceil(totalCount / limit);

        // Get transactions with pagination
        const transactions = await new Promise((resolve, reject) => {
            let sql = `SELECT it.reference_id, it.product_id, it.warehouse_id, it.quantity, it.type, it.transaction_date,
                              p.name as product_name, w.name as warehouse_name
                       FROM inventory_transactions it
                       JOIN products p ON it.product_id = p.id
                       JOIN warehouses w ON it.warehouse_id = w.id`;
            if (whereClause) {
                sql += whereClause;
            }
            sql += ' ORDER BY it.transaction_date DESC LIMIT ? OFFSET ?';
            const params = [...whereParams, limit, offset];

            db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

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

module.exports = {
    createTransaction,
    getTransactions,
    getTransactionById,
    getTransactionByReferenceId,
    getTransactionsPaginated
};