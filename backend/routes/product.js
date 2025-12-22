/**
 * File định nghĩa các route CRUD cho quản lý sản phẩm (products)
 * Bao gồm: lấy danh sách, tạo, cập nhật, xóa sản phẩm, xuất CSV
 */

// Import các module cần thiết
const express = require('express'); // Framework web
const router = express.Router(); // Tạo router instance
const productModel = require('../models/product'); // Model xử lý logic sản phẩm

/**
 * Route lấy danh sách sản phẩm với bộ lọc và phân trang
 * Phương thức: GET
 * Đường dẫn: /products
 * Query parameters: search, category, brand, supplier, page, limit
 */
router.get('/', async (req, res) => {
    try {
        // Lấy các tham số từ query string
        const { search, category, brand, supplier, page = 1, limit = 10 } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        // Kiểm tra tính hợp lệ của tham số page
        if (isNaN(pageNum) || pageNum < 1) {
            return res.status(400).json({ error: 'Invalid page parameter' });
        }
        // Kiểm tra tính hợp lệ của tham số limit (1-100)
        if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
            return res.status(400).json({ error: 'Invalid limit parameter (must be between 1 and 100)' });
        }

        // Gọi model để lấy danh sách sản phẩm với bộ lọc
        const result = await productModel.getProducts(search, category, brand, supplier, pageNum, limitNum);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: 'Failed to get products' });
    }
});
/**
 * Route lấy tổng số lượng sản phẩm
 * Phương thức: GET
 * Đường dẫn: /products/count
 * Lưu ý: Route này phải được định nghĩa trước /:id để 'count' không bị coi là id
 */
router.get('/count', async (req, res) => {
    try {
        // Gọi model để lấy tổng số sản phẩm
        const count = await productModel.getProductsCount();
        res.json({ count });
    } catch (err) {
        res.status(500).json({ error: 'Failed to get products count' });
    }
});

/**
 * Route lấy danh sách thương hiệu duy nhất
 * Phương thức: GET
 * Đường dẫn: /products/brands
 * Trong production cần xác thực
 */
router.get('/brands', async (req, res) => {
    try {
        const brands = await productModel.getUniqueBrands();
        res.json(brands);
    } catch (err) {
        res.status(500).json({ error: 'Failed to get brands' });
    }
});

/**
 * Route lấy thông tin một sản phẩm theo ID
 * Phương thức: GET
 * Đường dẫn: /products/:id
 */
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

/**
 * Route tạo sản phẩm mới
 * Phương thức: POST
 * Đường dẫn: /products
 * Body: { name, description, price, category, brand, supplierId, customId }
 */
router.post('/', async (req, res) => {
    try {
        const { name, description, price, category, brand, supplierId, customId } = req.body;
        const product = await productModel.createProduct(name, description, price, category, brand, supplierId, customId);
        res.status(201).json(product);
    } catch (err) {
        // Xử lý lỗi cụ thể từ model
        if (err.message === 'Mã sản phẩm đã tồn tại') {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).json({ error: 'Failed to create product: ' + err.message });
    }
});

/**
 * Route cập nhật thông tin sản phẩm
 * Phương thức: PUT
 * Đường dẫn: /products/:id
 * Body: { name, description, price, category, brand, supplierId, customId }
 */
router.put('/:id', async (req, res) => {
    try {
        const { name, description, price, category, brand, supplierId, customId } = req.body;
        const updates = { name, description, price, category, brand, supplierId, customId };
        const updatedProduct = await productModel.updateProduct(req.params.id, updates);
        res.json(updatedProduct);
    } catch (err) {
        // Xử lý lỗi cụ thể từ model
        if (err.message === 'Mã sản phẩm đã tồn tại') {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).json({ error: 'Failed to update product: ' + err.message });
    }
});

/**
 * Route xóa sản phẩm
 * Phương thức: DELETE
 * Đường dẫn: /products/:id
 */
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

/**
 * Route xuất danh sách sản phẩm ra file CSV
 * Phương thức: GET
 * Đường dẫn: /products/export
 * Query parameters: search, category, brand, supplier
 */
router.get('/export', async (req, res) => {
    try {
        // Lấy tham số bộ lọc từ query
        const { search, category, brand, supplier } = req.query;
        // Lấy tất cả sản phẩm (tối đa 1000) với bộ lọc
        const products = await productModel.getProducts(search, category, brand, supplier, 1, 1000);

        // Tạo header cho CSV với tiếng Việt
        const csvHeaders = ['ID', 'Tên sản phẩm', 'Mô tả', 'Giá', 'Danh mục', 'Thương hiệu', 'Nhà cung cấp', 'Số lượng', 'Ngày tạo'];
        let csvContent = csvHeaders.join(',') + '\n';

        // Thêm từng dòng dữ liệu sản phẩm
        products.products.forEach(product => {
            const row = [
                product.id,
                `"${product.name}"`,  // Bao bọc bằng dấu ngoặc để tránh lỗi với dấu phẩy
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

        // Thiết lập headers cho download CSV
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="products.csv"');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

        // Gửi file CSV với BOM để đảm bảo encoding UTF-8
        res.send('\ufeff' + csvContent);
    } catch (err) {
        console.error('Export error:', err);
        res.status(500).json({ error: 'Failed to export products' });
    }
});

// Route count trùng lặp - có thể xóa
router.get('/count', async (req, res) => {
    try {
        const count = await productModel.getProductsCount();
        res.json({ count });
    } catch (err) {
        res.status(500).json({ error: 'Failed to get products count' });
    }
});

// Lưu ý: '/brands' đã được định nghĩa trước '/:id' ở trên

// Xuất router
module.exports = router;