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
// Count route MUST be defined before '/:id' so 'count' isn't treated as an id
router.get('/count', async (req, res) => {
    try {
        const count = await productModel.getProductsCount();
        res.json({ count });
    } catch (err) {
        res.status(500).json({ error: 'Failed to get products count' });
    }
});

// This route needs authentication in production
router.get('/brands', async (req, res) => {
    try {
        const brands = await productModel.getUniqueBrands();
        res.json(brands);
    } catch (err) {
        res.status(500).json({ error: 'Failed to get brands' });
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
        const { name, description, price, category, brand, supplierId, customId } = req.body;
        const product = await productModel.createProduct(name, description, price, category, brand, supplierId, customId);
        res.status(201).json(product);
    } catch (err) {
        // Trả về thông báo lỗi cụ thể từ model
        if (err.message === 'Mã sản phẩm đã tồn tại') {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).json({ error: 'Failed to create product: ' + err.message });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const { name, description, price, category, brand, supplierId, customId } = req.body;
        const updates = { name, description, price, category, brand, supplierId, customId };
        const updatedProduct = await productModel.updateProduct(req.params.id, updates);
        res.json(updatedProduct);
    } catch (err) {
        // Trả về thông báo lỗi cụ thể từ model
        if (err.message === 'Mã sản phẩm đã tồn tại') {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).json({ error: 'Failed to update product: ' + err.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const result = await productModel.deleteProduct(req.params.id);
        res.json(result);
    } catch (err) {
        if (err.message === 'Product not found') {
            res.status(404).json({ error: 'Product not found' });
        } else {
            res.status(500).json({ error: 'Failed to delete product' });
        }
    }
});

// Export products to CSV
router.get('/export', async (req, res) => {
    try {
        const { search, category, brand, supplier } = req.query;
        const products = await productModel.getProducts(search, category, brand, supplier, 1, 1000); // Get all products

        // Create CSV content
        const csvHeaders = ['ID', 'Tên sản phẩm', 'Mô tả', 'Giá', 'Danh mục', 'Thương hiệu', 'Nhà cung cấp', 'Số lượng', 'Ngày tạo'];
        let csvContent = csvHeaders.join(',') + '\n';

        products.products.forEach(product => {
            const row = [
                product.id,
                `"${product.name}"`,
                `"${product.description || ''}"`,
                product.price,
                `"${product.category || ''}"`,
                `"${product.brand || ''}"`,
                `"${product.supplier_name || ''}"`,
                product.quantity || 0,
                product.created_at
            ];
            csvContent += row.join(',') + '\n';
        });

        // Set headers for CSV download
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="products.csv"');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

        res.send('\ufeff' + csvContent); // Add BOM for UTF-8
    } catch (err) {
        console.error('Export error:', err);
        res.status(500).json({ error: 'Failed to export products' });
    }
});

router.get('/count', async (req, res) => {
    try {
        const count = await productModel.getProductsCount();
        res.json({ count });
    } catch (err) {
        res.status(500).json({ error: 'Failed to get products count' });
    }
});
// Note: '/brands' already defined above before '/:id'

module.exports = router;