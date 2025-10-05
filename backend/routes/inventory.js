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
        const transactions = await inventoryTransactionModel.getTransactions();
        res.json(transactions);
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

module.exports = router;