// models/sales_order.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

const db = new sqlite3.Database(path.join(__dirname, '../database.db'), (err) => {
    if (err) {
        console.error('Could not connect to database:', err.message);
    }
});

const createSalesOrder = async (userId, customerName, phone, email, address, totalAmount, status = 'pending') => {
    try {
        const result = await new Promise((resolve, reject) => {
            db.run('INSERT INTO sales_orders (user_id, customer_name, phone, email, address, total_amount, status) VALUES (?, ?, ?, ?, ?, ?, ?)', [userId, customerName, phone, email, address, totalAmount, status], function(err) {
                if (err) reject(err);
                else resolve({ id: this.lastID });
            });
        });
        return result;
    } catch (err) {
        throw err;
    }
};

const getSalesOrderById = async (id) => {
    try {
        return await new Promise((resolve, reject) => {
            db.get('SELECT * FROM sales_orders WHERE id = ?', [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    } catch (err) {
        throw err;
    }
};

const getAllSalesOrders = async () => {
    try {
        return await new Promise((resolve, reject) => {
            const sql = `
                SELECT 
                    so.id, 
                    so.created_at, 
                    u.username as created_by, 
                    so.customer_name,
                    so.total_amount, 
                    so.status,
                    (SELECT COUNT(soi.id) FROM sales_order_items soi WHERE soi.sales_order_id = so.id) as product_count
                FROM sales_orders so
                JOIN users u ON so.user_id = u.id
            `;
            db.all(sql, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    } catch (err) {
        throw err;
    }
};

const updateSalesOrderStatus = async (id, status) => {
    try {
        await new Promise((resolve, reject) => {
            db.run('UPDATE sales_orders SET status = ? WHERE id = ?', [status, id], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        return getSalesOrderById(id);
    } catch (err) {
        throw err;
    }
};

const deleteSalesOrder = async (id) => {
    try {
        await new Promise((resolve, reject) => {
            db.run('DELETE FROM sales_orders WHERE id = ?', [id], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        return { message: 'Sales order deleted successfully' };
    } catch (err) {
        throw err;
    }
};

const getSalesOrderItems = async (salesOrderId) => {
    try {
        return await new Promise((resolve, reject) => {
            db.all(`
                SELECT soi.id, soi.product_id, soi.quantity, soi.price, p.name AS product_name
                FROM sales_order_items soi
                JOIN products p ON soi.product_id = p.id
                WHERE soi.sales_order_id = ?
            `, [salesOrderId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    } catch (err) {
        throw err;
    }
};

const createSalesOrderItem = async (salesOrderId, productId, quantity, price) => {
    try {
        return await new Promise((resolve, reject) => {
            db.run(
                'INSERT INTO sales_order_items (sales_order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
                [salesOrderId, productId, quantity, price],
                function(err) {
                    if (err) reject(err);
                    else resolve({ id: this.lastID });
                }
            );
        });
    } catch (err) {
        throw err;
    }
};

module.exports = {
    createSalesOrder,
    getSalesOrderById,
    getAllSalesOrders,
    updateSalesOrderStatus,
    deleteSalesOrder,
    getSalesOrderItems,
    createSalesOrderItem
};