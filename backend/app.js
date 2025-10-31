// Import các module cần thiết cho ứng dụng
const express = require('express'); // Framework web cho Node.js
const bodyParser = require('body-parser'); // Middleware để parse JSON body
const cors = require('cors'); // Middleware để xử lý CORS
const sqlite3 = require('sqlite3').verbose(); // SQLite database driver
const fs = require('fs'); // File system module
const path = require('path'); // Module để xử lý đường dẫn
const dotenv = require('dotenv'); // Module để load biến môi trường
dotenv.config(); // Load biến từ file .env
const jwt = require('jsonwebtoken'); // Module để tạo và verify JWT tokens
const bcrypt = require('bcrypt'); // Module để hash mật khẩu

/**
 * Middleware để xác thực JWT token
 * Kiểm tra token trong header Authorization
 * Nếu hợp lệ, thêm thông tin user vào req.user
 */
function authenticate(req, res, next) {
  // Lấy token từ header Authorization (format: "Bearer <token>")
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    // Verify token với secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Lưu thông tin user đã decode vào request
    next(); // Tiếp tục xử lý request
  } catch (err) {
    return res.status(403).json({ error: 'Forbidden' });
  }
}

// Tạo instance của Express app
const app = express();
// Đặt port từ biến môi trường hoặc mặc định 3000
const port = process.env.PORT || 3000;

// Cấu hình CORS để cho phép frontend truy cập
app.use(cors({
  origin: '*',  // Cho phép tất cả origins trong môi trường development
  credentials: true, // Cho phép gửi credentials
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Các HTTP methods được phép
  allowedHeaders: ['Content-Type', 'Authorization'] // Headers được phép
}));

// Middleware để parse JSON body từ requests
app.use(bodyParser.json());

// Middleware để xử lý routes
app.use((req, res, next) => {
    // Chuyển hướng root path đến login.html
    if (req.path === '/') {
        return res.redirect('/login.html');
    }
    next();
});

// Serve static files từ thư mục frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Kiểm tra xem tệp cơ sở dữ liệu đã tồn tại chưa
const dbPath = './database.db';
const dbExists = fs.existsSync(dbPath);

// Kết nối đến cơ sở dữ liệu SQLite
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Could not connect to database:', err.message);
    } else {
        console.log('Connected to SQLite database.');
    }
});

// Nếu tệp cơ sở dữ liệu chưa tồn tại, đọc và thực thi schema từ file schema.sql
if (!dbExists) {
    const schemaPath = path.join(__dirname, 'schema.sql');
    fs.readFile(schemaPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading schema.sql:', err);
            return;
        }
        db.exec(data, (err) => {
            if (err) {
                console.error('Error executing schema:', err.message);
            } else {
                console.log('Database schema applied.');
            }
        });
    });
} else {
    console.log('Using existing database file.');
}





// Import và sử dụng các routes
const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes); // Routes cho authentication (không cần authenticate middleware)

const productRoutes = require('./routes/product');
app.use('/products', authenticate, productRoutes); // Routes cho quản lý sản phẩm (cần xác thực)

const inventoryRoutes = require('./routes/inventory');
app.use('/inventory', authenticate, inventoryRoutes); // Routes cho quản lý tồn kho

const userRoutes = require('./routes/user');
app.use('/users', authenticate, userRoutes); // Routes cho quản lý người dùng

const orderRoutes = require('./routes/order');
app.use('/orders', authenticate, orderRoutes); // Routes cho quản lý đơn hàng

const reportRoutes = require('./routes/report');
app.use('/reports', authenticate, reportRoutes); // Routes cho báo cáo
const dashboardRoutes = require('./routes/dashboard');
app.use('/dashboard', authenticate, dashboardRoutes); // Routes cho dashboard
const warehouseRoutes = require('./routes/warehouse');
app.use('/warehouses', authenticate, warehouseRoutes); // Routes cho quản lý kho

const transferRoutes = require('./routes/transfers');
app.use('/transfers', authenticate, transferRoutes); // Routes cho điều chuyển hàng

const supplierRoutes = require('./routes/supplier');
app.use('/suppliers', authenticate, supplierRoutes); // Routes cho quản lý nhà cung cấp

const salesOrderRoutes = require('./routes/sales_order');
app.use('/sales-orders', authenticate, salesOrderRoutes);

const notificationRoutes = require('./routes/notifications');
app.use('/notifications', authenticate, notificationRoutes); // Routes cho thông báo

// Middleware xử lý lỗi toàn cục
app.use((err, req, res, next) => {
    console.error(err.stack); // Log lỗi ra console
    res.status(500).json({ error: 'Internal server error' }); // Trả về lỗi 500
});

// Khởi động server
const server = app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

// Hàm tạo backup database
function createDatabaseBackup() {
    const backupPath = `./database.db.backup.${Date.now()}`;
    fs.copyFile('./database.db', backupPath, (err) => {
        if (err) {
            console.error('Error creating database backup:', err.message);
        } else {
            console.log(`Database backup created: ${backupPath}`);
        }
    });
}

// Hàm xử lý shutdown graceful
function gracefulShutdown() {
    console.log('Received shutdown signal, creating database backup and closing connections...');
    
    // Tạo backup database trước khi đóng
    createDatabaseBackup();
    
    // Đóng database connection
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            console.log('Database connection closed.');
        }
        
        // Đóng server
        server.close(() => {
            console.log('Server closed.');
            process.exit(0);
        });
    });
}

// Xử lý các tín hiệu shutdown
process.on('SIGINT', gracefulShutdown);  // Ctrl+C
process.on('SIGTERM', gracefulShutdown); // Termination signal
process.on('SIGUSR2', gracefulShutdown); // Nodemon restart

// Xử lý uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    gracefulShutdown();
});

// Xử lý unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown();
});