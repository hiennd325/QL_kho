const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'database.db'), (err) => {
    if (err) {
        console.error('Could not connect to database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

async function migrateSuppliers() {
    try {
        // Bắt đầu transaction
        await new Promise((resolve, reject) => {
            db.serialize(() => {
                db.run("BEGIN TRANSACTION", (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        });

        // 1. Đổi tên bảng suppliers hiện tại thành suppliers_old
        console.log('Renaming suppliers table to suppliers_old...');
        await new Promise((resolve, reject) => {
            db.run("ALTER TABLE suppliers RENAME TO suppliers_old", (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        // 2. Tạo bảng suppliers mới với cấu trúc cập nhật
        console.log('Creating new suppliers table...');
        await new Promise((resolve, reject) => {
            db.run(`CREATE TABLE suppliers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                code TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                contact_person TEXT,
                phone TEXT,
                email TEXT,
                address TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        // 3. Sao chép dữ liệu từ suppliers_old sang suppliers mới
        console.log('Copying data to new suppliers table...');
        await new Promise((resolve, reject) => {
            db.run(`INSERT INTO suppliers (id, code, name, contact_person, phone, email, address, created_at)
                    SELECT id, 'SUP' || id, name, contact_person, phone, email, address, created_at
                    FROM suppliers_old`, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        // 4. Xóa bảng suppliers_old
        console.log('Dropping old suppliers table...');
        await new Promise((resolve, reject) => {
            db.run("DROP TABLE suppliers_old", (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        // Kết thúc transaction
        await new Promise((resolve, reject) => {
            db.run("COMMIT", (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        console.log('Migration completed successfully!');
        
        // Kiểm tra dữ liệu
        const suppliers = await new Promise((resolve, reject) => {
            db.all("SELECT * FROM suppliers", [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        console.log('Suppliers in database:', suppliers);

    } catch (err) {
        // Rollback nếu có lỗi
        await new Promise((resolve) => {
            db.run("ROLLBACK", () => resolve());
        });
        console.error('Migration error:', err);
    } finally {
        db.close((err) => {
            if (err) {
                console.error(err.message);
            }
            console.log('Closed the database connection.');
        });
    }
}

migrateSuppliers();