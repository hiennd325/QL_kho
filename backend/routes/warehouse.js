/**
 * File định nghĩa các route quản lý kho bãi (warehouses)
 * Bao gồm: lấy danh sách, tạo, cập nhật, xóa kho, và lấy sản phẩm trong kho
 */

// Import các module cần thiết
const express = require('express'); // Framework web
const router = express.Router(); // Tạo router instance
const warehouseModel = require('../models/warehouse'); // Model xử lý logic kho

/**
 * Route lấy danh sách tất cả kho bãi
 * Phương thức: GET
 * Đường dẫn: /warehouses
 */
router.get('/', async (req, res) => {
    try {
        const warehouses = await warehouseModel.getWarehouses();
        res.json(warehouses);
    } catch (err) {
        res.status(500).json({ error: 'Failed to get warehouses' });
    }
});

/**
 * Route lấy tổng số lượng kho bãi
 * Phương thức: GET
 * Đường dẫn: /warehouses/count
 * Lưu ý: Route này phải được định nghĩa trước /:custom_id
 */
router.get('/count', async (req, res) => {
    try {
        const count = await warehouseModel.getWarehousesCount();
        res.json({ count });
    } catch (err) {
        res.status(500).json({ error: 'Failed to get warehouses count' });
    }
});

/**
 * Route lấy thông tin một kho bãi theo custom_id
 * Phương thức: GET
 * Đường dẫn: /warehouses/:custom_id
 */
router.get('/:custom_id', async (req, res) => {
    try {
        const warehouse = await warehouseModel.getWarehouseById(req.params.custom_id);
        if (!warehouse) {
            return res.status(404).json({ error: 'Warehouse not found' });
        }
        res.json(warehouse);
    } catch (err) {
        res.status(500).json({ error: 'Failed to get warehouse' });
    }
});

/**
 * Route tạo kho bãi mới
 * Phương thức: POST
 * Đường dẫn: /warehouses
 * Body: { custom_id, name, location, capacity }
 */
router.post('/', async (req, res) => {
    try {
        const { custom_id, name, location, capacity } = req.body;
        const warehouse = await warehouseModel.createWarehouse(name, location, capacity, custom_id);
        res.status(201).json(warehouse);
    } catch (err) {
        // Xử lý lỗi trùng mã kho
        if (err.message === 'Mã kho đã tồn tại') {
            res.status(400).json({ error: err.message });
        } else {
            res.status(500).json({ error: 'Failed to create warehouse' });
        }
    }
});

/**
 * Route cập nhật thông tin kho bãi
 * Phương thức: PUT
 * Đường dẫn: /warehouses/:custom_id
 * Body: { name?, location?, capacity? }
 */
router.put('/:custom_id', async (req, res) => {
    try {
        const updates = req.body;
        const updatedWarehouse = await warehouseModel.updateWarehouse(req.params.custom_id, updates);
        res.json(updatedWarehouse);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update warehouse' });
    }
});

/**
 * Route lấy danh sách sản phẩm trong một kho bãi
 * Phương thức: GET
 * Đường dẫn: /warehouses/:custom_id/products
 */
router.get('/:custom_id/products', async (req, res) => {
    try {
        const products = await warehouseModel.getWarehouseProducts(req.params.custom_id);
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: 'Failed to get warehouse products' });
    }
});

/**
 * Route xóa kho bãi
 * Phương thức: DELETE
 * Đường dẫn: /warehouses/:custom_id
 */
router.delete('/:custom_id', async (req, res) => {
    try {
        const result = await warehouseModel.deleteWarehouse(req.params.custom_id);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete warehouse' });
    }
});

// Route count trùng lặp - có thể xóa
router.get('/count', async (req, res) => {
    try {
        const count = await warehouseModel.getWarehousesCount();
        res.json({ count });
    } catch (err) {
        res.status(500).json({ error: 'Failed to get warehouses count' });
    }
});

// Xuất router
module.exports = router;