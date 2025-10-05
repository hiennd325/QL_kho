const express = require('express');
const router = express.Router();
const orderModel = require('../models/order');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, '../database.db'), (err) => {
    if (err) {
        console.error('Could not connect to database:', err.message);
    }
});

// Get all orders (optional user filter)
router.get('/', async (req, res) => {
    try {
        const { userId } = req.query;
        if (userId) {
            const orders = await orderModel.getOrdersByUserId(userId);
            return res.json(orders);
        }
        const orders = await orderModel.getAllOrders();
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: 'Failed to get orders' });
    }
});

// Get order by ID with items
router.get('/:id', async (req, res) => {
    try {
        const order = await orderModel.getOrderById(req.params.id);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        // Get order items
        const items = await new Promise((resolve, reject) => {
            db.all(`
                SELECT oi.id, oi.product_id, oi.quantity, oi.price, p.name AS product_name
                FROM order_items oi
                JOIN products p ON oi.product_id = p.id
                WHERE oi.order_id = ?
            `, [req.params.id], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        res.json({ ...order, items });
    } catch (err) {
        res.status(500).json({ error: 'Failed to get order' });
    }
});

// Create new order
router.post('/', async (req, res) => {
    try {
        const { supplierId, items } = req.body;
        const userId = req.user.id; // Use authenticated user ID
        
        if (!userId || !items || items.length === 0) {
            return res.status(400).json({ error: 'Items are required' });
        }
        
        if (!supplierId) {
            return res.status(400).json({ error: 'Supplier ID is required' });
        }
        
        // Fetch product prices and calculate total
        let totalAmount = 0;
        const itemsWithPrice = [];
        for (const item of items) {
            const product = await new Promise((resolve, reject) => {
                db.get('SELECT id, name, price FROM products WHERE id = ?', [item.productId], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });
            
            if (!product) {
                return res.status(400).json({ error: `Product with ID ${item.productId} not found` });
            }
            
            const itemTotal = product.price * item.quantity;
            totalAmount += itemTotal;
            itemsWithPrice.push({ ...item, productId: product.id, price: product.price, itemTotal });
        }
        
        // Create order
        const order = await orderModel.createOrder(userId, supplierId, totalAmount, 'pending');
        
        // Insert order items
        for (const item of itemsWithPrice) {
            await new Promise((resolve, reject) => {
                db.run(
                    'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
                    [order.id, item.productId, item.quantity, item.price],
                    (err) => (err ? reject(err) : resolve())
                );
            });
        }
        
        // Fetch order with items for response
        const fullOrder = await orderModel.getOrderById(order.id);
        const orderItems = await new Promise((resolve, reject) => {
            db.all(`
                SELECT oi.*, p.name AS product_name
                FROM order_items oi
                JOIN products p ON oi.product_id = p.id
                WHERE oi.order_id = ?
            `, [order.id], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        res.status(201).json({ ...fullOrder, items: orderItems });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create order' });
    }
});

// Update order status
router.put('/:id', async (req, res) => {
    try {
        const { status } = req.body;
        if (!status) {
            return res.status(400).json({ error: 'Status is required' });
        }
        const updatedOrder = await orderModel.updateOrderStatus(req.params.id, status);
        res.json(updatedOrder);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update order' });
    }
});

// Delete order
router.delete('/:id', async (req, res) => {
    try {
        const result = await orderModel.deleteOrder(req.params.id);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete order' });
    }
});

module.exports = router;