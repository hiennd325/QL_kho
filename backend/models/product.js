// models/product.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

const db = new sqlite3.Database(path.join(__dirname, '../database.db'), (err) => {
    if (err) {
        console.error('Could not connect to database:', err.message);
    }
});

const createProduct = async (name, description, price, category, brand, supplierId, customId) => {
    try {
        const result = await new Promise((resolve, reject) => {
            const query = customId 
                ? 'INSERT INTO products (name, description, price, category, brand, supplier_id, custom_id) VALUES (?, ?, ?, ?, ?, ?, ?)'
                : 'INSERT INTO products (name, description, price, category, brand, supplier_id) VALUES (?, ?, ?, ?, ?, ?)';
            const params = customId 
                ? [name, description, price, category, brand, supplierId, customId]
                : [name, description, price, category, brand, supplierId];
                
            db.run(query, params, function(err) {
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

const getProducts = async (search = '', category = '', brand = '', supplier = '', page = 1, limit = 10) => {
    try {
        // Calculate offset for pagination
        const offset = (page - 1) * limit;
        
        // Build WHERE clause dynamically
        let whereClause = '';
        const whereParams = [];
        
        if (search || category || brand || supplier) {
            const conditions = [];
            
            if (search) {
                conditions.push('(name LIKE ? OR custom_id LIKE ?)');
                whereParams.push(`%${search}%`, `%${search}%`);
            }
            
            if (category) {
                conditions.push('category = ?');
                whereParams.push(category);
            }
            
            if (brand) {
                conditions.push('brand = ?');
                whereParams.push(brand);
            }
            
            if (supplier) {
                conditions.push('supplier_id = ?');
                whereParams.push(supplier);
            }
            
            whereClause = ' WHERE ' + conditions.join(' AND ');
        }
        
        // Get total count
        const totalCount = await new Promise((resolve, reject) => {
            let countSql = 'SELECT COUNT(*) as count FROM products';
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
        
        // Get products with pagination
        const products = await new Promise((resolve, reject) => {
            let sql = `SELECT p.id, p.custom_id, p.name, p.description, p.price, p.category, p.brand, p.supplier_id, p.created_at, s.name as supplier_name, COALESCE(SUM(i.quantity), 0) as quantity
                       FROM products p
                       LEFT JOIN suppliers s ON p.supplier_id = s.id
                       LEFT JOIN inventory i ON p.id = i.product_id`;
            if (whereClause) {
                sql += whereClause;
            }
            sql += ' GROUP BY p.id, p.custom_id, p.name, p.description, p.price, p.category, p.brand, p.supplier_id, p.created_at, s.name ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
            const params = [...whereParams, limit, offset];

            db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        return {
            products,
            totalCount,
            totalPages,
            currentPage: page
        };
    } catch (err) {
        throw err;
    }
};

const getProductById = async (id) => {
    try {
        return await new Promise((resolve, reject) => {
            db.get(`SELECT p.id, p.custom_id, p.name, p.description, p.price, p.category, p.brand, p.supplier_id, p.created_at, COALESCE(SUM(i.quantity), 0) as quantity
                    FROM products p
                    LEFT JOIN inventory i ON p.id = i.product_id
                    WHERE p.id = ?
                    GROUP BY p.id, p.custom_id, p.name, p.description, p.price, p.category, p.brand, p.supplier_id, p.created_at`, [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    } catch (err) {
        throw err;
    }
};

const updateProduct = async (id, updates) => {
    try {
        const { name, description, price, category, brand, supplierId, customId } = updates;
        const setClause = [];
        const values = [];
        if (name !== undefined) {
            setClause.push('name = ?');
            values.push(name);
        }
        if (description !== undefined) {
            setClause.push('description = ?');
            values.push(description);
        }
        if (price !== undefined) {
            setClause.push('price = ?');
            values.push(price);
        }
        if (category !== undefined) {
            setClause.push('category = ?');
            values.push(category);
        }
        if (brand !== undefined) {
            setClause.push('brand = ?');
            values.push(brand);
        }
        if (supplierId !== undefined) {
            setClause.push('supplier_id = ?');
            values.push(supplierId);
        }
        if (customId !== undefined) {
            setClause.push('custom_id = ?');
            values.push(customId);
        }
        if (setClause.length === 0) {
            throw new Error('No updates provided');
        }
        values.push(id);
        await new Promise((resolve, reject) => {
            db.run(`UPDATE products SET ${setClause.join(', ')} WHERE id = ?`, values, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        return await getProductById(id);
    } catch (err) {
        throw err;
    }
};

const deleteProduct = async (id) => {
    try {
        // First check if product exists
        const product = await getProductById(id);
        if (!product) {
            throw new Error('Product not found');
        }
        
        // Delete related inventory records first
        await new Promise((resolve, reject) => {
            db.run('DELETE FROM inventory WHERE product_id = ?', [id], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        
        // Then delete the product
        await new Promise((resolve, reject) => {
            db.run('DELETE FROM products WHERE id = ?', [id], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        return { message: 'Product deleted successfully' };
    } catch (err) {
        throw err;
    }
};

const getProductsCount = async () => {
    try {
        return await new Promise((resolve, reject) => {
            db.get('SELECT COUNT(*) as count FROM products', (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        });
    } catch (err) {
        throw err;
    }
};

const getUniqueBrands = async () => {
    try {
        return await new Promise((resolve, reject) => {
            db.all('SELECT DISTINCT brand FROM products WHERE brand IS NOT NULL AND brand != "" ORDER BY brand', (err, rows) => {
                if (err) reject(err);
                else resolve(rows.map(row => row.brand));
            });
        });
    } catch (err) {
        throw err;
    }
};

module.exports = {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    getProductsCount,
    getUniqueBrands
};
