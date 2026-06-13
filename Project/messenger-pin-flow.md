# Messenger PIN - Các file liên quan

## Frontend

### `frontend/src/components/common/Navbar.jsx`

- File chính xử lý mã PIN Messenger.
- Mở modal nhập PIN khi user muốn vào Messenger.
- Nếu user đã có PIN thì gọi API kiểm tra PIN qua `authApi.verifyPin(...)`.
- Nếu user chưa có PIN thì cho tạo PIN mới qua `authApi.setPin(...)`.
- Nếu quên PIN thì gọi API gửi PIN tạm thời về email qua `authApi.forgotPin(...)`.
- **Đã tối ưu hóa:** Toàn bộ luồng kết nối API đã được chuyển sang dùng `authApi` và `apiClient`, không còn dùng `fetch` trực tiếp với URL cứng.

### `frontend/src/features/messenger/pages/MessengerPage.jsx`

- Trang tin nhắn chính.
- User chỉ được chuyển vào đây sau khi nhập đúng PIN.

### `frontend/src/api/endpoints.js`

- Khai báo endpoint liên quan PIN:
  - `SET_PIN: '/auth/set-messenger-pin'`
  - `VERIFY_PIN: '/auth/verify-messenger-pin'`
  - `FORGOT_PIN: '/auth/forgot-messenger-pin'`

### `frontend/src/features/auth/api/authApi.js`

- Chứa các hàm API liên quan PIN gọi qua `apiClient`:
  - `setPin(pinData)`: Gửi yêu cầu thiết lập mã PIN mới.
  - `verifyPin(pinData)`: Gửi yêu cầu xác thực mã PIN người dùng nhập.
  - `forgotPin(pinData)`: Gửi yêu cầu khôi phục mã PIN (nhận mã tạm thời qua email).
- **Đã cập nhật:** Sửa hàm `forgotPin` nhận đối tượng `pinData` (`{ userId, role }`) để tương thích hoàn toàn với Backend (thay vì truyền chỉ `{ email }` như phiên bản cũ).

## Backend

### `backend/src/main/java/com/cny/backend/auth/controller/AuthController.java`

- Nhận request liên quan mã PIN Messenger.
- API chính:
  - `POST /auth/set-messenger-pin`
  - `POST /auth/verify-messenger-pin`
  - `POST /auth/forgot-messenger-pin`
- Kiểm tra dữ liệu đầu vào.
- Gọi `AuthService` để xử lý logic.

### `backend/src/main/java/com/cny/backend/auth/service/AuthService.java`

- Xử lý logic chính của mã PIN.
- Hàm chính:
  - `setMessengerPin(...)`
  - `verifyMessengerPin(...)`
  - `resetAndEmailMessengerPin(...)`
- Lưu PIN mới vào user.
- Kiểm tra PIN người dùng nhập.
- Tạo PIN tạm thời và gửi về email khi user quên PIN.

### `backend/src/main/java/com/cny/backend/user/entity/Freelancer.java`

- Có field `messengerPin`.
- Map với cột `messenger_pin` trong bảng `freelancers`.

### `backend/src/main/java/com/cny/backend/user/entity/Employer.java`

- Có field `messengerPin`.
- Map với cột `messenger_pin` trong bảng `employers`.

### `backend/src/main/java/com/cny/backend/admin/entity/Admin.java`

- Có field `messengerPin`.
- Dùng cho tài khoản Admin.

### `backend/src/main/java/com/cny/backend/admin/entity/Manager.java`

- Có field `messengerPin`.
- Dùng cho tài khoản Manager.

### `backend/src/main/java/com/cny/backend/admin/entity/Staff.java`

- Có field `messengerPin`.
- Dùng cho tài khoản Staff.

### Repository liên quan

- `FreelancerRepository.java`
- `EmployerRepository.java`
- `AdminRepository.java`
- `ManagerRepository.java`
- `StaffRepository.java`

Các repository này được `AuthService` dùng để tìm user theo `userId`, sau đó lưu hoặc kiểm tra `messenger_pin`.

## Luồng ngắn gọn

### User đã có PIN

```txt
Navbar.jsx
-> nhập PIN
-> authApi.verifyPin()
-> POST /api/auth/verify-messenger-pin (apiClient.js)
-> AuthController.verifyMessengerPin()
-> AuthService.verifyMessengerPin()
-> Repository tìm user
-> so sánh với messenger_pin trong database
-> đúng thì vào MessengerPage.jsx
```

### User chưa có PIN

```txt
Navbar.jsx
-> nhập PIN mới lần 1
-> nhập lại PIN lần 2 để xác nhận (phải khớp lần 1)
-> authApi.setPin()
-> POST /api/auth/set-messenger-pin (apiClient.js)
-> AuthController.setMessengerPin()
-> AuthService.setMessengerPin()
-> lưu vào cột messenger_pin
-> vào MessengerPage.jsx
```

### User quên PIN

```txt
Navbar.jsx
-> bấm quên PIN
-> authApi.forgotPin()
-> POST /api/auth/forgot-messenger-pin (apiClient.js)
-> AuthController.forgotMessengerPin()
-> AuthService.resetAndEmailMessengerPin()
-> tạo PIN tạm thời
-> gửi PIN tạm thời về email
-> user nhập PIN tạm thời
-> nếu đúng thì bắt tạo PIN mới
```

## Ghi chú

- `isTemporary`: PIN tạm thời do hệ thống gửi qua email.
- `isConfirmingPin`: bước nhập lại PIN mới lần 2 để xác nhận.
- `messenger_pin`: cột lưu mã PIN trong database.
- Hiện tại PIN đang được lưu trực tiếp, chưa thấy mã hóa như password.
