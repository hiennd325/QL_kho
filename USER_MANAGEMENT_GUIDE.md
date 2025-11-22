# 📘 Hướng dẫn Sử dụng Giao diện Quản lý Người dùng Mới

## 🎯 Tổng quan

Giao diện quản lý người dùng mới được xây dựng với kiến trúc hiện đại, cung cấp các tính năng quản lý người dùng toàn diện với giao diện thân thiện và hiệu suất cao.

---

## 📊 Thống kê Dashboard

Phía trên cùng của trang hiển thị 4 thẻ thống kê quan trọng:

### 1. **Tổng Người dùng**
- Hiển thị tổng số người dùng trong hệ thống
- Cập nhật realtime khi thêm/xóa người dùng
- Biểu tượng: 👥

### 2. **Quản trị viên**
- Số lượng người dùng có vai trò "admin"
- Để theo dõi số lượng quản trị viên
- Biểu tượng: 🛡️

### 3. **Nhân viên kho**
- Số lượng người dùng có vai trò "staff"
- Để theo dõi số lượng nhân viên
- Biểu tượng: 💼

### 4. **Hoạt động**
- Số lượng người dùng có trạng thái "active"
- Để theo dõi người dùng đang hoạt động
- Biểu tượng: ✅

---

## 🔍 Bộ lọc và Tìm kiếm

### Tìm kiếm (Search)
- **Input**: Nhập từ khóa
- **Tìm kiếm theo**: Tên đăng nhập hoặc email
- **Ví dụ**: Gõ "nguyen" sẽ tìm tất cả người dùng chứa "nguyen" trong username hoặc email

### Lọc theo Vai trò
- **Quản trị viên**: Admin - có toàn bộ quyền
- **Nhân viên kho**: Staff - quản lý kho hàng
- **Người xem**: Viewer - chỉ xem thông tin

### Lọc theo Trạng thái
- **Hoạt động**: Người dùng hiện tại đang được sử dụng
- **Tạm khóa**: Người dùng bị vô hiệu hóa

### Nút Reset (X)
- Click để xóa tất cả bộ lọc
- Hiển thị lại toàn bộ danh sách

---

## 👁️ Chế độ Xem

### Chế độ Danh sách (Table View)
- Hiển thị dưới dạng bảng
- Cột: ID, Tên đăng nhập, Email, Vai trò, Trạng thái, Ngày tạo, Hành động
- **Lợi ích**: Xem toàn diện, so sánh dữ liệu dễ dàng

```
| ID | Tên đăng nhập | Email | Vai trò | Trạng thái | Ngày tạo | Hành động |
```

### Chế độ Lưới (Grid View)
- Hiển thị dưới dạng thẻ (cards)
- Mỗi thẻ chứa: Avatar, tên, email, vai trò, trạng thái, ngày tạo
- **Lợi ích**: Giao diện thân thiện, dễ nhìn, phù hợp trên điện thoại

---

## ➕ Thêm Người dùng Mới

### Bước 1: Click nút "Thêm mới"
- Tìm nút xanh "Thêm mới" phía trên bảng
- Click để mở modal

### Bước 2: Điền thông tin
| Trường | Yêu cầu | Ghi chú |
|--------|--------|--------|
| Tên đăng nhập | Bắt buộc | Không trùng lặp, chỉ dùng chữ và số |
| Email | Bắt buộc | Phải hợp lệ, định dạng xxx@xxx.xxx |
| Mật khẩu | Bắt buộc | Tối thiểu 6 ký tự |
| Xác nhận mật khẩu | Bắt buộc | Phải khớp với mật khẩu ở trên |
| Vai trò | Bắt buộc | Chọn từ dropdown |
| Trạng thái | Bắt buộc | Mặc định "Hoạt động" |

### Bước 3: Chọn Vai trò
Khi chọn vai trò, sẽ hiển thị mô tả chi tiết:

#### 🔴 Quản trị viên
```
✓ Toàn bộ quyền hạn
✓ Quản lý người dùng
✓ Xem báo cáo
✓ Cấu hình hệ thống
```

#### 🔵 Nhân viên kho
```
✓ Quản lý tồn kho
✓ Nhập xuất hàng
✓ Xem báo cáo cơ bản
✗ Quản lý người dùng
```

#### 🟣 Người xem
```
✓ Xem thông tin
✓ Xem báo cáo
✗ Chỉnh sửa dữ liệu
✗ Quản lý người dùng
```

### Bước 4: Click "Lưu"
- Dữ liệu sẽ được gửi đến server
- Nếu thành công: modal đóng, danh sách cập nhật, hiển thị thông báo ✅
- Nếu lỗi: hiển thị thông báo lỗi ❌

---

## ✏️ Chỉnh sửa Người dùng

### Bước 1: Click biểu tượng Edit
- Tìm biểu tượng ✏️ ở hàng người dùng cần sửa
- Click để mở modal chỉnh sửa

### Bước 2: Cập nhật thông tin
- Modal sẽ điền sẵn thông tin hiện tại
- **Tên đăng nhập**: Không thể đổi (bị vô hiệu hóa)
- **Mật khẩu**: Tùy chọn - để trống nếu không muốn đổi
- Các trường khác: có thể chỉnh sửa bình thường

### Bước 3: Click "Lưu"
- Gửi dữ liệu cập nhật
- Danh sách tự động refresh

---

## 🗑️ Xóa Người dùng

### Bước 1: Click biểu tượng Trash
- Tìm biểu tượng 🗑️ ở hàng người dùng cần xóa
- Click để trigger xác nhận

### Bước 2: Xác nhận xóa
- Popup hỏi: "Bạn có chắc chắn muốn xóa người dùng này?"
- Click "OK" để xác nhận xóa
- Click "Cancel" để hủy

### Bước 3: Hoàn thành
- Người dùng bị xóa khỏi danh sách
- Hiển thị thông báo thành công ✅

---

## 🔄 Phân trang

### Hiểu về Phân trang
- Mỗi trang hiển thị **10 người dùng**
- Nếu có >10 người dùng, sẽ có nút phân trang ở dưới

### Nút Phân trang
```
← Trước  [1] [2] [3] [4]  Sau →
```

- **← Trước**: Quay lại trang trước (bị vô hiệu hóa ở trang 1)
- **[1][2][3]**: Click vào số trang bất kỳ
- **Sau →**: Đến trang tiếp theo (bị vô hiệu hóa ở trang cuối)

---

## 🎨 Badge và Màu sắc

### Vai trò
| Vai trò | Màu | Hiển thị |
|--------|-----|---------|
| Admin | 🔴 Red | Quản trị viên |
| Staff | 🔵 Blue | Nhân viên kho |
| Viewer | 🟣 Purple | Người xem |

### Trạng thái
| Trạng thái | Màu | Hiển thị |
|-----------|-----|---------|
| Active | 🟢 Green | Hoạt động |
| Inactive | 🔴 Red | Tạm khóa |

---

## 📲 Thông báo

Hệ thống sẽ hiển thị các thông báo ở góc trên phải:

### ✅ Thành công (xanh)
- "Thêm người dùng thành công"
- "Cập nhật người dùng thành công"
- "Xóa người dùng thành công"

### ❌ Lỗi (đỏ)
- "Vui lòng nhập tên đăng nhập"
- "Mật khẩu phải có ít nhất 6 ký tự"
- "Mật khẩu xác nhận không khớp"
- "Lỗi tải dữ liệu người dùng"

### ℹ️ Thông tin (xanh dương)
- Các thông báo thông tin khác

**Lưu ý**: Thông báo sẽ tự động biến mất sau 3 giây

---

## 🔐 Validation & Lỗi

### Tên đăng nhập
❌ Lỗi:
- Để trống
- Trùng lặp với tài khoản khác

✅ Hợp lệ: "nguyenvana", "user123"

### Email
❌ Lỗi:
- Để trống
- Định dạng không hợp lệ

✅ Hợp lệ: "user@example.com", "abc@mail.co.uk"

### Mật khẩu
❌ Lỗi:
- Để trống (khi tạo mới)
- Dưới 6 ký tự
- Không khớp với xác nhận

✅ Hợp lệ: "password123", "123456"

### Vai trò
❌ Lỗi:
- Không chọn vai trò

✅ Hợp lệ: admin, staff, viewer

---

## 💡 Mẹo & Thủ thuật

### 1. Tìm kiếm nhanh
- Gõ từ khóa tìm kiếm
- Kết quả cập nhật tức thời (không cần ấn Enter)

### 2. Lọc kết hợp
- Có thể dùng tìm kiếm + lọc vai trò + lọc trạng thái cùng lúc
- Click "Reset" để xóa tất cả bộ lọc

### 3. Xem chi tiết trên grid
- Hover chuột vào thẻ để thấy hiệu ứng
- Click edit/delete ở góc phải thẻ

### 4. Pagination
- Phím mũi tên sau khi click vào trang cũng hoạt động
- Click số trang để nhảy trực tiếp

---

## ⚙️ API Backend

### Lấy danh sách người dùng
```
GET /users
Query params:
- search=keyword
- role=admin|staff|viewer
- status=active|inactive
```

### Tạo người dùng
```
POST /users
Body:
{
  "username": "newuser",
  "email": "user@email.com",
  "password": "password123",
  "role": "staff",
  "status": "active"
}
```

### Cập nhật người dùng
```
PUT /users/:id
Body: (tất cả trường tùy chọn)
{
  "email": "new@email.com",
  "password": "newpass",
  "role": "admin",
  "status": "inactive"
}
```

### Xóa người dùng
```
DELETE /users/:id
```

### Đếm người dùng
```
GET /users/count
Response:
{ "count": 15 }
```

---

## 🆘 Xử lý Sự cố

### Không thể tải danh sách người dùng
- **Nguyên nhân**: Server không chạy hoặc token hết hạn
- **Giải pháp**: 
  1. Kiểm tra server có đang chạy không
  2. Đăng xuất và đăng nhập lại
  3. Xóa cache trình duyệt

### Không thể thêm người dùng
- **Nguyên nhân**: Tên đăng nhập đã tồn tại hoặc validation không pass
- **Giải pháp**: Kiểm tra lại thông tin nhập vào

### Modal không mở
- **Nguyên nhân**: JavaScript không tải hoặc lỗi console
- **Giải pháp**:
  1. F12 mở DevTools
  2. Kiểm tra tab Console có lỗi gì không
  3. Reload trang

### Bộ lọc không hoạt động
- **Nguyên nhân**: Lỗi frontend
- **Giải pháp**: Reload trang, xóa cache

---

## 📞 Hỗ trợ

Nếu gặp vấn đề, vui lòng:
1. Kiểm tra tab Console (F12) để thấy thông báo lỗi
2. Reload trang
3. Đăng xuất và đăng nhập lại
4. Liên hệ với quản trị viên hệ thống

---

**Cập nhật lần cuối**: 22/11/2025  
**Phiên bản**: 2.0  
**Trạng thái**: ✅ Hoạt động bình thường
