const express = require('express');
const router = express.Router();
const productModel = require('../models/product');

router.get('/', async (req, res) => {
    try {
        const { search, category, brand, supplier, page = 1, limit = 10 } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        
        // Validate page and limit
        if (isNaN(pageNum) || pageNum < 1) {
            return res.status(400).json({ error: 'Invalid page parameter' });
        }
        if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
            return res.status(400).json({ error: 'Invalid limit parameter (must be between 1 and 100)' });
        }
        
        const result = await productModel.getProducts(search, category, brand, supplier, pageNum, limitNum);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: 'Failed to get products' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const product = await productModel.getProductById(req.params.id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(product);
    } catch (err) {
        res.status(500).json({ error: 'Failed to get product' });
    }
});

router.post('/', async (req, res) => {
    try {
        const { name, description, price, category, brand, supplierId, quantity } = req.body;
        const product = await productModel.createProduct(name, description, price, category, brand, supplierId);
        // Add initial inventory if quantity provided
        if (quantity && quantity > 0) {
            const inventoryModel = require('../models/inventory');
            await inventoryModel.addInventoryItem(product.id, quantity, 1); // warehouse_id = 1
        }
        res.status(201).json(product);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create product' });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const { name, description, price, category, brand, supplierId } = req.body;
        const updates = { name, description, price, category, brand, supplierId };
        const updatedProduct = await productModel.updateProduct(req.params.id, updates);
        res.json(updatedProduct);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update product' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const result = await productModel.deleteProduct(req.params.id);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

module.exports = router;