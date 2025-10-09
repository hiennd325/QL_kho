const express = require('express');
const router = express.Router();
const inventoryModel = require('../models/inventory');
const inventoryTransactionModel = require('../models/inventory_transaction');

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

// Add stock to a product
router.post('/add', async (req, res) => {
    try {
        const { productId, quantity, warehouseId = 1 } = req.body;
        if (!productId || quantity === undefined) {
            return res.status(400).json({ error: 'Product ID and quantity are required' });
        }
        const updated = await inventoryModel.addInventoryItem(productId, quantity, warehouseId);
        // Create transaction record
        await inventoryTransactionModel.createTransaction(productId, warehouseId, quantity, 'nhap');
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: 'Failed to add inventory' });
    }
});

// Reduce stock (for sales)
router.post('/minus', async (req, res) => {
    try {
        const { productId, quantity, warehouseId = 1 } = req.body;
        if (!productId || quantity === undefined) {
            return res.status(400).json({ error: 'Product ID and quantity are required' });
        }
        const updated = await inventoryModel.updateInventoryQuantity(productId, -quantity, warehouseId);
        // Create transaction record
        await inventoryTransactionModel.createTransaction(productId, warehouseId, quantity, 'xuat');
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update inventory' });
    }
});

// POST create inventory audit
router.post('/audits', async (req, res) => {
    try {
        const { code, date, warehouse_id, checker, notes } = req.body;
        if (!code || !date || !warehouse_id || !checker) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // For now, just return success. In a real implementation, you'd save this to a database
        const audit = {
            id: Date.now(),
            code,
            date,
            warehouse_id,
            checker,
            notes,
            status: 'pending',
            created_at: new Date().toISOString()
        };

        res.status(201).json(audit);
    } catch (err) {
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