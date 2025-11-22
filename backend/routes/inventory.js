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
        const { warehouse } = req.query;
        let query = `
            SELECT i.id, i.product_id, p.custom_id, p.name as product_name, i.quantity, i.warehouse_id
            FROM inventory i
            JOIN products p ON i.product_id = p.custom_id
        `;
        const params = [];

        if (warehouse) {
            query += ' WHERE i.warehouse_id = ?';
            params.push(warehouse);
        }

        const inventory = await new Promise((resolve, reject) => {
            db.all(query, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });

        if (!inventory || inventory.length === 0) {
            return res.json([]);
        }
        res.json(inventory);
    } catch (err) {
        res.status(500).json({ error: 'Failed to get inventory' });
    }
});

// Temporarily remove authenticate for testing
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
        // Tạo mã giao dịch nếu không được cung cấp
        const transactionId = reference_id || `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;
        
        const transaction = await inventoryTransactionModel.createTransaction(
            transactionId,
            product_id,
            warehouse_id,
            quantityNum,
            type,
            supplier_id,
            customer_name,
            notes
        );

        res.status(201).json({ message: 'Transaction successful', transaction: { reference_id: transaction.reference_id } });
    } catch (err) {
        console.error('Transaction error:', err);
        res.status(500).json({ error: 'Failed to process transaction' });
    }
});


// POST create inventory audit with items
router.post('/audits', async (req, res) => {
    try {
        const { code, date, warehouse_id, notes, items } = req.body;
        const created_by_user_id = req.user.id; // Get user ID from authenticated user

        if (!code || !date || !warehouse_id || !created_by_user_id) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'At least one item is required' });
        }

        // Calculate total discrepancy
        let totalDiscrepancy = 0;
        items.forEach(item => {
            totalDiscrepancy += (item.system_quantity - item.actual_quantity);
        });

        // Create audit
        const audit = await new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO audits (code, date, warehouse_id, created_by_user_id, discrepancy, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [code, date, warehouse_id, created_by_user_id, totalDiscrepancy, 'pending', notes],
                function (err) {
                    if (err) reject(err);
                    else resolve({ id: this.lastID, code, date, warehouse_id, created_by_user_id, discrepancy: totalDiscrepancy, status: 'pending', notes });
                }
            );
        });

        // Insert audit items
        for (const item of items) {
            await new Promise((resolve, reject) => {
                const discrepancy = item.system_quantity - item.actual_quantity;
                db.run(
                    `INSERT INTO audit_items (audit_id, product_id, system_quantity, actual_quantity, discrepancy, notes) 
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [audit.id, item.product_id, item.system_quantity, item.actual_quantity, discrepancy, item.notes || ''],
                    function (err) {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });
        }

        res.status(201).json({ ...audit, items });
    } catch (err) {
        console.error('Error creating inventory audit:', err);
        res.status(500).json({ error: 'Failed to create inventory audit' });
    }
});

// GET a single inventory audit by ID with items
router.get('/audits/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const audit = await new Promise((resolve, reject) => {
            const query = `
                SELECT a.id, a.code, a.date, a.discrepancy, a.status, a.notes,
                       w.name as warehouse_name, u.username as created_by_username
                FROM audits a
                JOIN warehouses w ON a.warehouse_id = w.id
                JOIN users u ON a.created_by_user_id = u.id
                WHERE a.id = ?
            `;
            db.get(query, [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (!audit) {
            return res.status(404).json({ error: 'Audit not found' });
        }

        // Get audit items
        const items = await new Promise((resolve, reject) => {
            const query = `
                SELECT ai.id, ai.product_id, p.name as product_name, 
                       ai.system_quantity, ai.actual_quantity, ai.discrepancy, ai.notes
                FROM audit_items ai
                JOIN products p ON ai.product_id = p.custom_id
                WHERE ai.audit_id = ?
            `;
            db.all(query, [id], (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });

        res.json({ ...audit, items });
    } catch (err) {
        console.error('Error getting inventory audit:', err);
        res.status(500).json({ error: 'Failed to get inventory audit' });
    }
});

// DELETE inventory audit
router.delete('/audits/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await new Promise((resolve, reject) => {
            db.run('DELETE FROM audits WHERE id = ?', [id], function(err) {
                if (err) reject(err);
                // this.changes returns the number of rows affected.
                else resolve(this.changes);
            });
        });

        if (result === 0) {
            return res.status(404).json({ error: 'Audit not found' });
        }

        res.json({ message: 'Audit deleted successfully' });
    } catch (err) {
        console.error('Error deleting inventory audit:', err);
        res.status(500).json({ error: 'Failed to delete inventory audit' });
    }
});

module.exports = router;