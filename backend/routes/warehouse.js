const express = require('express');
const router = express.Router();
const warehouseModel = require('../models/warehouse');

// GET all warehouses
router.get('/', async (req, res) => {
    try {
        const warehouses = await warehouseModel.getWarehouses();
        res.json(warehouses);
    } catch (err) {
        res.status(500).json({ error: 'Failed to get warehouses' });
    }
});

// Expose count before '/:id' so '/count' isn't treated as an id
router.get('/count', async (req, res) => {
    try {
        const count = await warehouseModel.getWarehousesCount();
        res.json({ count });
    } catch (err) {
        res.status(500).json({ error: 'Failed to get warehouses count' });
    }
});

// GET a single warehouse by custom_id
router.get('/:custom_id', async (req, res) => {
    try {
        const warehouse = await warehouseModel.getWarehouseById(req.params.custom_id);
        if (!warehouse) {
            return res.status(404).json({ error: 'Warehouse not found' });
        }
        res.json(warehouse);
    } catch (err) {
        res.status(500).json({ error: 'Failed to get warehouse' });
    }
});

// POST new warehouse
router.post('/', async (req, res) => {
    try {
        const { custom_id, name, location, capacity } = req.body;
        const warehouse = await warehouseModel.createWarehouse(name, location, capacity, custom_id);
        res.status(201).json(warehouse);
    } catch (err) {
        if (err.message === 'Mã kho đã tồn tại') {
            res.status(400).json({ error: err.message });
        } else {
            res.status(500).json({ error: 'Failed to create warehouse' });
        }
    }
});

// PUT update warehouse
router.put('/:custom_id', async (req, res) => {
    try {
        const updates = req.body;
        const updatedWarehouse = await warehouseModel.updateWarehouse(req.params.custom_id, updates);
        res.json(updatedWarehouse);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update warehouse' });
    }
});

// GET products in a warehouse
router.get('/:custom_id/products', async (req, res) => {
    try {
        const products = await warehouseModel.getWarehouseProducts(req.params.custom_id);
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: 'Failed to get warehouse products' });
    }
});

// DELETE warehouse
router.delete('/:custom_id', async (req, res) => {
    try {
        const result = await warehouseModel.deleteWarehouse(req.params.custom_id);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete warehouse' });
    }
});

router.get('/count', async (req, res) => {
    try {
        const count = await warehouseModel.getWarehousesCount();
        res.json({ count });
    } catch (err) {
        res.status(500).json({ error: 'Failed to get warehouses count' });
    }
});

module.exports = router;