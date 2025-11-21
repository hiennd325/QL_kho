const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, '..', 'database.db'), (err) => {
    if (err) {
        console.error('Could not connect to database:', err.message);
    }
});

// Simple count endpoint for orders
router.get('/count', async (req, res) => {
    try {
        db.get('SELECT COUNT(*) as count FROM orders', (err, row) => {
            if (err) return res.status(500).json({ error: 'Failed to get orders count' });
            res.json({ count: row ? row.count : 0 });
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to get orders count' });
    }
});

module.exports = router;
