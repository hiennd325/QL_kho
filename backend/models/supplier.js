const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

const db = new sqlite3.Database(path.join(__dirname, '../database.db'), (err) => {
    if (err) {
        console.error('Could not connect to database:', err.message);
    }
});

const createSupplier = async (name, contactPerson, phone, email, address) => {
    try {
        const result = await new Promise((resolve, reject) => {
            db.run('INSERT INTO suppliers (name, contact_person, phone, email, address) VALUES (?, ?, ?, ?, ?)', [name, contactPerson, phone, email, address], function(err) {
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

const getSuppliers = async (searchTerm) => {
    try {
        return await new Promise((resolve, reject) => {
            let sql = 'SELECT * FROM suppliers';
            const params = [];
            if (searchTerm) {
                sql += ' WHERE name LIKE ?';
                params.push(`%${searchTerm}%`);
            }
            db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    } catch (err) {
        throw err;
    }
};

const getSupplierById = async (id) => {
    try {
        return await new Promise((resolve, reject) => {
            db.get('SELECT * FROM suppliers WHERE id = ?', [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    } catch (err) {
        throw err;
    }
};

const updateSupplier = async (id, updates) => {
    try {
        const { name, contact_person, phone, email, address } = updates;
        const setClause = [];
        const values = [];
        if (name) {
            setClause.push('name = ?');
            values.push(name);
        }
        if (contact_person) {
            setClause.push('contact_person = ?');
            values.push(contact_person);
        }
        if (phone) {
            setClause.push('phone = ?');
            values.push(phone);
        }
        if (email) {
            setClause.push('email = ?');
            values.push(email);
        }
        if (address) {
            setClause.push('address = ?');
            values.push(address);
        }
        if (setClause.length === 0) {
            throw new Error('No updates provided');
        }
        values.push(id);
        await new Promise((resolve, reject) => {
            db.run(`UPDATE suppliers SET ${setClause.join(', ')} WHERE id = ?`, values, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        return getSupplierById(id);
    } catch (err) {
        throw err;
    }
};

const deleteSupplier = async (id) => {
    try {
        await new Promise((resolve, reject) => {
            db.run('DELETE FROM suppliers WHERE id = ?', [id], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        return { message: 'Supplier deleted successfully' };
    } catch (err) {
        throw err;
    }
};

const getTopSuppliers = async (limit = 3) => {
    try {
        return await new Promise((resolve, reject) => {
            const sql = `
                SELECT s.*, 
                COUNT(o.id) as order_count,
                COALESCE(SUM(o.total_amount), 0) as total_value
                FROM suppliers s
                LEFT JOIN orders o ON s.id = o.supplier_id
                GROUP BY s.id, s.name, s.contact_person, s.phone, s.email, s.address, s.created_at
                ORDER BY order_count DESC, total_value DESC
                LIMIT ?
            `;
            db.all(sql, [limit], (err, rows) => {
                if (err) reject(err);
                else {
                    rows.forEach(row => {
                        row.total_value = parseFloat(row.total_value);
                        row.order_count = parseInt(row.order_count);
                    });
                    resolve(rows);
                }
            });
        });
    } catch (err) {
        throw err;
    }
};

const getSuppliersCount = async () => {
    try {
        return await new Promise((resolve, reject) => {
            db.get('SELECT COUNT(*) as count FROM suppliers', (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        });
    } catch (err) {
        throw err;
    }
};

module.exports = {
    createSupplier,
    getSuppliers,
    getSupplierById,
    updateSupplier,
    deleteSupplier,
    getTopSuppliers,
    getSuppliersCount
};