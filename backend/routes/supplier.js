const express = require('express');
const router = express.Router();
const supplierModel = require('../models/supplier');

// GET all suppliers
router.get('/', async (req, res) => {
    try {
        const { search } = req.query;
        const suppliers = await supplierModel.getSuppliers(search);
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
        const { code, name, phone, email, address } = req.body;
        if (!code) {
            return res.status(400).json({ error: 'Mã nhà cung cấp là bắt buộc' });
        }

        if (phone) {
            const phoneRegex = /^\d{10}$/;
            if (!phoneRegex.test(phone)) {
                return res.status(400).json({ error: 'Số điện thoại phải là 10 chữ số.' });
            }
        }

        if (email) {
            const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.com$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ error: 'Email phải có định dạng example@company.com' });
            }
        }

        const supplier = await supplierModel.createSupplier(code, name, name, phone, email, address);
        res.status(201).json(supplier);
    } catch (err) {
        if (err.message === 'Mã nhà cung cấp đã tồn tại') {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).json({ error: 'Failed to create supplier' });
    }
});

// PUT update supplier
router.put('/:id', async (req, res) => {
    try {
        const updates = req.body;
        if (updates.name) {
            updates.contact_person = updates.name;
        }

        if (updates.phone) {
            const phoneRegex = /^\d{10}$/;
            if (!phoneRegex.test(updates.phone)) {
                return res.status(400).json({ error: 'Số điện thoại phải là 10 chữ số.' });
            }
        }

        if (updates.email) {
            const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.com$/;
            if (!emailRegex.test(updates.email)) {
                return res.status(400).json({ error: 'Email phải có định dạng example@company.com' });
            }
        }
        
        const updatedSupplier = await supplierModel.updateSupplier(req.params.id, updates);
        res.json(updatedSupplier);
    } catch (err) {
        if (err.message === 'Mã nhà cung cấp đã tồn tại') {
            return res.status(400).json({ error: err.message });
        }
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