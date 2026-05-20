# 🚀 Hướng Dẫn Chạy Dự Án LancerPro (SWP391)

Tài liệu này hướng dẫn chi tiết từng bước để thiết lập cơ sở dữ liệu, khởi chạy Backend (Spring Boot) và Frontend (React + Vite) trên máy tính của bạn sau khi đã đồng bộ nhánh `thanh`.

---

## 📂 Cấu Trúc Thư Mục Dự Án
```text
Project_SWP391/
├── Database/
│   └── CNY.sql                  # File script khởi tạo Cơ sở dữ liệu mới nhất
└── Project/
    ├── backend/                 # Mã nguồn Spring Boot App
    │   └── run_backend.ps1      # Script khởi chạy nhanh Backend
    └── frontend/                # Giao diện React + Vite
```

---

## 🛠️ Bước 1: Thiết Lập Cơ Sở Dữ Liệu (SQL Server)

Do cơ sở dữ liệu của nhánh `thanh` được tối ưu hóa và thay đổi cấu trúc bảng, bạn cần tạo mới lại database `CNY`.

1. **Xóa Database cũ (nếu có):**
   * Mở SQL Server Management Studio (SSMS).
   * Nhấp chuột phải vào database `CNY` -> chọn **Delete**.
   * **Quan trọng:** Tích chọn vào ô **`Close existing connections`** ở góc dưới cùng bên trái của bảng Delete hiện ra để ngắt các kết nối đang hoạt động của Backend, sau đó nhấn **OK**.
2. **Khởi tạo Database mới:**
   * Click chuột phải vào mục **Databases** -> chọn **New Database...** -> Nhập tên Database là `CNY` rồi nhấn **OK**.
3. **Chạy Script cấu trúc bảng:**
   * Mở file script SQL tại đường dẫn: `Database/CNY.sql` bằng SSMS.
   * Đảm bảo trên thanh công cụ của SSMS đã chọn đúng database là `CNY` (hoặc có dòng `USE CNY;` ở đầu file).
   * Nhấn **Execute (F5)** để khởi tạo toàn bộ bảng dữ liệu và dữ liệu mẫu (seed data).

---

## ☕ Bước 2: Khởi Chạy Backend (Spring Boot)

1. Mở dự án `Project_SWP391` bằng VS Code.
2. Mở một **Terminal mới** (nhấn phím `Ctrl + \``).
3. Di chuyển Terminal vào thư mục `backend`:
   ```powershell
   cd Project/backend
   ```
4. Chạy Backend bằng lệnh sau để tự động vượt qua hàng rào bảo mật Windows (Execution Policy):
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\run_backend.ps1
   ```
   * *Hệ thống sẽ tự động tắt tiến trình cũ ở cổng 8080 (nếu có), thiết lập Java 17 và khởi động Spring Boot qua Maven.*
   * **Lưu ý:** Giữ Terminal này luôn mở trong suốt quá trình test dự án để duy trì Backend hoạt động.

---

## ⚛️ Bước 3: Khởi Chạy Frontend (React + Vite)

Vì tab Terminal hiện tại đang chạy Backend, bạn cần mở một tab Terminal mới để chạy Frontend:

1. Click vào biểu tượng **dấu cộng (`+`)** ở góc trên bên phải khung Terminal (hoặc nhấn `Ctrl + Shift + \``) để mở một tab Terminal mới.
2. Di chuyển Terminal mới vào thư mục `frontend`:
   ```powershell
   cd Project/frontend
   ```
3. Khởi chạy dự án Frontend:
   ```powershell
   npm run dev
   ```
   * *Nếu đây là lần đầu tiên bạn tải code về hoặc sau khi cập nhật thư viện mới, hãy chạy lệnh `npm install` trước rồi mới chạy `npm run dev`.*

---

## 🌐 Địa Chỉ Truy Cập Hệ Thống

Sau khi cả Backend và Frontend đều đã chạy thành công:

* 💻 **Giao diện Người dùng (Frontend):** Truy cập link hiển thị trên terminal (thông thường là [http://localhost:5173](http://localhost:5173)).
* 🛡️ **Tài khoản Admin kiểm thử hệ thống:**
  * **Email:** `illyasviel1252004@gmail.com` hoặc `admin@lancerpro.com`
  * **Chức năng:** Truy cập toàn quyền vào giao diện quản trị Admin Dashboard (Quản lý người dùng, Kế toán & Phê duyệt rút tiền, Duyệt tin tuyển dụng, Năng suất hệ thống và Audit logs).
* 🔌 **Cổng API (Backend):** [http://localhost:8080/api](http://localhost:8080/api)
