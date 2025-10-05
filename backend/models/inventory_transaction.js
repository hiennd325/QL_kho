const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

const db = new sqlite3.Database(path.join(__dirname, '../database.db'), (err) => {
    if (err) {
        console.error('Could not connect to database:', err.message);
    }
});

const createTransaction = async (productId, warehouseId, quantity, type) => {
    try {
        const result = await new Promise((resolve, reject) => {
            db.run('INSERT INTO inventory_transactions (product_id, warehouse_id, quantity, type) VALUES (?, ?, ?, ?)', [productId, warehouseId, quantity, type], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID });
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
        let query = `SELECT it.id, it.product_id, it.warehouse_id, it.quantity, it.type, it.transaction_date, p.name as product_name, w.name as warehouse_name
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

const getTransactionById = async (id) => {
    try {
        return await new Promise((resolve, reject) => {
            db.get('SELECT * FROM inventory_transactions WHERE id = ?', [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    } catch (err) {
        throw err;
    }
};

module.exports = {
    createTransaction,
    getTransactions,
    getTransactionById
};