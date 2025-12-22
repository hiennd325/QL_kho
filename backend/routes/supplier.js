/**
 * File định nghĩa các route CRUD cho quản lý nhà cung cấp (suppliers)
 * Bao gồm: lấy danh sách, tạo, cập nhật, xóa nhà cung cấp, và lấy top suppliers
 */

// Import các module cần thiết
const express = require('express'); // Framework web
const router = express.Router(); // Tạo router instance
const supplierModel = require('../models/supplier'); // Model xử lý logic nhà cung cấp

/**
 * Route lấy danh sách tất cả nhà cung cấp
 * Phương thức: GET
 * Đường dẫn: /suppliers
 * Query parameters: search (tùy chọn) - tìm kiếm theo tên
 */
router.get('/', async (req, res) => {
    try {
        const { search } = req.query;
        const suppliers = await supplierModel.getSuppliers(search);
        res.json(suppliers);
    } catch (err) {
        res.status(500).json({ error: 'Failed to get suppliers' });
    }
});

/**
 * Route lấy tổng số lượng nhà cung cấp
 * Phương thức: GET
 * Đường dẫn: /suppliers/count
 * Lưu ý: Route này phải được định nghĩa trước /:id
 */
router.get('/count', async (req, res) => {
    try {
        const count = await supplierModel.getSuppliersCount();
        res.json({ count });
    } catch (err) {
        res.status(500).json({ error: 'Failed to get suppliers count' });
    }
});

/**
 * Route lấy thông tin một nhà cung cấp theo ID
 * Phương thức: GET
 * Đường dẫn: /suppliers/:id
 */
router.get('/:id', async (req, res) => {
    try {
        const supplier = await supplierModel.getSupplierById(req.params.id);
        if (!supplier) {
            return res.status(404).json({ error: 'Supplier not found' });
        }
        res.json(supplier);
    } catch (err) {
        res.status(500).json({ error: 'Failed to get supplier' });
    }
});

/**
 * Route tạo nhà cung cấp mới
 * Phương thức: POST
 * Đường dẫn: /suppliers
 * Body: { code, name, phone?, email?, address? }
 * Validate: code bắt buộc, phone phải 10 số, email đúng định dạng
 */
router.post('/', async (req, res) => {
    try {
        const { code, name, phone, email, address } = req.body;

        // Kiểm tra mã nhà cung cấp bắt buộc
        if (!code) {
            return res.status(400).json({ error: 'Mã nhà cung cấp là bắt buộc' });
        }

        // Validate số điện thoại nếu có
        if (phone) {
            const phoneRegex = /^\d{10}$/;
            if (!phoneRegex.test(phone)) {
                return res.status(400).json({ error: 'Số điện thoại phải là 10 chữ số.' });
            }
        }

        // Validate email nếu có
        if (email) {
            const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.com$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ error: 'Email phải có định dạng example@company.com' });
            }
        }

        // Tạo nhà cung cấp mới
        const supplier = await supplierModel.createSupplier(code, name, name, phone, email, address);
        res.status(201).json(supplier);
    } catch (err) {
        // Xử lý lỗi trùng mã
        if (err.message === 'Mã nhà cung cấp đã tồn tại') {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).json({ error: 'Failed to create supplier' });
    }
});

/**
 * Route cập nhật thông tin nhà cung cấp
 * Phương thức: PUT
 * Đường dẫn: /suppliers/:id
 * Body: { name?, phone?, email?, address?, code? }
 * Validate: phone 10 số, email đúng định dạng
 */
router.put('/:id', async (req, res) => {
    try {
        const updates = req.body;

        // Nếu cập nhật name, đồng thời cập nhật contact_person
        if (updates.name) {
            updates.contact_person = updates.name;
        }

        // Validate số điện thoại nếu có
        if (updates.phone) {
            const phoneRegex = /^\d{10}$/;
            if (!phoneRegex.test(updates.phone)) {
                return res.status(400).json({ error: 'Số điện thoại phải là 10 chữ số.' });
            }
        }

        // Validate email nếu có
        if (updates.email) {
            const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.com$/;
            if (!emailRegex.test(updates.email)) {
                return res.status(400).json({ error: 'Email phải có định dạng example@company.com' });
            }
        }

        // Cập nhật nhà cung cấp
        const updatedSupplier = await supplierModel.updateSupplier(req.params.id, updates);
        res.json(updatedSupplier);
    } catch (err) {
        // Xử lý lỗi trùng mã
        if (err.message === 'Mã nhà cung cấp đã tồn tại') {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).json({ error: 'Failed to update supplier' });
    }
});

/**
 * Route xóa nhà cung cấp
 * Phương thức: DELETE
 * Đường dẫn: /suppliers/:id
 */
router.delete('/:id', async (req, res) => {
    try {
        const result = await supplierModel.deleteSupplier(req.params.id);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete supplier' });
    }
});

/**
 * Route lấy top nhà cung cấp theo số lượng nhập hàng
 * Phương thức: GET
 * Đường dẫn: /suppliers/top
 * Query parameters: limit (mặc định 3)
 */
router.get('/top', async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : 3;
        const topSuppliers = await supplierModel.getTopSuppliers(limit);
        res.json(topSuppliers);
    } catch (err) {
        res.status(500).json({ error: 'Failed to get top suppliers' });
    }
});

// Route count trùng lặp - có thể xóa
router.get('/count', async (req, res) => {
    try {
        const count = await supplierModel.getSuppliersCount();
        res.json({ count });
    } catch (err) {
        res.status(500).json({ error: 'Failed to get suppliers count' });
    }
});

// Xuất router
module.exports = router;