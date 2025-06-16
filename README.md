# Hệ thống quản lý điện thoại

Ứng dụng React để quản lý danh mục và điện thoại với giao diện đẹp và hiện đại.

## Tính năng

### Dashboard
- Hiển thị thống kê tổng quan
- Số lượng điện thoại, danh mục
- Giá trị tồn kho và giá trị trung bình
- Bảng điện thoại gần đây
- Danh sách các danh mục

### Quản lý danh mục
- Thêm, sửa, xóa danh mục
- Phân trang và tìm kiếm
- Khôi phục danh mục đã xóa

### Quản lý điện thoại
- Thêm, sửa, xóa điện thoại
- Upload ảnh đại diện và gallery ảnh
- Quản lý thông tin chi tiết (RAM, ROM, camera, giá cả...)
- Xem chi tiết sản phẩm
- Phân trang và tìm kiếm

## Cài đặt

```bash
# Di chuyển vào thư mục dự án
cd phone-management

# Cài đặt dependencies
npm install

# Chạy ứng dụng
npm start
```

## Cấu hình API

Tạo file `.env` trong thư mục gốc:

```env
REACT_APP_API_URL=http://localhost:8080/api/v1
```

## Công nghệ sử dụng

- **React 18** - Framework chính
- **Ant Design** - UI Components
- **React Router** - Routing
- **Axios** - HTTP Client
- **React Hooks** - State Management

## Cấu trúc dự án

```
src/
├── components/
│   ├── Dashboard.js          # Trang dashboard
│   ├── CategoryManagement.js # Quản lý danh mục
│   └── PhoneManagement.js    # Quản lý điện thoại
├── api/
│   └── index.js             # API calls
├── App.js                   # Component chính
├── index.js                 # Entry point
└── index.css               # Global styles
```

## API Endpoints

### Categories
- `POST /categories/create` - Tạo danh mục mới
- `PUT /categories/update/{id}` - Cập nhật danh mục
- `PUT /categories/restore/{id}` - Khôi phục danh mục
- `DELETE /categories/delete/{id}` - Xóa danh mục
- `GET /categories/all` - Lấy danh sách phân trang
- `GET /categories/all-list` - Lấy tất cả danh mục

### Phones
- `POST /phones/create` - Tạo điện thoại mới (form-data)
- `PUT /phones/update?id={id}` - Cập nhật điện thoại (form-data)
- `PUT /phones/restore?id={id}` - Khôi phục điện thoại (form-data)
- `DELETE /phones/delete/{id}` - Xóa điện thoại
- `GET /phones/{id}` - Lấy chi tiết điện thoại
- `GET /phones/all` - Lấy danh sách phân trang

## Tính năng đặc biệt

### Upload ảnh
- **Avatar**: Ảnh đại diện chính của sản phẩm
- **Gallery**: Nhiều ảnh bổ sung của sản phẩm
- Hỗ trợ preview và xóa ảnh
- Validation file type và size

### Responsive Design
- Tối ưu cho desktop và mobile
- Sidebar có thể thu gọn
- Table có scroll ngang trên mobile

### User Experience
- Loading states
- Error handling
- Success/Error messages
- Confirmation dialogs
- Form validation

## Screenshots

### Dashboard
![Dashboard với thống kê và biểu đồ]

### Quản lý điện thoại
![Giao diện quản lý điện thoại với upload ảnh]

### Form thêm/sửa
![Form thêm sửa điện thoại với upload avatar và gallery]
