const express = require('express');
const router = express.Router();
const salesOrderModel = require('../models/sales_order');
const inventoryModel = require('../models/inventory');
const inventoryTransactionModel = require('../models/inventory_transaction');
const productModel = require('../models/product');

// Get all sales orders
router.get('/', async (req, res) => {
    try {
        const orders = await salesOrderModel.getAllSalesOrders();
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: 'Failed to get sales orders' });
    }
});

// Get sales order by ID with items
router.get('/:id', async (req, res) => {
    try {
        const order = await salesOrderModel.getSalesOrderById(req.params.id);
        if (!order) {
            return res.status(404).json({ error: 'Sales order not found' });
        }
        
        const items = await salesOrderModel.getSalesOrderItems(req.params.id);
        
        res.json({ ...order, items });
    } catch (err) {
        res.status(500).json({ error: 'Failed to get sales order' });
    }
});

// Create new sales order
router.post('/', async (req, res) => {
    try {
        const { customerName, phone, email, address, items } = req.body;
        const userId = req.user.id;
        
        if (!userId || !items || items.length === 0) {
            return res.status(400).json({ error: 'Items are required' });
        }
        
        let totalAmount = 0;
        const itemsWithPrice = [];
        for (const item of items) {
            const product = await productModel.getProductById(item.productId);
            
            if (!product) {
                return res.status(400).json({ error: `Product with ID ${item.productId} not found` });
            }

            const inventory = await inventoryModel.getInventoryByProductId(item.productId);
            if (!inventory || inventory.quantity < item.quantity) {
                return res.status(400).json({ error: `Not enough stock for product ${product.name}` });
            }
            
            const itemTotal = product.price * item.quantity;
            totalAmount += itemTotal;
            itemsWithPrice.push({ ...item, productId: product.id, price: product.price, itemTotal });
        }
        
        const order = await salesOrderModel.createSalesOrder(userId, customerName, phone, email, address, totalAmount, 'pending');
        
        for (const item of itemsWithPrice) {
            await salesOrderModel.createSalesOrderItem(order.id, item.productId, item.quantity, item.price);
            await inventoryModel.updateInventoryQuantity(item.productId, -item.quantity);
            await inventoryTransactionModel.createTransaction(item.productId, 1, -item.quantity, 'xuat');
        }
        
        const fullOrder = await salesOrderModel.getSalesOrderById(order.id);
        const orderItems = await salesOrderModel.getSalesOrderItems(order.id);
        
        res.status(201).json({ ...fullOrder, items: orderItems });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create sales order' });
    }
});

// Update sales order status
router.put('/:id', async (req, res) => {
    try {
        const { status } = req.body;
        if (!status) {
            return res.status(400).json({ error: 'Status is required' });
        }
        const updatedOrder = await salesOrderModel.updateSalesOrderStatus(req.params.id, status);
        res.json(updatedOrder);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update sales order' });
    }
});

// Delete sales order
router.delete('/:id', async (req, res) => {
    try {
        const result = await salesOrderModel.deleteSalesOrder(req.params.id);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete sales order' });
    }
});

module.exports = router;