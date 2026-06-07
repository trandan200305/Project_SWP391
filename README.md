# vLance Freelance Marketplace (LancerPro)

Chào mừng bạn đến với dự án **vLance Freelance Marketplace** (tên gọi khác: **LancerPro**). Đây là một nền tảng kết nối giữa các Nhà tuyển dụng (Employers) có nhu cầu thuê nhân sự và các Freelancers có năng lực muốn nhận dự án.

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

### 💻 Backend
*   **Ngôn ngữ:** Java 17
*   **Framework:** Spring Boot 3.x
*   **Bảo mật:** Spring Security, JWT (Json Web Token) để phân quyền và xác thực
*   **Database ORM:** Spring Data JPA, Hibernate
*   **Giao thức Real-time:** WebSocket (STOMP qua SockJS) để phục vụ kênh chat trực tuyến
*   **Cơ sở dữ liệu:** SQL Server (Tên database: `CNY`)

### 🎨 Frontend
*   **Framework:** React 18, Vite
*   **Styling:** Vanilla CSS & Tailwind CSS
*   **Thư viện Icon:** Lucide React

---

## 🌟 Các Tính Năng Đang Phát Triển
*   **Đăng ký & Đăng nhập phân vai:** Hỗ trợ 3 nhóm tài khoản chính: Freelancer, Employer và Admin (Quản trị viên).
*   **Mã PIN Bảo Mật (Messenger PIN):** Yêu cầu mã PIN 4 số riêng biệt để bảo mật trước khi truy cập vào hộp thư tin nhắn.
*   **Kênh Hỗ Trợ Kỹ Thuật (Live Support):** Cho phép người dùng chat trực tuyến thời gian thực với Admin khi gặp lỗi hoặc sự cố.
*   **Đăng tuyển & Đấu thầu dự án:** (Đang phát triển) Đăng tin tuyển dụng và gửi đề xuất (proposal) báo giá.

---

## 🚀 Hướng Dẫn Khởi Chạy Dự Án (Local Development)

Dự án đã được cấu hình sẵn kịch bản chạy nhanh ở thư mục gốc giúp bạn khởi chạy cả Backend và Frontend chỉ bằng một click chuột.

### Bước 1: Cấu hình Cơ sở dữ liệu
Đảm bảo bạn đã cài đặt SQL Server và đã tạo Database tên là `CNY`. 

### Bước 2: Chạy dự án
Tại thư mục gốc của dự án, bạn nhấn đúp chuột (Double click) vào file:
*   [run_project.bat](file:///e:/Ky5/SWP391/Project_SWP391/run_project.bat) (Windows Batch Script)

Script này sẽ tự động:
1. Giải phóng (kill) các cổng `8080` và `3000` nếu đang bị chiếm dụng.
2. Khởi chạy ứng dụng **Spring Boot Backend** trên cổng `8080`.
3. Khởi chạy ứng dụng **React Frontend** trên cổng `3000`.

### Đường dẫn truy cập:
*   **Frontend UI:** `http://localhost:3000` (hoặc `http://localhost:5173`)
*   **Backend API:** `http://localhost:8080`

---

## 📈 Lộ Trình Phát Triển Dự Án (Project Roadmap)

Dự án được phân chia phát triển theo mô hình Agile/Scrum qua các giai đoạn (Phase) nhằm tối ưu hóa trải nghiệm người dùng và tính bảo mật của hệ thống giao dịch:

### 📍 Giai đoạn 1: Nền tảng & Xác thực (Hiện tại)
*   [x] Thiết kế cơ sở dữ liệu quan hệ hoàn chỉnh trên **SQL Server**.
*   [x] Xây dựng cổng xác thực tập trung mã hóa JWT và cơ chế bảo mật phân vai người dùng.
*   [x] Tích hợp **Messenger PIN** nâng cao để bảo vệ quyền riêng tư hộp thư.
*   [x] Phát triển kênh hỗ trợ kỹ thuật thời gian thực giữa Khách hàng và Quản trị viên (Admin Support Chat).

### 📍 Giai đoạn 2: Quản lý Dự án & Đấu thầu (Sắp tới)
*   [ ] **Phía Employer:** Phát triển bộ công cụ đăng dự án, đặt ngân sách, mô tả yêu cầu công việc chi tiết và quản lý danh sách Freelancer ứng tuyển.
*   [ ] **Phía Freelancer:** Xây dựng trang hồ sơ năng lực (Portfolio), CV cá nhân, hiển thị kỹ năng và tính năng ứng tuyển, đấu thầu dự án (gửi Proposal đề xuất chi phí & thời gian bàn giao).
*   [ ] **Bộ lọc thông minh:** Cho phép tìm kiếm dự án/freelancer theo khoảng giá, kỹ năng, lĩnh vực và độ uy tín.

### 📍 Giai đoạn 3: Chat P2P & Hệ thống Ký quỹ (Escrow Payment)
*   [ ] **Ký quỹ bảo mật (Escrow):** Tích hợp cổng thanh toán trực tuyến (**VNPay**, **Momo** hoặc **PayPal**). Hệ thống sẽ đứng ra giữ tiền đặt cọc của Employer khi dự án bắt đầu và tự động giải ngân cho Freelancer khi nghiệm thu thành công, loại bỏ hoàn toàn rủi ro gian lận tài chính cho cả hai bên.
*   [ ] **Kênh Chat P2P:** Mở kênh chat trực tiếp giữa Freelancer và Employer sau khi dự án được duyệt.

### 📍 Giai đoạn 4: Trung tâm Tranh chấp & Đánh giá
*   [ ] **Trung tâm giải quyết tranh chấp (Dispute Center):** Admin đứng ra phân xử và hoàn tiền ký quỹ về tài khoản phù hợp nếu một trong hai bên vi phạm hợp đồng hoặc bàn giao trễ hạn.
*   [ ] **Đánh giá hai chiều (Review & Rating):** Hệ thống xếp hạng 5 sao kèm phản hồi chi tiết sau khi dự án kết thúc để định hình hệ sinh thái freelancer chất lượng cao.

