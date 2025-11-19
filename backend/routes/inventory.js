const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const inventoryModel = require('../models/inventory');
const inventoryTransactionModel = require('../models/inventory_transaction');

const db = new sqlite3.Database(path.join(__dirname, '../database.db'), (err) => {
    if (err) {
        console.error('Could not connect to database:', err.message);
    }
});

// Get all inventory items (with product details)
router.get('/', async (req, res) => {
    try {
        const inventory = await inventoryModel.getAllInventory();
        if (!inventory || inventory.length === 0) {
            return res.status(404).json({ error: 'No inventory found' });
        }
        res.json(inventory);
    } catch (err) {
        res.status(500).json({ error: 'Failed to get inventory' });
    }
});

router.get('/transactions', async (req, res) => {
    try {
        const { page = 1, limit = 10, type, warehouseId, startDate, endDate } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        // Validate page and limit
        if (isNaN(pageNum) || pageNum < 1) {
            return res.status(400).json({ error: 'Invalid page parameter' });
        }
        if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
            return res.status(400).json({ error: 'Invalid limit parameter (must be between 1 and 100)' });
        }

        const result = await inventoryTransactionModel.getTransactionsPaginated(pageNum, limitNum, type, warehouseId, startDate, endDate);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: 'Failed to get transactions' });
    }
});

// Get inventory for a specific product
router.get('/:productId', async (req, res) => {
    try {
        const inventory = await inventoryModel.getInventoryByProductId(req.params.productId);
        if (!inventory) {
            return res.status(404).json({ error: 'Inventory not found' });
        }
        res.json(inventory);
    } catch (err) {
        res.status(500).json({ error: 'Failed to get inventory' });
    }
});


// Add a new inventory transaction (import or export)
router.post('/transactions', async (req, res) => {
    try {
        const { product_id, warehouse_id, quantity, type, supplier_id, customer_name, reference_id, notes } = req.body;

        // Basic validation
        if (!product_id || !warehouse_id || quantity === undefined || !type) {
            return res.status(400).json({ error: 'product_id, warehouse_id, quantity, and type are required' });
        }

        const quantityNum = parseInt(quantity);
        if (isNaN(quantityNum) || quantityNum <= 0) {
            return res.status(400).json({ error: 'Invalid quantity' });
        }

        if (type === 'nhap') {
            // Add inventory
            await inventoryModel.addInventoryItem(product_id, quantityNum, warehouse_id);
        } else if (type === 'xuat') {
            // Check for sufficient stock
            const currentInventory = await inventoryModel.getInventoryByProductId(product_id, warehouse_id);
            if (!currentInventory || currentInventory.quantity < quantityNum) {
                return res.status(400).json({ error: 'Insufficient stock' });
            }
            // Reduce inventory
            await inventoryModel.updateInventoryQuantity(product_id, -quantityNum, warehouse_id);
        } else {
            return res.status(400).json({ error: 'Invalid transaction type' });
        }

        // Create transaction record
        const transaction = await inventoryTransactionModel.createTransaction(
            product_id,
            warehouse_id,
            quantityNum,
            type,
            supplier_id,
            customer_name,
            reference_id,
            notes
        );

        res.status(201).json({ message: 'Transaction successful', transaction });
    } catch (err) {
        console.error('Transaction error:', err);
        res.status(500).json({ error: 'Failed to process transaction' });
    }
});


// POST create inventory audit
router.post('/audits', async (req, res) => {
    try {
        const { code, date, warehouse_id, notes } = req.body;
        const created_by_user_id = req.user.id; // Get user ID from authenticated user

        if (!code || !date || !warehouse_id || !created_by_user_id) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const audit = await new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO audits (code, date, warehouse_id, created_by_user_id, discrepancy, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [code, date, warehouse_id, created_by_user_id, 0, 'pending', notes],
                function (err) {
                    if (err) reject(err);
                    else resolve({ id: this.lastID, code, date, warehouse_id, created_by_user_id, discrepancy: 0, status: 'pending', notes });
                }
            );
        });

        res.status(201).json(audit);
    } catch (err) {
        console.error('Error creating inventory audit:', err);
        res.status(500).json({ error: 'Failed to create inventory audit' });
    }
});

// Export transactions to CSV
router.get('/transactions/export', async (req, res) => {
    try {
        const { type, warehouseId, startDate, endDate } = req.query;

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

        const transactions = await new Promise((resolve, reject) => {
            let sql = `SELECT it.id, it.product_id, it.warehouse_id, it.quantity, it.type, it.transaction_date,
                               p.name as product_name, w.name as warehouse_name
                        FROM inventory_transactions it
                        JOIN products p ON it.product_id = p.id
                        JOIN warehouses w ON it.warehouse_id = w.id`;
            if (whereClause) {
                sql += whereClause;
            }
            sql += ' ORDER BY it.transaction_date DESC';

            db.all(sql, whereParams, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        // Convert to CSV
        let csv = 'ID,Ngày giao dịch,Sản phẩm,Số lượng,Giá trị,Kho,Loại\n';
        transactions.forEach(t => {
            const formattedDate = new Date(t.transaction_date).toLocaleDateString('vi-VN');
            const typeLabel = t.type === 'nhap' ? 'Nhập kho' : 'Xuất kho';
            csv += `${t.id},"${formattedDate}","${t.product_name}",${t.quantity},0,"${t.warehouse_name}","${typeLabel}"\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="transactions.csv"');
        res.send(csv);
    } catch (err) {
        res.status(500).json({ error: 'Failed to export transactions' });
    }
});

module.exports = router;