const express = require('express');
const router = express.Router();
const supplierModel = require('../models/supplier');

// GET all suppliers
router.get('/', async (req, res) => {
    try {
        const suppliers = await supplierModel.getSuppliers();
        res.json(suppliers);
    } catch (err) {
        res.status(500).json({ error: 'Failed to get suppliers' });
    }
});

// Count endpoint must come before '/:id' to avoid matching as an ID
router.get('/count', async (req, res) => {
    try {
        const count = await supplierModel.getSuppliersCount();
        res.json({ count });
    } catch (err) {
        res.status(500).json({ error: 'Failed to get suppliers count' });
    }
});

// GET a single supplier by ID
router.get('/:id', async (req, res) => {
    try {
        const supplier = await supplierModel.getSupplierById(req.params.id);
        if (!supplier) {
            return res.status(404).json({ error: 'Supplier not found' });
        }
        res.json(supplier);
    } catch (err) {
        res.status(500).json({ error: 'Failed to get supplier' });
    }
});

// POST new supplier
router.post('/', async (req, res) => {
    try {
        const { name, contact_person, phone, email, address } = req.body;
        const supplier = await supplierModel.createSupplier(name, contact_person, phone, email, address);
        res.status(201).json(supplier);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create supplier' });
    }
});

// PUT update supplier
router.put('/:id', async (req, res) => {
    try {
        const updates = req.body;
        const updatedSupplier = await supplierModel.updateSupplier(req.params.id, updates);
        res.json(updatedSupplier);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update supplier' });
    }
});

// DELETE supplier
router.delete('/:id', async (req, res) => {
    try {
        const result = await supplierModel.deleteSupplier(req.params.id);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete supplier' });
    }
});

// GET top suppliers
router.get('/top', async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : 3;
        const topSuppliers = await supplierModel.getTopSuppliers(limit);
        res.json(topSuppliers);
    } catch (err) {
        res.status(500).json({ error: 'Failed to get top suppliers' });
    }
});

router.get('/count', async (req, res) => {
    try {
        const count = await supplierModel.getSuppliersCount();
        res.json({ count });
    } catch (err) {
        res.status(500).json({ error: 'Failed to get suppliers count' });
    }
});

module.exports = router;