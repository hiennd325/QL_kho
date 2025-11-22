# ⚡ Quick Reference Card - Quản lý Người dùng v2.0

## 🎯 Cheat Sheet

### File Changes
```
✏️  frontend/quan-ly-nguoi-dung.html (Updated)
✨  frontend/js/quan-ly-nguoi-dung-new.js (New)
✏️  backend/routes/user.js (Updated - added query params)
```

### Key Features Added
```
✨ Dashboard Statistics (4 cards)
✨ Advanced Filters (search + role + status)
✨ Dual View Modes (table & grid)
✨ Pagination (10 items/page)
✨ Modal Improvements (2-column form, validation)
✨ Notification Toast
✨ Role Descriptions in Modal
```

---

## 📱 UI Quick Tour

```
[HEADER: Logo | Search | Notifications | User]
    ↓
[STATS: 4 Cards showing Total | Admin | Staff | Active]
    ↓
[FILTERS: Search | Role ▼ | Status ▼ | [Add] | [Reset]]
    ↓
[VIEW TOGGLE: [Table] [Grid]]
    ↓
[TABLE/GRID VIEW with Data]
    ↓
[PAGINATION: ← Trước [1][2][3] Sau →]
```

---

## 🔌 API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/users` | Get all (with filters) |
| GET | `/users/:id` | Get one |
| GET | `/users/count` | Get count |
| POST | `/users` | Create |
| PUT | `/users/:id` | Update |
| DELETE | `/users/:id` | Delete |

---

## 🔍 Query Parameters

```
GET /users?search=keyword&role=admin&status=active

search:  Username or email keyword
role:    'admin' | 'staff' | 'viewer'
status:  'active' | 'inactive'
```

---

## 📝 Request Bodies

### Create User (POST /users)
```json
{
  "username": "required",
  "email": "required",
  "password": "required (min 6)",
  "role": "optional (default: staff)",
  "status": "optional (default: active)"
}
```

### Update User (PUT /users/:id)
```json
{
  "email": "optional",
  "password": "optional",
  "role": "optional",
  "status": "optional"
}
```

---

## ✅ Validation Rules

```
Username:
  - Required
  - Unique
  - No duplicates

Email:
  - Required
  - Valid format

Password:
  - Required (on create)
  - Minimum 6 characters
  - Must match confirm

Role:
  - Required
  - admin | staff | viewer

Status:
  - Optional
  - active | inactive
```

---

## 🎨 Colors & Badges

### Role Badges
```
🔴 Admin    (red-100 bg, red-800 text)
🔵 Staff    (blue-100 bg, blue-800 text)
🟣 Viewer   (purple-100 bg, purple-800 text)
```

### Status Badges
```
🟢 Active    (green-100 bg, green-800 text)
🔴 Inactive  (red-100 bg, red-800 text)
```

---

## 🎛️ JavaScript Class: UserManager

### Key Methods
```javascript
loadUsers()              // Load from server
applyFilters()          // Filter local data
openModal(userId)       // Edit/create
handleSaveUser(e)       // Save to server
deleteUser(userId)      // Delete from server
switchView(mode)        // Toggle table/grid
renderTableView()       // Render table
renderGridView()        // Render grid
updateStatistics()      // Update stats cards
```

### Key Properties
```javascript
users              // All users from server
filteredUsers      // After applying filters
currentPage        // Current page number
pageSize           // Items per page (10)
currentUserId      // Editing user ID
viewMode           // 'table' or 'grid'
```

---

## 🔐 Authentication

### Headers Required
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

### Example
```bash
curl http://localhost:3000/users \
  -H "Authorization: Bearer eyJhbGc..."
```

---

## 🌐 Backend Routes in app.js

```javascript
const userRoutes = require('./routes/user');
app.use('/users', authenticate, userRoutes);
```

All user routes require:
1. JWT token in header
2. Valid authorization

---

## 🛠️ Common Operations

### Add User
```
1. Click [Thêm mới]
2. Fill form (6 fields)
3. Click [Lưu]
4. → POST /users
5. ✅ Done!
```

### Edit User
```
1. Click [✏️] button
2. Modify fields
3. Click [Lưu]
4. → PUT /users/:id
5. ✅ Done!
```

### Delete User
```
1. Click [🗑️] button
2. Confirm dialog
3. → DELETE /users/:id
4. ✅ Done!
```

### Filter
```
1. Enter search term
2. Select role
3. Select status
4. Results auto-update
5. Use [Reset] to clear
```

---

## 📊 Statistics

```
Total Users     → COUNT(*)
Admin Count     → COUNT(role='admin')
Staff Count     → COUNT(role='staff')
Active Count    → COUNT(status='active')

All update automatically when data changes
```

---

## 🔔 Notifications

```
✅ Success (Green, 3s)
   - "Thêm người dùng thành công"
   - "Cập nhật người dùng thành công"
   - "Xóa người dùng thành công"

❌ Error (Red, 3s)
   - "Vui lòng nhập tên đăng nhập"
   - "Mật khẩu phải có ít nhất 6 ký tự"
   - "Lỗi tải dữ liệu người dùng"

ℹ️ Info (Blue, 3s)
   - Other info messages
```

---

## 🐛 Troubleshooting

### Problem: Modal doesn't open
**Solution**: 
- Check browser console (F12)
- Reload page
- Clear cache

### Problem: Can't save user
**Solution**:
- Check all required fields
- Verify username not duplicate
- Check network tab for errors

### Problem: 401 Unauthorized
**Solution**:
- Re-login to get new token
- Check token in storage
- Verify CORS headers

### Problem: Data not refreshing
**Solution**:
- Check network request status
- Verify server is running
- Try manual page refresh

---

## 🚀 Performance Tips

```
✓ Use filters to reduce visible items
✓ Use pagination (10 per page)
✓ Grid view better for mobile
✓ Table view for comparison
✓ Search is instant (no server call)
```

---

## 📱 Responsive Breakpoints

```
Mobile:   < 768px   (1 column, stacked)
Tablet:   768-1024px (2-3 columns)
Desktop:  ≥ 1024px  (4 columns, full)
```

---

## 🎓 Pagination

```
[← Trước] [1] [2] [3] [Sau →]

← Trước:  Previous page (disabled on page 1)
[1][2][3]: Direct page nav
Sau →:   Next page (disabled on last page)
```

---

## 📋 Form Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Username | text | Yes | Unique, no spaces |
| Email | email | Yes | Valid format |
| Password | password | Yes (create) | Min 6 chars |
| Confirm | password | Yes (create) | Must match |
| Role | select | Yes | 3 options |
| Status | select | Yes | 2 options |

---

## 🔗 Important Links

**Start Here**
- PROJECT_SUMMARY.md - Project overview
- QUICKSTART.md - Get running fast

**For Users**
- USER_MANAGEMENT_GUIDE.md - Full guide

**For Developers**
- TECHNICAL_DOCUMENTATION.md - Architecture
- API_TESTING_GUIDE.md - API details

**For Designers**
- VISUAL_GUIDE.md - UI components

---

## 📈 Stats Card Info

```
👥 Total Users         → COUNT all records
🛡️ Quản trị viên       → COUNT role='admin'
💼 Nhân viên kho       → COUNT role='staff'
✅ Hoạt động           → COUNT status='active'
```

---

## 🔄 State Management

```
Initial: users = [], filteredUsers = []
    ↓
Load: GET /users → users = [...]
    ↓
Filter: Apply filters → filteredUsers = [...]
    ↓
Render: Generate HTML from filteredUsers
    ↓
Update: POST/PUT/DELETE → Reload data
```

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Tab | Next field |
| Enter | Submit form |
| Esc | Close modal |
| Ctrl+A | Select all |

---

## 💾 Database

```sql
Table: users
Columns:
  - id (PK, auto-increment)
  - username (UNIQUE)
  - email
  - password (hashed)
  - role (admin|staff|viewer)
  - status (active|inactive)
  - created_at (timestamp)
```

---

## 🎯 Success Indicators

```
✅ Users can create account
✅ Users can edit account
✅ Users can delete account
✅ Users can search users
✅ Users can filter by role/status
✅ Stats update correctly
✅ Pagination works
✅ Toast notifications appear
✅ Both views work (table/grid)
✅ No console errors
```

---

## 📞 Support Links

- Github Issues: Report bugs
- Documentation: Read guides
- Troubleshooting: Check USER_MANAGEMENT_GUIDE.md

---

## 🎉 You're Ready!

```
1. ✅ Frontend updated
2. ✅ Backend updated
3. ✅ Database ready
4. ✅ Documentation complete
5. ✅ Everything tested
→ Start using the system!
```

---

**Quick Help**: 
- Press Ctrl+F in any doc to search
- Start with PROJECT_SUMMARY.md
- Use DOCUMENTATION_INDEX.md to navigate

**Last Updated**: 22/11/2025  
**Version**: 2.0  
**Status**: ✅ Ready
