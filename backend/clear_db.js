const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Kết nối đến cơ sở dữ liệu SQLite
const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Could not connect to database:', err.message);
        process.exit(1);
    } else {
        console.log('Connected to SQLite database.');
    }
});

// Danh sách các bảng cần xóa dữ liệu (theo thứ tự để tránh lỗi foreign key constraint)
const tables = [
    'audits',
    'sales_order_items',
    'sales_orders',
    'transfers',
    'inventory_transactions',
    'order_items',
    'orders',
    'inventory',
    'products',
    'suppliers',
    'warehouses',
    'users'
];

// Hàm xóa dữ liệu từ một bảng
function clearTable(tableName, callback) {
    db.run(`DELETE FROM ${tableName}`, function(err) {
        if (err) {
            console.error(`Error clearing table ${tableName}:`, err.message);
            callback(err);
        } else {
            console.log(`Cleared table ${tableName}. Rows affected: ${this.changes}`);
            callback(null);
        }
    });
}

// Hàm đặt lại giá trị auto increment
function resetAutoIncrement(tableName, callback) {
    db.run(`DELETE FROM sqlite_sequence WHERE name='${tableName}'`, function(err) {
        if (err) {
            console.error(`Error resetting auto increment for ${tableName}:`, err.message);
            callback(err);
        } else {
            console.log(`Reset auto increment for table ${tableName}`);
            callback(null);
        }
    });
}

// Thực hiện xóa dữ liệu từ tất cả các bảng
let currentIndex = 0;

function clearNextTable() {
    if (currentIndex < tables.length) {
        const tableName = tables[currentIndex];
        clearTable(tableName, (err) => {
            if (err) {
                db.close();
                process.exit(1);
            }
            
            resetAutoIncrement(tableName, (err) => {
                if (err) {
                    db.close();
                    process.exit(1);
                }
                
                currentIndex++;
                clearNextTable();
            });
        });
    } else {
        console.log('All tables cleared successfully.');
        db.close((err) => {
            if (err) {
                console.error('Error closing database:', err.message);
            } else {
                console.log('Database connection closed.');
            }
            process.exit(0);
        });
    }
}

console.log('Starting to clear all database tables...');
clearNextTable();