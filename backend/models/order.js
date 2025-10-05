// models/order.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

const db = new sqlite3.Database(path.join(__dirname, '../database.db'), (err) => {
    if (err) {
        console.error('Could not connect to database:', err.message);
    }
});

const createOrder = async (userId, supplierId, totalAmount, status = 'pending') => {
    try {
        const result = await new Promise((resolve, reject) => {
            db.run('INSERT INTO orders (user_id, supplier_id, total_amount, status) VALUES (?, ?, ?, ?)', [userId, supplierId, totalAmount, status], function(err) {
                if (err) reject(err);
                else resolve({ id: this.lastID });
            });
        });
        return result;
    } catch (err) {
        throw err;
    }
};

const getOrderById = async (id) => {
    try {
        return await new Promise((resolve, reject) => {
            db.get('SELECT * FROM orders WHERE id = ?', [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    } catch (err) {
        throw err;
    }
};

const getAllOrders = async () => {
    try {
        return await new Promise((resolve, reject) => {
            const sql = `
                SELECT 
                    o.id, 
                    o.created_at, 
                    u.username as created_by, 
                    s.name as supplier_name, 
                    o.total_amount, 
                    o.status,
                    (SELECT COUNT(oi.id) FROM order_items oi WHERE oi.order_id = o.id) as product_count
                FROM orders o
                JOIN users u ON o.user_id = u.id
                LEFT JOIN suppliers s ON o.supplier_id = s.id
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

const getOrdersByUserId = async (userId) => {
    try {
        return await new Promise((resolve, reject) => {
            db.all('SELECT * FROM orders WHERE user_id = ?', [userId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    } catch (err) {
        throw err;
    }
};

const updateOrderStatus = async (id, status) => {
    try {
        await new Promise((resolve, reject) => {
            db.run('UPDATE orders SET status = ? WHERE id = ?', [status, id], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        return getOrderById(id);
    } catch (err) {
        throw err;
    }
};

const deleteOrder = async (id) => {
    try {
        await new Promise((resolve, reject) => {
            db.run('DELETE FROM orders WHERE id = ?', [id], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        return { message: 'Order deleted successfully' };
    } catch (err) {
        throw err;
    }
};

module.exports = {
    createOrder,
    getOrderById,
    getAllOrders,
    getOrdersByUserId,
    updateOrderStatus,
    deleteOrder
};