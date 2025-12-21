const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const inventoryModel = require('../models/inventory');
const inventoryTransactionModel = require('../models/inventory_transaction');

const db = new sqlite3.Database(path.join(__dirname, '../database.db'), (err) => {
    if (err) {
        console.error('Could not connect to database:', err.message);
    }
});

// Get all inventory items (with product details)
router.get('/', async (req, res) => {
    try {
        const { warehouse } = req.query;
        let query = `
            SELECT i.id, i.product_id, p.custom_id, p.name as product_name, i.quantity, i.warehouse_id
            FROM inventory i
            JOIN products p ON i.product_id = p.custom_id
        `;
        const params = [];

        if (warehouse) {
            query += ' WHERE i.warehouse_id = ?';
            params.push(warehouse);
        }

        const inventory = await new Promise((resolve, reject) => {
            db.all(query, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });

        if (!inventory || inventory.length === 0) {
            return res.json([]);
        }
        res.json(inventory);
    } catch (err) {
        res.status(500).json({ error: 'Failed to get inventory' });
    }
});

// Temporarily remove authenticate for testing
router.get('/transactions', async (req, res) => {
    try {
        const { page = 1, limit = 10, type, warehouseId, startDate, endDate, search } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        // Validate page and limit
        if (isNaN(pageNum) || pageNum < 1) {
            return res.status(400).json({ error: 'Invalid page parameter' });
        }
        if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
            return res.status(400).json({ error: 'Invalid limit parameter (must be between 1 and 100)' });
        }

        const result = await inventoryTransactionModel.getTransactionsPaginated(pageNum, limitNum, type, warehouseId, startDate, endDate, search);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: 'Failed to get transactions' });
    }
});

// Get inventory for a specific product
router.get('/:productId', async (req, res) => {
    try {
        const { warehouse } = req.query;
        if (!warehouse) {
            return res.status(400).json({ error: 'Warehouse parameter is required' });
        }
        const inventory = await inventoryModel.getInventoryByProductId(req.params.productId, warehouse);
        if (!inventory) {
            return res.json({ quantity: 0 }); // Return 0 if no inventory found
        }
        res.json(inventory);
    } catch (err) {
        res.status(500).json({ error: 'Failed to get inventory' });
    }
});





// Add a new inventory transaction (import or export)

router.post('/import', async (req, res) => {
    try {
        const { warehouse_id, supplier_id, products } = req.body;

        if (!warehouse_id || !supplier_id || !products || !Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ error: 'warehouse_id, supplier_id, and a non-empty array of products are required' });
        }

        // Get warehouse info to check capacity
        const warehouse = await new Promise((resolve, reject) => {
            db.get('SELECT capacity, current_usage FROM warehouses WHERE custom_id = ?', [warehouse_id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (!warehouse) {
            return res.status(400).json({ error: 'Warehouse not found' });
        }

        // Calculate total quantity to be added
        let totalNewQuantity = 0;
        for (const product of products) {
            const quantityNum = parseInt(product.quantity);
            if (!product.product_id || isNaN(quantityNum) || quantityNum <= 0) {
                return res.status(400).json({ error: 'Invalid product data in the products array' });
            }
            totalNewQuantity += quantityNum;
        }

        // Check if adding this quantity would exceed warehouse capacity
        if (warehouse.current_usage + totalNewQuantity > warehouse.capacity) {
            return res.status(400).json({
                error: `Cannot import. Warehouse capacity exceeded. Current usage: ${warehouse.current_usage}, Capacity: ${warehouse.capacity}, Trying to add: ${totalNewQuantity}`
            });
        }

        await new Promise((resolve, reject) => {
            db.run('BEGIN TRANSACTION', err => err ? reject(err) : resolve());
        });

        const referenceId = `TXN${Date.now()}`;

        for (const product of products) {
            const { product_id, quantity } = product;
            const quantityNum = parseInt(quantity);

            // Validation already done above, just add
            await inventoryModel.addInventoryItem(product_id, quantityNum, String(warehouse_id));
            await inventoryTransactionModel.createTransaction(
                referenceId,
                product_id,
                String(warehouse_id),
                quantityNum,
                'nhap',
                supplier_id,
                null,
                `Part of bulk import ${referenceId}`
            );
        }

        await new Promise((resolve, reject) => {
            db.run('COMMIT', err => err ? reject(err) : resolve());
        });

        res.status(201).json({ message: 'Bulk import successful', reference_id: referenceId });

    } catch (err) {
        await new Promise((resolve, reject) => {
            db.run('ROLLBACK', error => error ? reject(error) : resolve());
        });
        console.error('Bulk import error:', err);
        res.status(500).json({ error: 'Failed to process bulk import' });
    }
});

router.post('/export', async (req, res) => {
    try {
        const { warehouse_id, customer_name, products } = req.body;

        if (!warehouse_id || !customer_name || !products || !Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ error: 'warehouse_id, customer_name, and a non-empty array of products are required' });
        }

        await new Promise((resolve, reject) => {
            db.run('BEGIN TRANSACTION', err => err ? reject(err) : resolve());
        });

        const referenceId = `TXN${Date.now()}`;

        for (const product of products) {
            const { product_id, quantity } = product;
            const quantityNum = parseInt(quantity);

            if (!product_id || isNaN(quantityNum) || quantityNum <= 0) {
                await db.run('ROLLBACK');
                return res.status(400).json({ error: 'Invalid product data in the products array' });
            }

            const currentInventory = await inventoryModel.getInventoryByProductId(product_id, String(warehouse_id));
            if (!currentInventory || currentInventory.quantity < quantityNum) {
                await db.run('ROLLBACK');
                return res.status(400).json({ error: `Insufficient stock for product ${product_id}. Current: ${currentInventory ? currentInventory.quantity : 0}, Requested: ${quantityNum}` });
            }

            await inventoryModel.updateInventoryQuantity(product_id, -quantityNum, String(warehouse_id));
            await inventoryTransactionModel.createTransaction(
                referenceId,
                product_id,
                String(warehouse_id),
                quantityNum,
                'xuat',
                null,
                customer_name,
                `Part of bulk export ${referenceId}`
            );
        }

        await new Promise((resolve, reject) => {
            db.run('COMMIT', err => err ? reject(err) : resolve());
        });

        res.status(201).json({ message: 'Bulk export successful', reference_id: referenceId });

    } catch (err) {
        await new Promise((resolve, reject) => {
            db.run('ROLLBACK', error => error ? reject(error) : resolve());
        });
        console.error('Bulk export error:', err);
        res.status(500).json({ error: 'Failed to process bulk export' });
    }
});


// Export all inventory transactions to CSV





router.get('/transactions/export', async (req, res) => {





    try {





        // Fetch all transactions using getTransactions from the model





        // Note: This might need adjustment if the dataset is very large.





        // For now, assume we can fetch all for export.





        const allTransactions = await inventoryTransactionModel.getTransactions(); 











        if (!allTransactions || allTransactions.length === 0) {
            // Return empty CSV with headers when no transactions exist
            const headers = [
                'ID', 'Product ID', 'Product Name', 'Warehouse ID', 'Warehouse Name',
                'Quantity', 'Type', 'Supplier ID', 'Customer Name', 'Notes', 'Transaction Date'
            ];
            const csvString = headers.join(',') + '\n';

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="transactions_${new Date().toISOString().slice(0, 10)}.csv"`);
            return res.status(200).send(csvString);
        }











        // Prepare CSV content





        const headers = [





            'ID', 'Product ID', 'Product Name', 'Warehouse ID', 'Warehouse Name',





            'Quantity', 'Type', 'Supplier ID', 'Customer Name', 'Notes', 'Transaction Date'





        ];





        const csvRows = [headers.join(',')];











        allTransactions.forEach(t => {





            const row = [





                t.reference_id,





                t.product_id,





                `"${t.product_name.replace(/"/g, '""')}"`, // Escape double quotes





                t.warehouse_id,





                `"${t.warehouse_name.replace(/"/g, '""')}"`,





                t.quantity,





                t.type,





                t.supplier_id || '',





                `"${(t.customer_name || '').replace(/"/g, '""')}"`, // Handle null customer_name





                `"${(t.notes || '').replace(/"/g, '""')}"`, // Handle null notes





                new Date(t.transaction_date).toISOString() // Use ISO format for dates





            ];





            csvRows.push(row.join(','));





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





module.exports = router;