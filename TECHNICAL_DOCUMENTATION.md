# 🔧 Tài liệu Kỹ thuật - Hệ thống Quản lý Người dùng v2.0

## 📋 Mục lục
1. [Kiến trúc](#kiến-trúc)
2. [Frontend](#frontend)
3. [Backend](#backend)
4. [Database](#database)
5. [API Endpoints](#api-endpoints)
6. [State Management](#state-management)
7. [Component Structure](#component-structure)
8. [Lỗi & Xử lý](#lỗi--xử-lý)

---

## 🏗️ Kiến trúc

### Kiến trúc tổng quát
```
┌─────────────────────────────────────────┐
│          FRONTEND (HTML/CSS/JS)         │
│  ┌─────────────────────────────────────┐│
│  │  quan-ly-nguoi-dung.html            ││
│  │  + quan-ly-nguoi-dung-new.js        ││
│  │  + css/styles.css                   ││
│  └─────────────────────────────────────┘│
└────────────────┬────────────────────────┘
                 │ HTTP/JSON
┌────────────────┴────────────────────────┐
│          BACKEND (Node.js/Express)      │
│  ┌─────────────────────────────────────┐│
│  │  /routes/user.js                    ││
│  │  /models/user.js                    ││
│  │  /app.js                            ││
│  └─────────────────────────────────────┘│
└────────────────┬────────────────────────┘
                 │ SQL
┌────────────────┴────────────────────────┐
│        DATABASE (SQLite)                │
│  database.db                            │
└─────────────────────────────────────────┘
```

### Technology Stack
```
Frontend:
- HTML5
- Tailwind CSS
- Vanilla JavaScript (ES6+)
- Feather Icons
- Chart.js (optional)

Backend:
- Node.js
- Express.js
- SQLite3
- bcrypt (password hashing)
- jsonwebtoken (JWT)

Database:
- SQLite3
- Schema: users table
```

---

## 🎨 Frontend

### File Structure
```
frontend/
├── quan-ly-nguoi-dung.html
├── css/
│   └── styles.css
├── js/
│   ├── app.js (global functions)
│   ├── quan-ly-nguoi-dung-new.js (NEW - main logic)
│   └── auth.js
└── ...other pages
```

### HTML Structure

#### Dashboard Cards
```html
<!-- Statistics at the top -->
<div id="total-users">0</div>
<div id="admin-count">0</div>
<div id="staff-count">0</div>
<div id="active-count">0</div>
```

#### Filters
```html
<input id="search-input" type="text" placeholder="...">
<select id="role-filter">...</select>
<select id="status-filter">...</select>
<button id="btn-reset-filter">...</button>
```

#### View Toggle
```html
<button id="view-table-btn">Table View</button>
<button id="view-grid-btn">Grid View</button>
```

#### Table View
```html
<table>
  <thead>
    <tr>
      <th>ID</th>
      <th>Username</th>
      <th>Email</th>
      <th>Role</th>
      <th>Status</th>
      <th>Created</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody id="users-table-body">
    <!-- Dynamically generated -->
  </tbody>
</table>
```

#### Grid View
```html
<div id="grid-view" class="grid">
  <!-- User cards generated dynamically -->
</div>
```

#### Modal
```html
<div id="user-modal" class="modal">
  <form id="userForm">
    <input id="username" type="text" />
    <input id="email" type="email" />
    <input id="password" type="password" />
    <input id="confirm-password" type="password" />
    <select id="role">...</select>
    <select id="status">...</select>
  </form>
  <button id="saveUserBtn">Save</button>
</div>
```

### CSS Classes

#### Badge Classes
```css
.badge-admin      /* Red for admin */
.badge-staff      /* Blue for staff */
.badge-viewer     /* Purple for viewer */
.badge-active     /* Green for active */
.badge-inactive   /* Red for inactive */
```

#### State Classes
```css
.modal-open       /* Modal is visible */
.user-card        /* Card with hover effect */
```

---

## 📱 JavaScript (Frontend)

### Class: UserManager

#### Constructor
```javascript
constructor() {
  this.baseUrl = 'http://localhost:3000';
  this.users = [];              // All users
  this.filteredUsers = [];      // Filtered results
  this.currentPage = 1;
  this.pageSize = 10;
  this.currentUserId = null;    // For edit mode
  this.viewMode = 'table';      // or 'grid'
  this.init();
}
```

#### Main Methods

##### `init()`
Khởi tạo event listeners và tải dữ liệu ban đầu

##### `setupEventListeners()`
Kết nối các sự kiện:
- Button click: Add, Delete, Edit
- Input change: Search, Filter
- View toggle: Table/Grid

##### `loadUsers()`
```javascript
GET /users
Response: Array<User>
```

##### `applyFilters()`
```javascript
// Combine search + role + status filters
// Client-side filtering on already loaded data
```

##### `renderTableView()`
Tạo HTML cho bảng từ `filteredUsers`
- Phân trang: `start = (currentPage-1) * pageSize`
- Thêm event listeners cho edit/delete buttons

##### `renderGridView()`
Tạo HTML cho grid view từ `filteredUsers`
- Tạo cards với avatar, info, actions

##### `openModal(userId?)`
- Nếu `userId` null: Add mode
- Nếu `userId` có giá trị: Edit mode
- Prefill form data từ API

##### `handleSaveUser(e)`
```javascript
// Validate form
// POST (new) or PUT (update)
POST /users body { username, email, password, role, status }
PUT /users/:id body { email?, password?, role?, status? }
// Reload data
```

##### `deleteUser(userId)`
```javascript
// Confirm dialog
// DELETE /users/:id
// Reload data
```

##### `updateStatistics()`
Tính toán stats từ `this.users`:
- Total count
- Admin count
- Staff count
- Active count

#### State Management

```javascript
// View data
this.users = [...];          // All from server
this.filteredUsers = [...];  // After filters
this.currentPage = 1;        // Pagination

// UI state
this.currentUserId = null;   // Edit mode
this.viewMode = 'table';     // View type
```

### Event Flow

```
1. User clicks "Add"
   ↓
2. openModal(null)
   ↓
3. Modal opens
   ↓
4. User fills form
   ↓
5. User clicks Save
   ↓
6. Validation
   ↓
7. POST /users
   ↓
8. loadUsers() - refresh data
   ↓
9. renderTableView() or renderGridView()
   ↓
10. Display notification
```

---

## 🔙 Backend

### File Structure
```
backend/
├── app.js (main server)
├── routes/
│   └── user.js (user routes)
├── models/
│   └── user.js (database operations)
├── database.db (SQLite database)
└── schema.sql (database schema)
```

### Routes (routes/user.js)

#### GET /users
```javascript
Query params:
- search: string (searches username + email)
- role: 'admin' | 'staff' | 'viewer'
- status: 'active' | 'inactive'

Response:
[
  {
    id: 1,
    username: 'admin',
    email: 'admin@example.com',
    password: 'hashed...',
    role: 'admin',
    status: 'active',
    created_at: '2025-11-22T...'
  },
  ...
]
```

#### GET /users/:id
```javascript
Response:
{
  id: 1,
  username: 'admin',
  email: 'admin@example.com',
  role: 'admin',
  status: 'active',
  created_at: '2025-11-22T...'
}
```

#### GET /users/count
```javascript
Response:
{ count: 15 }
```

#### POST /users
```javascript
Body:
{
  username: 'newuser',      // required, unique
  email: 'user@email.com',  // required
  password: 'pass123',      // required, min 6
  role: 'staff',            // optional, default 'staff'
  status: 'active'          // optional, default 'active'
}

Response:
{ id: 16 }  // New user ID
```

#### PUT /users/:id
```javascript
Body:
{
  username: 'updated',      // optional
  email: 'new@email.com',   // optional
  password: 'newpass',      // optional
  role: 'admin',            // optional
  status: 'inactive'        // optional
}

Response:
{
  id: 1,
  username: 'updated',
  email: 'new@email.com',
  role: 'admin',
  status: 'inactive',
  created_at: '2025-11-22T...'
}
```

#### DELETE /users/:id
```javascript
Response:
{ message: 'User deleted successfully' }
```

### Models (models/user.js)

#### Functions

##### `createUser(username, password, role?, email?, status?)`
```javascript
// Hash password with bcrypt (salt: 10)
// INSERT into users table
// Return { id: lastID }
```

##### `getAllUsers()`
```javascript
// SELECT * FROM users
// Return Array<User>
```

##### `getUserById(id)`
```javascript
// SELECT * FROM users WHERE id = ?
// Return User | null
```

##### `updateUser(id, updates)`
```javascript
// Build dynamic UPDATE query
// Hash password if provided
// Return updated user
```

##### `deleteUser(id)`
```javascript
// DELETE FROM users WHERE id = ?
// Return success message
```

##### `getUsersCount()`
```javascript
// SELECT COUNT(*) FROM users
// Return count
```

### Database Queries

#### Get all users
```sql
SELECT * FROM users;
```

#### Search users
```sql
SELECT * FROM users 
WHERE username LIKE '%keyword%' 
   OR email LIKE '%keyword%';
```

#### Filter by role
```sql
SELECT * FROM users WHERE role = 'admin';
```

#### Filter by status
```sql
SELECT * FROM users WHERE status = 'active';
```

#### Create user
```sql
INSERT INTO users (username, password, role, email, status)
VALUES (?, ?, ?, ?, ?);
```

#### Update user
```sql
UPDATE users SET email = ?, role = ? WHERE id = ?;
```

#### Delete user
```sql
DELETE FROM users WHERE id = ?;
```

---

## 💾 Database

### Schema (schema.sql)

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'staff',
    status TEXT NOT NULL DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Columns

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTO_INCREMENT | User ID |
| username | TEXT | UNIQUE, NOT NULL | Login username |
| email | TEXT | | User email |
| password | TEXT | NOT NULL | Hashed password |
| role | TEXT | DEFAULT 'staff' | User role |
| status | TEXT | DEFAULT 'active' | User status |
| created_at | DATETIME | DEFAULT NOW | Creation timestamp |

### Values

#### Role
- `admin`: Full permissions
- `staff`: Warehouse operations
- `viewer`: View only

#### Status
- `active`: User is active
- `inactive`: User is disabled

---

## 🔐 Security

### Password Security
```javascript
// Hashing
const hashedPassword = await bcrypt.hash(password, 10);
// Verify (in auth)
const isValid = await bcrypt.compare(inputPassword, hashedPassword);
```

### JWT Authentication
```javascript
// Used in middleware to protect routes
function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = decoded;
  next();
}
```

### Input Validation
```javascript
// Frontend
- Username: not empty
- Email: valid format
- Password: min 6 chars
- Role: not empty
- Status: not empty

// Backend
- All fields required for POST
- Type checking
- SQL injection prevention (parameterized queries)
```

---

## 🚀 Performance

### Optimization Techniques

#### Frontend
- **Pagination**: 10 items/page to reduce DOM
- **Lazy Rendering**: Only render visible items
- **Event Delegation**: Single listener for multiple buttons
- **Debouncing**: Optional for search input

#### Backend
- **Parameterized Queries**: Prevent SQL injection
- **Connection Pooling**: Reuse database connections
- **Indexes**: On username for search queries
- **CORS**: Whitelist origins in production

### Load Testing
```
Current configuration:
- Database: Single SQLite file
- Server: Single Node process
- Recommended limit: <1000 users
- For more users: Consider migration to PostgreSQL/MySQL
```

---

## 🐛 Lỗi & Xử lý

### Frontend Errors

#### Network Errors
```javascript
catch (error) {
  showNotification('Lỗi tải dữ liệu', 'error');
  console.error(error);
}
```

#### Validation Errors
```javascript
if (!username) {
  showNotification('Vui lòng nhập tên đăng nhập', 'error');
}
```

#### Modal Errors
```javascript
if (!modal) {
  console.error(`Modal element with ID "${modalId}" not found.`);
}
```

### Backend Errors

#### Database Errors
```javascript
db.run(sql, (err) => {
  if (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});
```

#### Validation Errors
```javascript
if (!username || !password) {
  return res.status(400).json({ error: 'Missing required fields' });
}
```

#### Authentication Errors
```javascript
if (!token) {
  return res.status(401).json({ error: 'Unauthorized' });
}
```

### Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | Token missing/invalid | Re-login |
| 500 Server error | Database connection failed | Check database.db exists |
| Form validation fails | Input data invalid | Check error message |
| Modal doesn't open | JS error or element not found | Check browser console |
| Data not refreshing | API call failed | Check network tab |

---

## 📈 Future Improvements

### Planned Features
- [ ] User activity logging
- [ ] Bulk operations (edit/delete multiple)
- [ ] Export to CSV/Excel
- [ ] Advanced filtering (date range)
- [ ] User profile page
- [ ] Password reset functionality
- [ ] Two-factor authentication
- [ ] Activity audit log

### Scalability
- [ ] Migrate to PostgreSQL
- [ ] Implement caching (Redis)
- [ ] Add pagination at server level
- [ ] Implement soft deletes
- [ ] Add user activity tracking

### Security Enhancements
- [ ] HTTPS/SSL enforcement
- [ ] Rate limiting on API
- [ ] CSRF protection
- [ ] XSS prevention
- [ ] SQL injection prevention review
- [ ] Add permission system

---

## 📚 References

### Libraries Used
- [Tailwind CSS](https://tailwindcss.com/)
- [Feather Icons](https://feathericons.com/)
- [Express.js](https://expressjs.com/)
- [SQLite3](https://www.sqlite.org/)
- [bcrypt](https://www.npmjs.com/package/bcrypt)
- [JWT](https://jwt.io/)

### Documentation
- [MDN JavaScript Guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
- [Express API Reference](https://expressjs.com/en/api.html)
- [SQLite Documentation](https://www.sqlite.org/docs.html)

---

**Cập nhật**: 22/11/2025  
**Phiên bản**: 2.0  
**Status**: ✅ Production Ready
