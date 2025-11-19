const express = require('express');
const router = express.Router();
const orderModel = require('../models/order');
const inventoryModel = require('../models/inventory');
const inventoryTransactionModel = require('../models/inventory_transaction');

const productModel = require('../models/product');

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
        const items = await orderModel.getOrderItems(req.params.id);
        
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
            const product = await productModel.getProductById(item.productId);
            
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
            await orderModel.createOrderItem(order.id, item.productId, item.quantity, item.price);
        }
        
        // Fetch order with items for response
        const fullOrder = await orderModel.getOrderById(order.id);
        const orderItems = await orderModel.getOrderItems(order.id);
        
        res.status(201).json({ ...fullOrder, items: orderItems });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create order' });
    }
});

// Receive order
router.put('/:id/receive', async (req, res) => {
    try {
        const orderId = req.params.id;
        const order = await orderModel.getOrderById(orderId);

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        if (order.status === 'completed') {
            return res.status(400).json({ error: 'Order already completed' });
        }

        const items = await orderModel.getOrderItems(orderId);

        for (const item of items) {
            await inventoryModel.updateInventoryQuantity(item.product_id, item.quantity);
            await inventoryTransactionModel.createTransaction(item.product_id, 1, item.quantity, 'nhap');
        }

        const updatedOrder = await orderModel.updateOrderStatus(orderId, 'completed');
        res.json(updatedOrder);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to receive order' });
    }
});

// Update order
router.put('/:id', async (req, res) => {
    try {
        const orderId = req.params.id;
        const { supplierId, items } = req.body;

        if (!supplierId || !items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Supplier and items are required.' });
        }

        // Recalculate total amount to ensure data integrity
        let totalAmount = 0;
        for (const item of items) {
            const product = await productModel.getProductById(item.product_id);
            if (!product) {
                return res.status(404).json({ error: `Product not found: ID ${item.product_id}` });
            }
            totalAmount += product.price * item.quantity;
        }
        
        const updatedOrder = await orderModel.updateOrder(orderId, supplierId, totalAmount, items);

        res.json(updatedOrder);
    } catch (err) {
        console.error("Failed to update order:", err);
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

router.get('/count', async (req, res) => {
    try {
        const count = await orderModel.getOrdersCount();
        res.json({ count });
    } catch (err) {
        res.status(500).json({ error: 'Failed to get orders count' });
    }
});

module.exports = router;