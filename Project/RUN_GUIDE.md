# Hướng dẫn chạy dự án (Run Guide)

Dự án này gồm 2 phần chính: Backend (Spring Boot) và Frontend (React + Vite), kết nối với cơ sở dữ liệu SQL Server.

## 1. Yêu cầu tiên quyết
- Cài đặt **Java 17** (Đã có sẵn trong máy bạn).
- Cài đặt **Node.js** (Đã có sẵn trong máy bạn).
- Đảm bảo SQL Server đang chạy ở cổng `1433` và có database tên là `CNY`.

---

## 2. Các bước chạy dự án

### Bước 1: Chạy Backend (Spring Boot)
1. Mở một Terminal mới trong VS Code.
2. Di chuyển vào thư mục `backend`:
   ```powershell
   cd backend
   ```
3. Chạy lệnh khởi động Backend:
   ```powershell
   mvn spring-boot:run
   ```
*Lưu ý: Giữ Terminal này luôn mở để duy trì Backend hoạt động.*

### Bước 2: Chạy Frontend (React + Vite)
1. Mở thêm một Terminal mới (Bấm dấu `+` ở góc phải cụm Terminal).
2. Di chuyển vào thư mục `frontend`:
   ```powershell
   cd frontend
   ```
3. (Tùy chọn) Nếu là lần đầu tiên chạy hoặc mới tải code về, cần cài đặt thư viện:
   ```powershell
   npm install
   ```
4. Chạy lệnh khởi động Frontend:
   ```powershell
   npm run dev
   ```

---

## 3. Truy cập hệ thống
Sau khi cả 2 lệnh trên chạy thành công, bạn có thể truy cập:
- **Giao diện người dùng (Frontend):** `http://localhost:3000` (hoặc `http://localhost:5173` tùy thuộc vào log hiển thị của Vite).
- **Cổng API (Backend):** `http://localhost:8080/api`
