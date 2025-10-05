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

// GET a single warehouse by ID
router.get('/:id', async (req, res) => {
    try {
        const warehouse = await warehouseModel.getWarehouseById(req.params.id);
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
        const { name, location, capacity } = req.body;
        const warehouse = await warehouseModel.createWarehouse(name, location, capacity);
        res.status(201).json(warehouse);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create warehouse' });
    }
});

// PUT update warehouse
router.put('/:id', async (req, res) => {
    try {
        const updates = req.body;
        const updatedWarehouse = await warehouseModel.updateWarehouse(req.params.id, updates);
        res.json(updatedWarehouse);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update warehouse' });
    }
});

// DELETE warehouse
router.delete('/:id', async (req, res) => {
    try {
        const result = await warehouseModel.deleteWarehouse(req.params.id);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete warehouse' });
    }
});

module.exports = router;