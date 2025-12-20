const express = require('express');
const router = express.Router();
const { createTransfer, getTransfers, getTransferById, updateTransferStatus, deleteTransfer } = require('../models/transfers');
const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// Get recent transfers
router.get('/', authenticateToken, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const transfers = await getTransfers(limit);

        // Format the data for frontend
        const formattedTransfers = transfers.map(transfer => ({
            id: transfer.id,
            code: transfer.code,
            date: new Date(transfer.created_at).toLocaleDateString('vi-VN'),
            from_warehouse: transfer.from_warehouse_name,
            to_warehouse: transfer.to_warehouse_name,
            item_count: transfer.item_count,
            product_names: transfer.product_names,
            status: transfer.status,
            user: transfer.user_name
        }));

        res.json(formattedTransfers);
    } catch (error) {
        console.error('Error fetching transfers:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get transfer by ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const transfer = await getTransferById(req.params.id);
        if (!transfer) {
            return res.status(404).json({ error: 'Transfer not found' });
        }
        res.json(transfer);
    } catch (error) {
        console.error('Error fetching transfer:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create new transfer
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { from_warehouse_id, to_warehouse_id, items, notes } = req.body;

        if (!from_warehouse_id || !to_warehouse_id || !items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Missing required fields or empty items list' });
        }

        if (from_warehouse_id === to_warehouse_id) {
            return res.status(400).json({ error: 'From and to warehouses cannot be the same' });
        }

        const transferData = {
            from_warehouse_id,
            to_warehouse_id,
            items: items.map(item => ({
                product_id: item.product_id,
                quantity: parseInt(item.quantity)
            })),
            user_id: req.user.id,
            notes
        };

        const result = await createTransfer(transferData);
        res.status(201).json({ message: 'Transfer created successfully', transfer: result });
    } catch (error) {
        console.error('Error creating transfer:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update transfer status
router.put('/:id/status', authenticateToken, async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const result = await updateTransferStatus(req.params.id, status);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Transfer not found' });
        }

        res.json({ message: 'Transfer status updated successfully' });
    } catch (error) {
        console.error('Error updating transfer status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete transfer
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const result = await deleteTransfer(req.params.id);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Transfer not found' });
        }
        res.json({ message: 'Transfer deleted successfully' });
    } catch (error) {
        console.error('Error deleting transfer:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;