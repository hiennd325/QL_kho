const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, '../database.db'), (err) => {
    if (err) {
        console.error('Could not connect to database:', err.message);
    }
});

// Get all notifications
router.get('/', async (req, res) => {
    try {
        // For now, return low stock alerts as notifications
        const notifications = await new Promise((resolve, reject) => {
            db.all(`
                SELECT
                    'warning' as type,
                    'alert-triangle' as icon,
                    'Cảnh báo tồn kho thấp' as title,
                    p.name || ' chỉ còn ' || i.quantity || ' sản phẩm' as message,
                    i.id as id,
                    datetime('now') as created_at
                FROM inventory i
                JOIN products p ON i.product_id = p.id
                WHERE i.quantity <= 10
                ORDER BY i.quantity ASC
                LIMIT 10
            `, (err, rows) => {
                if (err) reject(err);
                else {
                    // Add is_read field to each notification
                    const notificationsWithReadStatus = rows.map(row => ({
                        ...row,
                        is_read: false
                    }));
                    resolve(notificationsWithReadStatus);
                }
            });
        });
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ error: 'Failed to get notifications' });
    }
});

// Get notification count (unread notifications)
router.get('/count', async (req, res) => {
    try {
        // For now, return the count of low stock items as unread notifications
        // In a real implementation, you'd count unread notifications from a notifications table
        const count = await new Promise((resolve, reject) => {
            db.get(`
                SELECT COUNT(*) as count
                FROM inventory i
                WHERE i.quantity <= 10
            `, (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        });
        res.json({ count });
    } catch (err) {
        res.status(500).json({ error: 'Failed to get notification count' });
    }
});

// Mark notification as read
router.put('/:id/read', async (req, res) => {
    try {
        // For now, just return success since we're using mock data
        // In a real implementation, you'd update a notifications table
        res.json({ message: 'Notification marked as read' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
});

// Mark all notifications as read
router.put('/read-all', async (req, res) => {
    try {
        // For now, just return success since we're using mock data
        // In a real implementation, you'd update all notifications for the user
        res.json({ message: 'All notifications marked as read' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to mark all notifications as read' });
    }
});

module.exports = router;