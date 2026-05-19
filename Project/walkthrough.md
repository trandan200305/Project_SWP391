# LancerPro - Tối ưu hóa kiến trúc Backend (JPA) và Khởi động Tự động

Hệ thống đã được tối ưu hóa toàn diện nhằm đáp ứng mô hình chuẩn Spring Boot (MVC) sạch đẹp và giải quyết triệt để lỗi kết nối mỗi khi khởi động lại dự án.

---

## 1. Tối ưu hóa Kiến trúc Backend & Dùng JPA Repository

Thay vì để tầng Controller trực tiếp kết nối và truy vấn SQL thô thông qua `JdbcTemplate` như trước, hệ thống đã được tái cấu trúc thành mô hình 3 lớp sạch sẽ: **Controller $\to$ Service $\to$ Repository**.

### 🛠️ Các thay đổi đã thực hiện:
1. **Tạo tầng Service (`AdminService.java` & `AuthService.java`)**:
   - Chuyển toàn bộ logic nghiệp vụ, các câu lệnh truy vấn từ Controller sang Service.
   - Định nghĩa transaction điều phối an toàn qua annotation `@Transactional`.
2. **Chuyển đổi sang JPA Repository**:
   - Sử dụng `UserRepository`, `ProjectRepository`, và `JobCategoryRepository` để fetch dữ liệu từ Database thay thế hoàn toàn cho các câu lệnh SQL thô phức tạp trước đây.
   - Đảm bảo giữ nguyên cấu trúc JSON trả về để tương thích hoàn toàn với giao diện Frontend hiện có mà không gây lỗi giao diện.
3. **Tách biệt Controller (`AdminController.java` & `AuthController.java`)**:
   - Tối giản các Controller. Giờ đây Controller chỉ đóng vai trò nhận Request, gọi Service xử lý và điều phối dữ liệu trả về cho client.

---

## 2. Tối ưu hóa Trình khởi động tự động (`START_ALL.bat`)

Lỗi *"Không thể kết nối đến máy chủ"* thường xảy ra do các cổng dịch vụ (`8080` của Backend và `3000` của Frontend) bị chiếm dụng hoặc treo bởi các tiến trình nền chạy từ phiên trước đó.

### 🚀 Trình khởi động cải tiến tự động:
- **Tự động quét và giải phóng cổng 3000 & 8080**: Sử dụng lệnh hệ thống quét cổng và buộc tắt tiến trình đang chiếm dụng trước khi bắt đầu dịch vụ mới.
- **Buộc tắt Java Process cũ**: Tắt sạch mọi tiến trình `java.exe` bị treo nền để đảm bảo kết nối Database sạch sẽ.
- **Tạo khoảng trễ khởi chạy (Delay Buffer)**: Đợi 5 giây cho Spring Boot hoàn thành kết nối Database an toàn trước khi tự động kích hoạt Frontend.

---

## 3. Cách chạy dự án an toàn mỗi lần mở máy

Mỗi khi bạn mở dự án để chạy, chỉ cần thực hiện 1 bước duy nhất:
1. Double-click chạy file `START_ALL.bat` tại thư mục gốc dự án.
2. Trình khởi động sẽ tự động dọn dẹp các cổng bị treo, kích hoạt Backend, kết nối SQL Server và mở Frontend.
3. Bạn có thể truy cập ngay tại: **`http://localhost:3000`**.
