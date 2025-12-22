/**
 * File định nghĩa các route liên quan đến quản lý tồn kho (inventory)
 * Bao gồm xem tồn kho, giao dịch nhập/xuất, kiểm kê kho, và xuất báo cáo
 * Sử dụng các model inventory và inventory_transaction để tương tác với database
 */

// Import các module cần thiết
const express = require('express'); // Framework web để xây dựng API
const router = express.Router(); // Tạo instance router để định nghĩa routes
const sqlite3 = require('sqlite3').verbose(); // Thư viện SQLite3 để truy vấn database trực tiếp khi cần
const path = require('path'); // Module để xử lý đường dẫn file
const inventoryModel = require('../models/inventory'); // Model xử lý logic tồn kho
const inventoryTransactionModel = require('../models/inventory_transaction'); // Model xử lý giao dịch kho

// Khởi tạo kết nối database SQLite
const db = new sqlite3.Database(path.join(__dirname, '../database.db'), (err) => {
    if (err) {
        // Ghi log lỗi nếu không thể kết nối database
        console.error('Could not connect to database:', err.message);
    }
});

/**
 * Route lấy danh sách tồn kho tất cả sản phẩm
 * Phương thức: GET
 * Đường dẫn: /inventory
 * Query parameters: warehouse (tùy chọn) - lọc theo kho
 * Trả về: Danh sách các mục tồn kho với thông tin sản phẩm
 */
router.get('/', async (req, res) => {
    try {
        // Lấy tham số warehouse từ query string (nếu có)
        const { warehouse } = req.query;

        // Xây dựng câu truy vấn cơ bản lấy tồn kho và thông tin sản phẩm
        let query = `
            SELECT i.id, i.product_id, p.custom_id, p.name as product_name, i.quantity, i.warehouse_id
            FROM inventory i
            JOIN products p ON i.product_id = p.custom_id
        `;
        const params = []; // Mảng chứa các tham số cho câu truy vấn

        // Nếu có tham số warehouse, thêm điều kiện lọc
        if (warehouse) {
            query += ' WHERE i.warehouse_id = ?';
            params.push(warehouse);
        }

        // Thực hiện truy vấn database
        const inventory = await new Promise((resolve, reject) => {
            db.all(query, params, (err, rows) => {
                if (err) reject(err); // Nếu có lỗi, reject promise
                else resolve(rows || []); // Trả về mảng kết quả hoặc mảng rỗng
            });
        });

        // Nếu không có dữ liệu tồn kho, trả về mảng rỗng
        if (!inventory || inventory.length === 0) {
            return res.json([]);
        }

        // Trả về danh sách tồn kho
        res.json(inventory);
    } catch (err) {
        // Trả về lỗi 500 nếu có lỗi trong quá trình xử lý
        res.status(500).json({ error: 'Failed to get inventory' });
    }
});

/**
 * Route lấy danh sách giao dịch tồn kho với phân trang
 * Phương thức: GET
 * Đường dẫn: /inventory/transactions
 * Query parameters:
 * - page: trang hiện tại (mặc định 1)
 * - limit: số bản ghi mỗi trang (mặc định 10, tối đa 100)
 * - type: loại giao dịch ('nhap' hoặc 'xuat')
 * - warehouseId: ID kho để lọc
 * - startDate, endDate: khoảng thời gian
 * - search: từ khóa tìm kiếm
 */
router.get('/transactions', async (req, res) => {
    try {
        // Lấy các tham số từ query string với giá trị mặc định
        const { page = 1, limit = 10, type, warehouseId, startDate, endDate, search } = req.query;
        const pageNum = parseInt(page); // Chuyển đổi sang số nguyên
        const limitNum = parseInt(limit);

        // Kiểm tra tính hợp lệ của tham số page
        if (isNaN(pageNum) || pageNum < 1) {
            return res.status(400).json({ error: 'Invalid page parameter' });
        }
        // Kiểm tra tính hợp lệ của tham số limit (1-100)
        if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
            return res.status(400).json({ error: 'Invalid limit parameter (must be between 1 and 100)' });
        }

        // Gọi hàm model để lấy giao dịch với phân trang và bộ lọc
        const result = await inventoryTransactionModel.getTransactionsPaginated(pageNum, limitNum, type, warehouseId, startDate, endDate, search);

        // Trả về kết quả
        res.json(result);
    } catch (err) {
        // Trả về lỗi 500 nếu có lỗi
        res.status(500).json({ error: 'Failed to get transactions' });
    }
});

/**
 * Route lấy thông tin tồn kho của một sản phẩm cụ thể
 * Phương thức: GET
 * Đường dẫn: /inventory/:productId
 * Query parameters: warehouse (bắt buộc) - ID của kho
 * Trả về: Thông tin tồn kho của sản phẩm trong kho được chỉ định
 */
router.get('/:productId', async (req, res) => {
    try {
        // Lấy tham số warehouse từ query string
        const { warehouse } = req.query;

        // Kiểm tra tham số warehouse bắt buộc
        if (!warehouse) {
            return res.status(400).json({ error: 'Warehouse parameter is required' });
        }

        // Gọi hàm model để lấy tồn kho theo product ID và warehouse
        const inventory = await inventoryModel.getInventoryByProductId(req.params.productId, warehouse);

        // Nếu không tìm thấy tồn kho, trả về số lượng 0
        if (!inventory) {
            return res.json({ quantity: 0 });
        }

        // Trả về thông tin tồn kho
        res.json(inventory);
    } catch (err) {
        // Trả về lỗi 500 nếu có lỗi
        res.status(500).json({ error: 'Failed to get inventory' });
    }
});





/**
 * Route xử lý nhập hàng vào kho (bulk import)
 * Phương thức: POST
 * Đường dẫn: /inventory/import
 * Body: { warehouse_id, supplier_id, products: [{product_id, quantity}] }
 * Tạo giao dịch nhập hàng cho nhiều sản phẩm cùng lúc, kiểm tra sức chứa kho
 */
router.post('/import', async (req, res) => {
    try {
        // Lấy dữ liệu từ request body
        const { warehouse_id, supplier_id, products } = req.body;

        // Kiểm tra tính hợp lệ của dữ liệu đầu vào
        if (!warehouse_id || !supplier_id || !products || !Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ error: 'warehouse_id, supplier_id, and a non-empty array of products are required' });
        }

        // Lấy thông tin kho để kiểm tra sức chứa
        const warehouse = await new Promise((resolve, reject) => {
            db.get('SELECT capacity, current_usage FROM warehouses WHERE custom_id = ?', [warehouse_id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        // Nếu không tìm thấy kho, trả về lỗi
        if (!warehouse) {
            return res.status(400).json({ error: 'Warehouse not found' });
        }

        // Tính tổng số lượng sản phẩm cần nhập
        let totalNewQuantity = 0;
        for (const product of products) {
            const quantityNum = parseInt(product.quantity);
            // Kiểm tra tính hợp lệ của từng sản phẩm
            if (!product.product_id || isNaN(quantityNum) || quantityNum <= 0) {
                return res.status(400).json({ error: 'Invalid product data in the products array' });
            }
            totalNewQuantity += quantityNum; // Cộng dồn tổng số lượng
        }

        // Kiểm tra xem việc nhập hàng có vượt quá sức chứa kho không
        if (warehouse.current_usage + totalNewQuantity > warehouse.capacity) {
            return res.status(400).json({
                error: `Cannot import. Warehouse capacity exceeded. Current usage: ${warehouse.current_usage}, Capacity: ${warehouse.capacity}, Trying to add: ${totalNewQuantity}`
            });
        }

        // Bắt đầu transaction để đảm bảo tính toàn vẹn dữ liệu
        await new Promise((resolve, reject) => {
            db.run('BEGIN TRANSACTION', err => err ? reject(err) : resolve());
        });

        // Tạo ID tham chiếu duy nhất cho batch import này
        const referenceId = `TXN${Date.now()}`;

        // Xử lý từng sản phẩm trong danh sách
        for (const product of products) {
            const { product_id, quantity } = product;
            const quantityNum = parseInt(quantity);

            // Thêm sản phẩm vào tồn kho (đã kiểm tra validation ở trên)
            await inventoryModel.addInventoryItem(product_id, quantityNum, String(warehouse_id));

            // Tạo bản ghi giao dịch nhập hàng
            await inventoryTransactionModel.createTransaction(
                referenceId, // ID tham chiếu
                product_id, // ID sản phẩm
                String(warehouse_id), // ID kho
                quantityNum, // Số lượng
                'nhap', // Loại giao dịch
                supplier_id, // ID nhà cung cấp
                null, // Không có khách hàng (vì là nhập)
                `Part of bulk import ${referenceId}` // Ghi chú
            );
        }

        // Commit transaction nếu tất cả thành công
        await new Promise((resolve, reject) => {
            db.run('COMMIT', err => err ? reject(err) : resolve());
        });

        // Trả về thành công với ID tham chiếu
        res.status(201).json({ message: 'Bulk import successful', reference_id: referenceId });

    } catch (err) {
        // Nếu có lỗi, rollback transaction để hoàn tác các thay đổi
        await new Promise((resolve, reject) => {
            db.run('ROLLBACK', error => error ? reject(error) : resolve());
        });

        // Ghi log lỗi và trả về lỗi server
        console.error('Bulk import error:', err);
        res.status(500).json({ error: 'Failed to process bulk import' });
    }
});

/**
 * Route xử lý xuất hàng từ kho (bulk export)
 * Phương thức: POST
 * Đường dẫn: /inventory/export
 * Body: { warehouse_id, customer_name, products: [{product_id, quantity}] }
 * Tạo giao dịch xuất hàng, kiểm tra tồn kho trước khi xuất
 */
router.post('/export', async (req, res) => {
    try {
        // Lấy dữ liệu từ request body
        const { warehouse_id, customer_name, products } = req.body;

        // Kiểm tra tính hợp lệ của dữ liệu đầu vào
        if (!warehouse_id || !customer_name || !products || !Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ error: 'warehouse_id, customer_name, and a non-empty array of products are required' });
        }

        // Bắt đầu transaction
        await new Promise((resolve, reject) => {
            db.run('BEGIN TRANSACTION', err => err ? reject(err) : resolve());
        });

        // Tạo ID tham chiếu duy nhất
        const referenceId = `TXN${Date.now()}`;

        // Xử lý từng sản phẩm trong danh sách
        for (const product of products) {
            const { product_id, quantity } = product;
            const quantityNum = parseInt(quantity);

            // Kiểm tra tính hợp lệ của dữ liệu sản phẩm
            if (!product_id || isNaN(quantityNum) || quantityNum <= 0) {
                await db.run('ROLLBACK'); // Rollback nếu có lỗi
                return res.status(400).json({ error: 'Invalid product data in the products array' });
            }

            // Kiểm tra tồn kho hiện tại
            const currentInventory = await inventoryModel.getInventoryByProductId(product_id, String(warehouse_id));
            if (!currentInventory || currentInventory.quantity < quantityNum) {
                await db.run('ROLLBACK'); // Rollback nếu không đủ hàng
                return res.status(400).json({ error: `Insufficient stock for product ${product_id}. Current: ${currentInventory ? currentInventory.quantity : 0}, Requested: ${quantityNum}` });
            }

            // Cập nhật số lượng tồn kho (giảm)
            await inventoryModel.updateInventoryQuantity(product_id, -quantityNum, String(warehouse_id));

            // Tạo bản ghi giao dịch xuất hàng
            await inventoryTransactionModel.createTransaction(
                referenceId,
                product_id,
                String(warehouse_id),
                quantityNum,
                'xuat', // Loại giao dịch xuất
                null, // Không có supplier (vì là xuất)
                customer_name, // Tên khách hàng
                `Part of bulk export ${referenceId}`
            );
        }

        // Commit transaction
        await new Promise((resolve, reject) => {
            db.run('COMMIT', err => err ? reject(err) : resolve());
        });

        // Trả về thành công
        res.status(201).json({ message: 'Bulk export successful', reference_id: referenceId });

    } catch (err) {
        // Rollback nếu có lỗi
        await new Promise((resolve, reject) => {
            db.run('ROLLBACK', error => error ? reject(error) : resolve());
        });

        // Ghi log và trả về lỗi
        console.error('Bulk export error:', err);
        res.status(500).json({ error: 'Failed to process bulk export' });
    }
});


/**
 * Route xuất tất cả giao dịch tồn kho ra file CSV
 * Phương thức: GET
 * Đường dẫn: /inventory/transactions/export
 * Trả về: File CSV chứa danh sách giao dịch để tải xuống
 */
router.get('/transactions/export', async (req, res) => {
    try {
        // Lấy tất cả giao dịch từ model
        // Lưu ý: Có thể cần điều chỉnh nếu dataset quá lớn
        const allTransactions = await inventoryTransactionModel.getTransactions();

        // Nếu không có giao dịch nào, trả về file CSV với chỉ header
        if (!allTransactions || allTransactions.length === 0) {
            const headers = [
                'ID', 'Product ID', 'Product Name', 'Warehouse ID', 'Warehouse Name',
                'Quantity', 'Type', 'Supplier ID', 'Customer Name', 'Notes', 'Transaction Date'
            ];
            const csvString = headers.join(',') + '\n';

            // Thiết lập header cho download CSV
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="transactions_${new Date().toISOString().slice(0, 10)}.csv"`);
            return res.status(200).send(csvString);
        }

        // Chuẩn bị nội dung CSV với headers
        const headers = [
            'ID', 'Product ID', 'Product Name', 'Warehouse ID', 'Warehouse Name',
            'Quantity', 'Type', 'Supplier ID', 'Customer Name', 'Notes', 'Transaction Date'
        ];

        const csvRows = [headers.join(',')];

        // Thêm từng dòng dữ liệu vào CSV
        allTransactions.forEach(t => {
            const row = [
                t.reference_id,
                t.product_id,
                `"${t.product_name.replace(/"/g, '""')}"`, // Escape dấu ngoặc kép
                t.warehouse_id,
                `"${t.warehouse_name.replace(/"/g, '""')}"`,
                t.quantity,
                t.type,
                t.supplier_id || '',
                `"${(t.customer_name || '').replace(/"/g, '""')}"`, // Xử lý null customer_name
                `"${(t.notes || '').replace(/"/g, '""')}"`, // Xử lý null notes
                new Date(t.transaction_date).toISOString() // Sử dụng định dạng ISO cho ngày
            ];
            csvRows.push(row.join(','));
        });

        // Tạo chuỗi CSV hoàn chỉnh
        const csvString = csvRows.join('\n');

        // Thiết lập headers cho download file CSV
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="transactions_${new Date().toISOString().slice(0, 10)}.csv"`);

        // Gửi file CSV
        res.status(200).send(csvString);

    } catch (err) {
        // Ghi log lỗi và trả về lỗi server
        console.error('Error exporting transactions to CSV:', err);
        res.status(500).json({ error: 'Failed to export transactions' });
    }
});











        const csvString = csvRows.join('\n');











        // Set response headers for CSV download





        res.setHeader('Content-Type', 'text/csv');





        res.setHeader('Content-Disposition', `attachment; filename="transactions_${new Date().toISOString().slice(0, 10)}.csv"`);











        res.status(200).send(csvString);











    } catch (err) {





        console.error('Error exporting transactions to CSV:', err);





        res.status(500).json({ error: 'Failed to export transactions' });





    }





});





// POST create inventory audit with items


router.post('/audits', async (req, res) => {


    try {


        const { code, date, warehouse_id, notes, items } = req.body;


        const created_by_user_id = req.user.id; // Get user ID from authenticated user





        if (!code || !date || !warehouse_id || !created_by_user_id) {


            return res.status(400).json({ error: 'Missing required fields' });


        }





        if (!items || items.length === 0) {


            return res.status(400).json({ error: 'At least one item is required' });


        }





        // Calculate total discrepancy


        let totalDiscrepancy = 0;


        items.forEach(item => {


            totalDiscrepancy += (item.system_quantity - item.actual_quantity);


        });





        // Create audit


        const audit = await new Promise((resolve, reject) => {


            db.run(


                `INSERT INTO audits (code, date, warehouse_id, created_by_user_id, discrepancy, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`,


                [code, date, warehouse_id, created_by_user_id, totalDiscrepancy, 'pending', notes],


                function (err) {


                    if (err) reject(err);


                    else resolve({ id: this.lastID, code, date, warehouse_id, created_by_user_id, discrepancy: totalDiscrepancy, status: 'pending', notes });


                }


            );


        });





        // Insert audit items


        for (const item of items) {


            await new Promise((resolve, reject) => {


                const discrepancy = item.system_quantity - item.actual_quantity;


                db.run(


                    `INSERT INTO audit_items (audit_id, product_id, system_quantity, actual_quantity, discrepancy, notes) 


                     VALUES (?, ?, ?, ?, ?, ?)`,


                    [audit.id, item.product_id, item.system_quantity, item.actual_quantity, discrepancy, item.notes || ''],


                    function (err) {


                        if (err) reject(err);


                        else resolve();


                    }


                );


            });


        }





        res.status(201).json({ ...audit, items });


    } catch (err) {


        console.error('Error creating inventory audit:', err);


        res.status(500).json({ error: 'Failed to create inventory audit' });


    }


});





// GET a single inventory audit by ID with items


router.get('/audits/:id', async (req, res) => {


    try {


        const { id } = req.params;


        const audit = await new Promise((resolve, reject) => {


            const query = `


                SELECT a.id, a.code, a.date, a.discrepancy, a.status, a.notes,


                       w.name as warehouse_name, u.username as created_by_username


                FROM audits a


                JOIN warehouses w ON a.warehouse_id = w.id


                JOIN users u ON a.created_by_user_id = u.id


                WHERE a.id = ?


            `;


            db.get(query, [id], (err, row) => {


                if (err) reject(err);


                else resolve(row);


            });


        });





        if (!audit) {


            return res.status(404).json({ error: 'Audit not found' });


        }





        // Get audit items


        const items = await new Promise((resolve, reject) => {


            const query = `


                SELECT ai.id, ai.product_id, p.name as product_name, 


                       ai.system_quantity, ai.actual_quantity, ai.discrepancy, ai.notes


                FROM audit_items ai


                JOIN products p ON ai.product_id = p.custom_id


                WHERE ai.audit_id = ?


            `;


            db.all(query, [id], (err, rows) => {


                if (err) reject(err);


                else resolve(rows || []);


            });


        });





        res.json({ ...audit, items });


    } catch (err) {


        console.error('Error getting inventory audit:', err);


        res.status(500).json({ error: 'Failed to get inventory audit' });


    }


});





// DELETE inventory audit


router.delete('/audits/:id', async (req, res) => {


    try {


        const { id } = req.params;


        const result = await new Promise((resolve, reject) => {


            db.run('DELETE FROM audits WHERE id = ?', [id], function(err) {


                if (err) reject(err);


                // this.changes returns the number of rows affected.


                else resolve(this.changes);


            });


        });





        if (result === 0) {


            return res.status(404).json({ error: 'Audit not found' });


        }





        res.json({ message: 'Audit deleted successfully' });


    } catch (err) {


        console.error('Error deleting inventory audit:', err);


        res.status(500).json({ error: 'Failed to delete inventory audit' });


    }


});





// Xuất router để sử dụng trong ứng dụng chính
module.exports = router;