# Login & Register - Các file liên quan

## Frontend

### `frontend/src/App.jsx`
- Lưu thông tin user sau khi đăng nhập thành công.
- Hàm chính: `handleLoginSuccess(userData)`.
- Điều hướng về `home` sau khi login/register Google thành công.

### `frontend/src/routes/AppRoutes.jsx`
- Quyết định hiển thị modal login hay register.
- `currentPage === 'login'` -> hiển thị `LoginModal`.
- `currentPage === 'register'` -> hiển thị `RegisterModal`.

### `frontend/src/features/auth/components/LoginModal.jsx`
- Giao diện đăng nhập.
- Nhận email, password, role.
- Gọi API login qua `authApi.login(...)`.
- Xử lý Google login.
- Xử lý quên mật khẩu: gửi OTP, xác minh OTP, reset password.

### `frontend/src/features/auth/components/RegisterModal.jsx`
- Giao diện đăng ký.
- Nhận full name, display name, phone, email, password, role.
- Gọi API đăng ký qua `authApi.register(...)`.
- Hiển thị lỗi trùng email, phone, display name.
- Có xử lý đăng ký/đăng nhập bằng Google.

### `frontend/src/features/auth/api/authApi.js`
- Tập trung các hàm gọi API auth.
- Hàm chính:
  - `login(...)`
  - `register(...)`
  - `forgotPassword(...)`
  - `verifyCode(...)`
  - `resetPassword(...)`

### `frontend/src/api/endpoints.js`
- Khai báo đường dẫn API.
- Endpoint chính:
  - `LOGIN: '/auth/login'`
  - `REGISTER: '/auth/register'`

### `frontend/src/api/apiClient.js`
- Cấu hình `BASE_URL = 'http://localhost:8080/api'`.
- Gọi request bằng `fetch`.
- Tự động gửi/nhận JSON.
- Xử lý lỗi từ backend.

## Backend

### `backend/src/main/java/com/cny/backend/auth/controller/AuthController.java`
- Nhận request login/register từ frontend.
- API chính:
  - `POST /auth/login`
  - `POST /auth/register`
  - `POST /auth/forgot-password`
  - `POST /auth/verify-code`
  - `POST /auth/reset-password`
- Kiểm tra dữ liệu đầu vào.
- Gọi `AuthService` để xử lý logic.

### `backend/src/main/java/com/cny/backend/auth/service/AuthService.java`
- Xử lý logic đăng nhập và đăng ký.
- Tìm user theo email trong các bảng.
- Kiểm tra role, password, trạng thái tài khoản.
- Tạo tài khoản mới khi đăng ký.
- Mã hóa password bằng `PasswordEncoder`.
- Cập nhật `lastLoginAt`.
- Ghi lịch sử đăng nhập.

### `backend/src/main/java/com/cny/backend/config/SecurityConfig.java`
- Cấu hình Spring Security.
- Tạo `PasswordEncoder` dùng BCrypt.
- Cấu hình CORS.
- Tạm thời cho phép request trong Sprint 1.

### `backend/src/main/java/com/cny/backend/user/entity/Freelancer.java`
- Entity map với bảng `freelancers`.
- Lưu thông tin tài khoản Freelancer.

### `backend/src/main/java/com/cny/backend/user/entity/Employer.java`
- Entity map với bảng `employers`.
- Lưu thông tin tài khoản Employer.

### `backend/src/main/java/com/cny/backend/admin/entity/Admin.java`
- Entity map với bảng `admins`.
- Dùng khi đăng nhập tài khoản Admin.

### `backend/src/main/java/com/cny/backend/user/repository/FreelancerRepository.java`
- Truy vấn database bảng `freelancers`.
- Dùng để tìm email, đếm email/phone/display name.
- Lưu tài khoản Freelancer.

### `backend/src/main/java/com/cny/backend/user/repository/EmployerRepository.java`
- Truy vấn database bảng `employers`.
- Dùng để tìm email, đếm email/phone/display name.
- Lưu tài khoản Employer.

### `backend/src/main/java/com/cny/backend/admin/repository/AdminRepository.java`
- Truy vấn database bảng `admins`.
- Dùng khi login Admin và kiểm tra email trùng.

### `backend/src/main/java/com/cny/backend/auth/repository/LoginHistoryRepository.java`
- Lưu lịch sử đăng nhập vào database.

### `backend/src/main/resources/application.properties`
- Cấu hình server port và context path.
- `server.port=8080`
- `server.servlet.context-path=/api`
- Cấu hình kết nối SQL Server.

## Luồng ngắn gọn

### Register
```txt
RegisterModal.jsx
-> authApi.register()
-> apiClient.js
-> POST /api/auth/register
-> AuthController.register()
-> AuthService.login(... isRegistration=true)
-> Repository
-> Database
```

### Login
```txt
LoginModal.jsx
-> authApi.login()
-> apiClient.js
-> POST /api/auth/login
-> AuthController.login()
-> AuthService.login()
-> Repository
-> Database
```
