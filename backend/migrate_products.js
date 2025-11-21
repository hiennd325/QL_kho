const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'database.db'), (err) => {
    if (err) {
        console.error('Could not connect to database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

async function migrateProducts() {
    try {
        // Bắt đầu transaction
        await new Promise((resolve, reject) => {
            db.serialize(() => {
                db.run('BEGIN TRANSACTION', (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        });

        // Tạo bảng tạm thời với schema mới
        console.log('Creating temporary table...');
        await new Promise((resolve, reject) => {
            db.run(`CREATE TABLE products_new (
                custom_id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                price REAL NOT NULL,
                category TEXT,
                brand TEXT,
                supplier_id INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
            )`, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        // Sao chép dữ liệu từ bảng cũ sang bảng mới với custom_id = 'SP' + id
        console.log('Copying data to new table...');
        await new Promise((resolve, reject) => {
            db.run(`INSERT INTO products_new (custom_id, name, description, price, category, brand, supplier_id, created_at)
                    SELECT 'SP' || id, name, description, price, category, brand, supplier_id, created_at
                    FROM products`, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        // Xóa bảng cũ
        console.log('Dropping old table...');
        await new Promise((resolve, reject) => {
            db.run('DROP TABLE products', (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        // Đổi tên bảng mới thành tên bảng cũ
        console.log('Renaming new table...');
        await new Promise((resolve, reject) => {
            db.run('ALTER TABLE products_new RENAME TO products', (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        // Cập nhật các bảng liên quan
        console.log('Updating related tables...');
        
        // Cập nhật bảng inventory
        await new Promise((resolve, reject) => {
            db.run(`UPDATE inventory SET product_id = (
                SELECT custom_id FROM products WHERE id = CAST(product_id AS INTEGER)
            ) WHERE product_id IN (SELECT id FROM products)`, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        // Hoàn tất transaction
        await new Promise((resolve, reject) => {
            db.run('COMMIT', (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        console.log('Migration completed successfully!');
    } catch (err) {
        // Rollback nếu có lỗi
        await new Promise((resolve) => {
            db.run('ROLLBACK', () => resolve());
        });
        console.error('Migration failed:', err);
    } finally {
        db.close((err) => {
            if (err) {
                console.error(err.message);
            }
            console.log('Closed the database connection.');
        });
    }
}

migrateProducts();