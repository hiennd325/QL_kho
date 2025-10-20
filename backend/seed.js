const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

// Kết nối đến database
const db = new sqlite3.Database(path.join(__dirname, 'database.db'), (err) => {
    if (err) {
        console.error('Could not connect to database:', err.message);
        return;
    }
    console.log('Connected to SQLite database for seeding.');
});

// Hàm hash password
async function hashPassword(password) {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
}

// Dữ liệu giả
async function seedDatabase() {
    try {
        // 1. Tạo users
        console.log('Seeding users...');
        const hashedPassword = await hashPassword('password123');
        await runQuery(
            `INSERT OR IGNORE INTO users (username, password, role) VALUES
            ('admin', ?, 'admin'),
            ('staff1', ?, 'staff'),
            ('staff2', ?, 'staff'),
            ('manager', ?, 'manager')`,
            [hashedPassword, hashedPassword, hashedPassword, hashedPassword]
        );

        // 2. Tạo suppliers
        console.log('Seeding suppliers...');
        await runQuery(
            `INSERT OR IGNORE INTO suppliers (name, contact_person, phone, email, address) VALUES
            ('Công ty TNHH ABC', 'Nguyễn Văn A', '0123456789', 'contact@abc.com', '123 Đường ABC, Quận 1, TP.HCM'),
            ('Công ty CP XYZ', 'Trần Thị B', '0987654321', 'info@xyz.com', '456 Đường XYZ, Quận 2, TP.HCM'),
            ('Nhà cung cấp DEF', 'Lê Văn C', '0111111111', 'sales@def.com', '789 Đường DEF, Quận 3, TP.HCM'),
            ('Công ty Minh Long', 'Phạm Thị D', '0222222222', 'minhlong@company.com', '321 Đường Minh Long, Bình Dương')`
        );

        // 3. Tạo products
        console.log('Seeding products...');
        await runQuery(
            `INSERT OR IGNORE INTO products (name, description, price, category, brand, supplier_id) VALUES
            ('iPhone 15 Pro', 'Điện thoại thông minh cao cấp', 25000000, 'Điện tử', 'Apple', 1),
            ('Samsung Galaxy S24', 'Điện thoại Android flagship', 20000000, 'Điện tử', 'Samsung', 2),
            ('MacBook Air M3', 'Laptop siêu mỏng', 35000000, 'Điện tử', 'Apple', 1),
            ('Dell XPS 13', 'Laptop doanh nhân', 28000000, 'Điện tử', 'Dell', 3),
            ('Sony WH-1000XM5', 'Tai nghe chống ồn', 8000000, 'Âm thanh', 'Sony', 2),
            ('Logitech MX Master 3S', 'Chuột không dây', 2500000, 'Phụ kiện', 'Logitech', 4),
            ('Samsung 4K TV 55"', 'Smart TV 4K', 15000000, 'Điện tử', 'Samsung', 2),
            ('Nike Air Max', 'Giày thể thao', 4500000, 'Thời trang', 'Nike', 3),
            ('Adidas Ultraboost', 'Giày chạy bộ', 5200000, 'Thời trang', 'Adidas', 4),
            ('Rolex Submariner', 'Đồng hồ cao cấp', 150000000, 'Đồng hồ', 'Rolex', 1)`
        );

        // 4. Tạo warehouses
        console.log('Seeding warehouses...');
        await runQuery(
            `INSERT OR IGNORE INTO warehouses (name, location, capacity) VALUES
            ('Kho Trung Tâm', '123 Đường Công Nghiệp, Quận 9, TP.HCM', 10000),
            ('Kho Miền Bắc', '456 Đường Thương Mại, Hà Nội', 8000),
            ('Kho Miền Trung', '789 Đường Kinh Tế, Đà Nẵng', 6000),
            ('Kho Online', '321 Đường E-commerce, TP.HCM', 5000)`
        );

        // 5. Tạo inventory (tồn kho)
        console.log('Seeding inventory...');
        await runQuery(
            `INSERT OR IGNORE INTO inventory (product_id, warehouse_id, quantity) VALUES
            (1, 1, 50), (1, 2, 30), (1, 4, 20),
            (2, 1, 40), (2, 2, 25), (2, 3, 15),
            (3, 1, 20), (3, 4, 10),
            (4, 1, 35), (4, 2, 20), (4, 3, 15),
            (5, 1, 60), (5, 2, 40), (5, 4, 30),
            (6, 1, 80), (6, 2, 50), (6, 3, 30), (6, 4, 25),
            (7, 1, 15), (7, 3, 10),
            (8, 1, 100), (8, 2, 70), (8, 4, 50),
            (9, 1, 90), (9, 2, 60), (9, 3, 40),
            (10, 1, 5), (10, 4, 3)`
        );

        // 6. Tạo orders
        console.log('Seeding orders...');
        await runQuery(
            `INSERT OR IGNORE INTO orders (user_id, supplier_id, total_amount, status) VALUES
            (2, 1, 75000000, 'completed'),
            (3, 2, 60000000, 'pending'),
            (2, 3, 45000000, 'in_progress'),
            (4, 1, 125000000, 'completed'),
            (3, 4, 35000000, 'pending')`
        );

        // 7. Tạo order_items
        console.log('Seeding order items...');
        await runQuery(
            `INSERT OR IGNORE INTO order_items (order_id, product_id, quantity, price) VALUES
            (1, 1, 3, 25000000), (1, 3, 1, 35000000),
            (2, 2, 3, 20000000),
            (3, 4, 1, 28000000), (3, 5, 2, 8000000),
            (4, 1, 5, 25000000),
            (5, 6, 10, 2500000), (5, 8, 5, 4500000)`
        );

        // 8. Tạo inventory_transactions
        console.log('Seeding inventory transactions...');
        await runQuery(
            `INSERT OR IGNORE INTO inventory_transactions (product_id, warehouse_id, quantity, type) VALUES
            (1, 1, 10, 'nhap'), (1, 1, 5, 'xuat'),
            (2, 1, 15, 'nhap'), (2, 1, 8, 'xuat'),
            (3, 1, 5, 'nhap'), (3, 1, 2, 'xuat'),
            (4, 2, 12, 'nhap'), (4, 2, 6, 'xuat'),
            (5, 1, 20, 'nhap'), (5, 1, 10, 'xuat'),
            (6, 4, 25, 'nhap'), (6, 4, 15, 'xuat'),
            (7, 1, 8, 'nhap'), (7, 1, 4, 'xuat'),
            (8, 2, 30, 'nhap'), (8, 2, 20, 'xuat'),
            (9, 3, 18, 'nhap'), (9, 3, 12, 'xuat'),
            (10, 1, 2, 'nhap'), (10, 1, 1, 'xuat')`
        );

        // 9. Tạo transfers
        console.log('Seeding transfers...');
        await runQuery(
            `INSERT OR IGNORE INTO transfers (code, from_warehouse_id, to_warehouse_id, product_id, quantity, status, user_id, notes) VALUES
            ('TRF001', 1, 2, 1, 10, 'completed', 2, 'Điều chuyển iPhone từ kho trung tâm'),
            ('TRF002', 2, 1, 2, 8, 'in_progress', 3, 'Điều chuyển Samsung Galaxy'),
            ('TRF003', 1, 4, 5, 15, 'pending', 2, 'Tai nghe Sony cho kho online'),
            ('TRF004', 3, 1, 4, 5, 'completed', 4, 'Dell XPS từ Đà Nẵng về HCM'),
            ('TRF005', 2, 3, 6, 20, 'pending', 3, 'Chuột Logitech cho kho miền trung')`
        );

        // 10. Tạo audits
        console.log('Seeding audits...');
        await runQuery(
            `INSERT OR IGNORE INTO audits (code, date, warehouse_id, created_by_user_id, discrepancy, status, notes) VALUES
            ('KK20231015001', DATE('now', '-7 days'), 1, 1, 0, 'completed', 'Kiểm kê định kỳ hàng tuần'),
            ('KK20231016002', DATE('now', '-3 days'), 2, 2, -5, 'pending', 'Phát hiện chênh lệch 5 sản phẩm'),
            ('KK20231017003', DATE('now', '-1 day'), 1, 1, 2, 'pending', 'Kiểm kê đột xuất')`
        );

        console.log('Database seeding completed successfully!');

    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        db.close((err) => {
            if (err) {
                console.error('Error closing database:', err.message);
            } else {
                console.log('Database connection closed.');
            }
        });
    }
}

// Hàm helper để chạy query với promise
function runQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(this);
            }
        });
    });
}

// Export hàm seeding để có thể gọi từ app.js
module.exports = seedDatabase;

// Chạy seeding nếu file được chạy trực tiếp
if (require.main === module) {
    seedDatabase();
}