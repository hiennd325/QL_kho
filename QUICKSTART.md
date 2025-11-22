# 🚀 Quick Start - Giao diện Quản lý Người dùng

## ⚡ Khởi động nhanh

### Yêu cầu
- Node.js v14+
- npm hoặc yarn
- Browser: Chrome, Firefox, Safari, Edge

### Cài đặt

#### 1. Chuẩn bị Backend
```bash
cd backend
npm install
node app.js
# Server sẽ chạy trên http://localhost:3000
```

#### 2. Mở Frontend
```bash
# Từ terminal khác hoặc tab trình duyệt
# Vào: http://localhost:3000/quan-ly-nguoi-dung.html
# HOẶC trực tiếp nếu backend phục vụ static files
```

### Đăng nhập
```
Username: admin
Password: (tùy theo tài khoản đã tạo)
```

---

## 📱 Giao diện chính

```
┌─────────────────────────────────────────────┐
│  HEADER                      [Tìm kiếm] [🔔]│
├─────────────────────────────────────────────┤
│                                             │
│  [📊 Stats Cards - 4 cột]                   │
│                                             │
├─────────────────────────────────────────────┤
│  🔍 Filters: [Search] [Role ▼] [Status ▼]  │
│  [Thêm mới]                                 │
├─────────────────────────────────────────────┤
│  [📋 Table] [🔲 Grid]                       │
├─────────────────────────────────────────────┤
│  TABLE VIEW:                                │
│  ┌───────────────────────────────────────┐  │
│  │ ID │ Username │ Email │ Role │ Status│  │
│  ├───────────────────────────────────────┤  │
│  │ #1 │ admin    │ ... │ Admin │ Active│  │
│  └───────────────────────────────────────┘  │
│                                             │
│  [← Trước] [1] [2] [3] [Sau →]             │
└─────────────────────────────────────────────┘
```

---

## 🎯 Hành động cơ bản

### 1️⃣ Thêm Người dùng
```
1. Click [Thêm mới]
   ↓
2. Điền thông tin:
   - Username: example_user
   - Email: user@example.com
   - Password: secure123
   - Confirm: secure123
   - Role: staff
   - Status: Hoạt động
   ↓
3. Click [Lưu]
   ↓
4. ✅ Success! Người dùng được thêm
```

### 2️⃣ Chỉnh sửa Người dùng
```
1. Click biểu tượng ✏️ trên hàng
   ↓
2. Sửa các trường cần thay đổi
   - Password có thể bỏ trống
   ↓
3. Click [Lưu]
   ↓
4. ✅ Success! Thông tin được cập nhật
```

### 3️⃣ Xóa Người dùng
```
1. Click biểu tượng 🗑️ trên hàng
   ↓
2. Confirm: "Bạn có chắc chắn?"
   ↓
3. Click "OK"
   ↓
4. ✅ Success! Người dùng được xóa
```

### 4️⃣ Tìm kiếm
```
Tìm kiếm theo tên đăng nhập hoặc email:
┌─────────────────────────────┐
│ nguyenvana                  │ ← Gõ tên
└─────────────────────────────┘
       ↓
Kết quả tự động cập nhật
```

### 5️⃣ Lọc Dữ liệu
```
Lọc theo vai trò:
┌────────────────────┐
│ admin ▼            │ ← Chọn
│ staff              │
│ viewer             │
└────────────────────┘

Lọc theo trạng thái:
┌────────────────────┐
│ Hoạt động ▼        │
│ Tạm khóa           │
└────────────────────┘
```

### 6️⃣ Xem Grid
```
Click [🔲 Grid] để thay đổi từ
┌─────────────┬─────────────┐
│ Thẻ 1       │ Thẻ 2       │
├─────────────┼─────────────┤
│ Username    │ Username    │
│ Email       │ Email       │
│ [✏️] [🗑️]   │ [✏️] [🗑️]   │
└─────────────┴─────────────┘
```

---

## 🎨 Giao diện Elements

### Statistics Cards
```
┌─────────────────────┐
│  👥  │ Tổng người   │
│ 0    │ dùng         │
└─────────────────────┘

┌─────────────────────┐
│  🛡️  │ Quản trị    │
│ 0    │ viên        │
└─────────────────────┘

┌─────────────────────┐
│  💼 │ Nhân viên    │
│ 0   │ kho         │
└─────────────────────┘

┌─────────────────────┐
│  ✅ │ Hoạt động   │
│ 0   │             │
└─────────────────────┘
```

### Status Badges
```
✅ Hoạt động     (Green background)
❌ Tạm khóa      (Red background)
```

### Role Badges
```
🔴 Quản trị viên  (Red background)
🔵 Nhân viên kho  (Blue background)
🟣 Người xem      (Purple background)
```

---

## 📊 Thống kê

### Các metrics được theo dõi:
```
1. Tổng số người dùng
   = admin + staff + viewer

2. Số quản trị viên
   = COUNT(role='admin')

3. Số nhân viên kho
   = COUNT(role='staff')

4. Số người hoạt động
   = COUNT(status='active')
```

### Auto-update:
- Khi thêm người dùng → Tổng số +1
- Khi xóa người dùng → Tổng số -1
- Khi thay đổi vai trò → Stats cập nhật

---

## ⌨️ Phím tắt

| Phím | Hành động |
|------|----------|
| Ctrl+A | Tất cả |
| Tab | Focus input tiếp theo |
| Enter | Submit form |
| Esc | Đóng modal |

---

## 🎓 Ví dụ Thực tế

### Tình huống 1: Thêm nhân viên mới
```
Giả sử: Tuyển nhân viên kho mới

Bước 1: Click "Thêm mới"
Bước 2: 
  Username: nguyen_van_b
  Email: nguyenb@company.com
  Password: Welcome@123
  Confirm: Welcome@123
  Role: Nhân viên kho
  Status: Hoạt động
Bước 3: Click Lưu
Result: ✅ Nhân viên được thêm vào hệ thống
        - Số nhân viên tăng 1
        - Tổng người dùng tăng 1
```

### Tình huống 2: Tìm nhân viên cấp cao
```
Giả sử: Cần tìm tất cả quản trị viên

Bước 1: Để trống "Tìm kiếm"
Bước 2: Chọn "Quản trị viên" từ dropdown Vai trò
Result: Chỉ hiện tất cả người dùng có vai trò admin
```

### Tình huống 3: Vô hiệu hóa tài khoản
```
Giả sử: Nhân viên nghỉ việc

Bước 1: Tìm nhân viên
        Nhập tên trong Tìm kiếm
Bước 2: Click ✏️ để chỉnh sửa
Bước 3: Đổi Status = "Tạm khóa"
Bước 4: Click Lưu
Result: ✅ Tài khoản bị vô hiệu hóa
        - Tài khoản không thể đăng nhập
        - Số người hoạt động giảm 1
```

---

## 🔗 API Quick Reference

### Create User
```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "username": "newuser",
    "email": "user@example.com",
    "password": "password123",
    "role": "staff"
  }'
```

### Get All Users
```bash
curl http://localhost:3000/users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get with Filter
```bash
curl "http://localhost:3000/users?role=admin&status=active" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Update User
```bash
curl -X PUT http://localhost:3000/users/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "email": "newemail@example.com",
    "role": "admin"
  }'
```

### Delete User
```bash
curl -X DELETE http://localhost:3000/users/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🐛 Debugging Tips

### 1. Kiểm tra Network
```
F12 → Network tab
- Xem các API calls
- Kiểm tra response status
- Xem error messages
```

### 2. Kiểm tra Console
```
F12 → Console tab
- Xem lỗi JavaScript
- Xem log messages
- Test commands
```

### 3. Kiểm tra Server
```bash
# Terminal backend
- Xem logs từ Express
- Xem lỗi database
- Xem query SQL
```

### 4. Test Modal
```javascript
// Trong console:
openModal('user-modal')    // Mở modal
closeModal('user-modal')   // Đóng modal
```

---

## ✅ Checklist Triển khai

- [ ] Backend server chạy bình thường
- [ ] Database được tạo (database.db)
- [ ] Frontend load không lỗi
- [ ] Có thể đăng nhập
- [ ] Thống kê hiển thị đúng
- [ ] Tìm kiếm hoạt động
- [ ] Thêm người dùng hoạt động
- [ ] Chỉnh sửa hoạt động
- [ ] Xóa hoạt động
- [ ] Grid view hoạt động
- [ ] Phân trang hoạt động
- [ ] Notification hiển thị đúng

---

## 📞 Troubleshooting

### Lỗi: "Cannot GET /quan-ly-nguoi-dung.html"
**Giải pháp**: 
- Kiểm tra backend đang serve static files
- Kiểm tra port 3000 có mở không

### Lỗi: "Network Error"
**Giải pháp**:
- Kiểm tra backend đang chạy
- Kiểm tra CORS configuration
- Kiểm tra token hợp lệ

### Lỗi: "Form validation failed"
**Giải pháp**:
- Kiểm tra username không trùng
- Kiểm tra password >= 6 ký tự
- Kiểm tra email format đúng

### Lỗi: Modal không mở
**Giải pháp**:
- F12 xem lỗi console
- Reload trang
- Xóa cache

---

## 📈 Performance Tips

1. **Search & Filter**
   - Sử dụng để giảm số hàng hiển thị
   - Cải thiện tốc độ render

2. **Pagination**
   - Mỗi trang 10 items
   - Tránh load quá nhiều dữ liệu

3. **Grid vs Table**
   - Table: Tốt cho so sánh
   - Grid: Tốt cho thiết bị di động

4. **Browser**
   - Dùng Chrome/Edge để tốt nhất
   - Xóa cache nếu có vấn đề

---

## 🎉 Bắt đầu ngay!

```
1. npm install (nếu chưa)
2. node backend/app.js
3. Mở browser: http://localhost:3000/quan-ly-nguoi-dung.html
4. Đăng nhập
5. Bắt đầu quản lý người dùng!
```

**Happy coding! 🚀**

---

**Cập nhật**: 22/11/2025  
**Phiên bản**: 2.0
