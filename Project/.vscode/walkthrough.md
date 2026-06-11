# Hướng dẫn Khởi chạy Dự án vLance & Sử dụng Tính năng Đăng nhập/Đăng ký Mới

Mình đã tải thành công toàn bộ thư mục **`Project`** từ GitHub của bạn về máy tính tại thư mục làm việc:
👉 **`C:\Users\admin\Downloads\Project_SWP391\Project_SWP391\Project`**

Đồng thời, mình đã **tích hợp thành công các cập nhật mới nhất từ commit `0721d10` của bạn**, bao gồm hai modal **Đăng nhập (Login)** và **Đăng ký (Register)** cực kỳ chuyên nghiệp và hiện đại trực tiếp lên trang chủ.

Dưới đây là các bước chi tiết để bạn khởi chạy và trải nghiệm:

---

## 🛠️ Bước 1: Thiết lập Database SQL Server
1. Mở phần mềm **SQL Server Management Studio (SSMS)** trên máy của bạn.
2. Tạo một cơ sở dữ liệu mới đặt tên là: **`CNY`**
3. Mở file script SQL có sẵn trong dự án: **`C:\Users\admin\Downloads\Project_SWP391\Project_SWP391\Project\CNY.sql`**
4. Chạy (Execute) file script này để khởi tạo cấu trúc bảng.

---

## ☕ Bước 2: Chạy Backend (Spring Boot)
1. Mở thư mục dự án **`Project`** trên **VS Code** (chọn `File` > `Open Folder` > chọn thư mục `Project`).
2. Mở file cấu hình database của backend tại đường dẫn:
   `Project/backend/src/main/resources/application.properties`
3. Thay thế password SQL Server của bạn tại dòng 12:
   ```properties
   spring.datasource.password=MậtKhẩuSQLServerCủaBạn
   ```
4. Mở Terminal mới trong VS Code (`Ctrl + ~`) và chạy lệnh sau để khởi động Backend:
   ```powershell
   cd backend; cmd.exe /c "mvnw spring-boot:run"
   ```
   *(Backend sẽ khởi chạy ở cổng `8080`. Khi chạy lần đầu, Spring Boot sẽ tự động chạy file `DataSeeder.java` để nạp toàn bộ dữ liệu mẫu tuyệt đẹp gồm danh mục công việc, 6 dự án mẫu và 4 freelancers xuất sắc vào cơ sở dữ liệu SQL Server của bạn).*

---

## ⚛️ Bước 3: Chạy Frontend (React Vite)
1. Mở một **Terminal mới** song song trong VS Code (nhấn dấu `+` ở góc cửa sổ Terminal).
2. Chạy lệnh sau để khởi động Frontend:
   ```powershell
   cd frontend; cmd.exe /c "npm run dev"
   ```
3. Mở trình duyệt và truy cập: `http://localhost:3001/` (hoặc cổng hiển thị trong terminal của bạn).

---

## 🎉 Trải nghiệm Tính năng Đăng nhập & Đăng ký Mới:
- **Đăng nhập (Login Modal):** Click nút **Đăng nhập** ở thanh Menu. Giao diện modal kính mờ (glassmorphic backdrop blur) cao cấp sẽ xuất hiện. Bạn có thể chọn vai trò (Freelancer hoặc Employer), điền email/mật khẩu và trải nghiệm hiệu ứng loading kết nối cực kỳ mượt mà.
- **Chuyển đổi Linh hoạt:** Nhấp vào **"Create a free profile"** ở góc dưới modal đăng nhập để chuyển ngay sang giao diện **Đăng ký (Register Modal)** với đầy đủ các trường thông tin chuẩn chỉ, bảo mật.
- **Đăng ký (Register Modal):** Điền các trường thông tin (Họ tên, Tên hiển thị, Email, Số điện thoại, Mật khẩu), đồng ý điều khoản dịch vụ và nhấp tạo hồ sơ để hoàn thành quy trình một cách trơn tru.

---
*Hãy khởi chạy dự án và tận hưởng giao diện chuyên nghiệp LancerPro nhé! Nếu gặp bất kỳ vấn đề gì, bạn cứ nhắn trực tiếp tại đây để mình hỗ trợ ngay lập tức!*
