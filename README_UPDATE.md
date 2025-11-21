# Hướng dẫn cập nhật hệ thống để sử dụng mã sản phẩm làm khóa chính

## Giới thiệu

Hệ thống đã được cập nhật để sử dụng mã sản phẩm (`custom_id`) làm khóa chính thay vì ID tự tăng. Điều này giúp:
- Người dùng có thể tự định nghĩa mã sản phẩm theo ý muốn
- Tránh tình trạng trùng lặp mã sản phẩm
- Tăng tính linh hoạt trong quản lý sản phẩm

## Các thay đổi chính

1. **Cơ sở dữ liệu**:
   - Trường `custom_id` trong bảng `products` trở thành khóa chính
   - Các bảng liên quan như `inventory`, `order_items`, `transfers`, v.v. đã được cập nhật để sử dụng `custom_id` làm khóa ngoại

2. **Backend**:
   - Model sản phẩm đã được cập nhật để kiểm tra trùng lặp mã sản phẩm
   - Các API liên quan đến sản phẩm đã được điều chỉnh để sử dụng `custom_id`

3. **Frontend**:
   - Giao diện đã được cập nhật để hiển thị thông báo lỗi khi mã sản phẩm bị trùng

## Cách cập nhật hệ thống

### 1. Sao lưu cơ sở dữ liệu

Trước khi thực hiện bất kỳ thay đổi nào, hãy sao lưu cơ sở dữ liệu hiện tại:

```bash
cp backend/database.db backend/database_backup.db
```

### 2. Chạy script migration (nếu có dữ liệu hiện có)

Nếu bạn đã có dữ liệu trong cơ sở dữ liệu, hãy chạy script migration:

```bash
cd backend
node migrate_products.js
```

Script này sẽ:
- Tự động tạo mã sản phẩm cho các sản phẩm hiện có theo định dạng `SP{id}`
- Cập nhật các bảng liên quan để sử dụng mã sản phẩm mới

### 3. Nếu không có dữ liệu hiện có

Nếu bạn bắt đầu với cơ sở dữ liệu mới, chỉ cần chạy script seed:

```bash
cd backend
node seed.js
```

### 4. Khởi động lại ứng dụng

Khởi động lại máy chủ backend và frontend để áp dụng các thay đổi.

## Kiểm tra chức năng

1. Thêm sản phẩm mới với mã tùy chọn
2. Thử thêm sản phẩm với mã đã tồn tại (phải nhận được thông báo lỗi)
3. Chỉnh sửa sản phẩm và thử thay đổi mã thành mã đã tồn tại (phải nhận được thông báo lỗi)
4. Kiểm tra các chức năng liên quan như chuyển kho, tồn kho, v.v.

## Lưu ý

- Khi cập nhật sản phẩm, nếu không thay đổi mã sản phẩm thì hệ thống sẽ giữ nguyên mã cũ
- Mã sản phẩm phải là duy nhất trong toàn bộ hệ thống
- Nếu gặp bất kỳ vấn đề nào, bạn có thể khôi phục lại bản sao lưu đã tạo