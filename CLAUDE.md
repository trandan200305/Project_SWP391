# CLAUDE.md — Project Memory & Architecture Guide
# Version: 1.0.0 | Updated: 2026-05-27 | Project: vLance Freelance Marketplace (CNY)

## TL;DR (Đọc nhanh — 60 giây)
- **Hệ thống:** vLance Freelance Marketplace — Kết nối Client (Nhà tuyển dụng) và Freelancer (Người tìm việc).
- **Backend:** Spring Boot (Java 17, Maven, REST APIs on port `8080`, WebSocket for notifications/chat).
- **Frontend:** React (Vite on port `3000`/`5173`, Vanilla CSS & Tailwind CSS).
- **Database:** SQL Server (Database `CNY` on port `1433`, concrete actor tables per class).
- **Ký quỹ (Escrow):** Đảm bảo an toàn tài chính: Client ký quỹ -> Freelancer hoàn thành công việc -> Client nghiệm thu -> Hệ thống giải ngân cho Freelancer.

---

## 1. KIẾN TRÚC HỆ THỐNG & LUỒNG DỮ LIỆU
### Các Service & Cổng chính:
| Component | Tech Stack | Port | Thư mục | Mô tả |
| :--- | :--- | :--- | :--- | :--- |
| **Backend API** | Spring Boot, Spring Security (JWT), WebSocket | `8080` | `/Project/backend` | Cung cấp RESTful APIs & WebSocket broker |
| **Frontend UI** | React, Vite, Axios | `3000` / `5173` | `/Project/frontend` | Giao diện người dùng SPA |
| **Database** | SQL Server | `1433` | `/Database` | Chứa script DDL `CNY.sql` và tài liệu ngữ cảnh |

### Phân Tách Đối Tượng (Concrete Actor Separation):
Hệ thống được thiết kế theo nguyên tắc phân tách đối tượng tuyệt đối ở mức Database (Table Per Class). Không sử dụng một bảng `users` chung, thay vào đó:
- `freelancers`: Chứa thông tin và tài khoản đăng nhập của Freelancer.
- `employers`: Chứa thông tin doanh nghiệp/tuyển dụng của Client.
- `admins`: Tài khoản Quản trị viên hệ thống.
Tất cả các bảng này đều có cấu trúc đăng nhập riêng độc lập, liên kết với `login_history` để ghi nhật ký đăng nhập.

---

## 2. QUYẾT ĐỊNH KIẾN TRÚC QUAN TRỌNG (ADR)
- **ADR-001: Separation of User Tables (Bảng thực thể độc lập)**
  - *Lý do:* Freelancer và Employer có thuộc tính nghiệp vụ hoàn toàn khác nhau. Việc gộp chung vào bảng `users` gây ra quá nhiều cột NULL hoặc bảng quan hệ 1-1 phức tạp. Việc tách riêng bảng giúp tăng tốc độ truy vấn, bảo mật phân quyền tuyệt đối và dễ dàng bảo trì.
- **ADR-002: Escrow Wallet System (Hệ thống ví ký quỹ)**
  - *Lý do:* Giải quyết vấn đề quỵt tiền hoặc bùng việc. Tiền thanh toán cột mốc (Milestone) được trích từ ví Client và khóa trong ví Ký quỹ (`escrow_transactions`). Chỉ được giải ngân sang ví Freelancer sau khi được Client nghiệm thu hoặc Admin phân xử thắng tranh chấp.
- **ADR-003: WebSocket for Real-time Notifications & Chat**
  - *Lý do:* Giao tiếp trực tiếp và tức thời giữa Client và Freelancer là yếu tố sống còn của một sàn giao dịch. Kết nối WebSocket đảm bảo tin nhắn (`messages`) và thông báo (`notifications`) được đẩy trực tiếp theo thời gian thực mà không cần polling liên tục.

---

## 3. PATTERNS CẦN TUÂN THỦ (PATTERNS TO FOLLOW)
- **Backend (Spring Boot):**
  - **Controller - Service - Repository (JPA):** Tuyệt đối không viết logic nghiệp vụ trong Controller. Controller chỉ làm nhiệm vụ parse Request, validate dữ liệu đầu vào (`@Valid`), và return Response.
  - **DTO (Data Transfer Object):** Luôn sử dụng DTO để nhận dữ liệu từ Request và trả dữ liệu ra Response. Tránh phơi bày trực tiếp Entity của Database ra ngoài API.
  - **Global Exception Handling:** Tất cả lỗi phải được bắt và định dạng lại qua `@RestControllerAdvice` để trả về JSON dạng `{ "error": "ERROR_CODE", "message": "User-friendly message", "timestamp": "..." }`.
- **Frontend (React):**
  - **Component Separation:** Các Component lớn phải được chia nhỏ thành các Component con có tính tái sử dụng cao.
  - **Axios Instance:** Luôn sử dụng Axios instance đã được cấu hình sẵn base URL và tự động đính kèm JWT token từ `localStorage` hoặc `sessionStorage` trong HTTP Headers.

---

## 4. CẤU TRÚC THƯ MỤC DỰ ÁN
```
/
├── Database/
│   ├── CNY.sql             # Script khởi tạo toàn bộ CSDL SQL Server
│   └── context.md          # Giải thích chi tiết các Use Cases & luồng dữ liệu
├── Project/
│   ├── backend/            # Mã nguồn Spring Boot (Java)
│   │   ├── src/main/java/com/cny/backend/
│   │   │   ├── config/     # Spring Security, WebSocket, MVC configs
│   │   │   ├── controller/ # REST Endpoints
│   │   │   ├── entity/     # JPA Entities (freelancers, employers, admins,...)
│   │   │   ├── repository/ # Spring Data JPA Repositories
│   │   │   └── service/    # Business logic implementation
│   │   └── pom.xml         # File cấu hình dependencies Maven
│   ├── frontend/           # Giao diện React SPA
│   │   ├── src/
│   │   │   ├── components/ # Các components UI (Register.jsx, Login.jsx,...)
│   │   │   ├── assets/     # Hình ảnh, stylesheets
│   │   │   └── App.jsx     # Main entry component
│   │   └── package.json    # File cấu hình thư viện npm
│   └── RUN_GUIDE.md        # Hướng dẫn khởi chạy dự án
├── AGENTS.md               # Hiến pháp quy định hành vi của AI Agent
└── CLAUDE.md               # File hiện tại - Bộ nhớ kiến trúc của dự án
```

---

## 5. NHỮNG BÀI HỌC KINH NGHIỆM (LESSONS LEARNED)
- **Database Lock & Deadlocks:** Khi Client và Freelancer cùng thao tác trên ví tiền hoặc hợp đồng, cần sử dụng giao dịch ở mức cô lập thích hợp (Optimistic Locking hoặc DB Transaction) để tránh tình trạng deadlock hoặc trừ tiền hai lần.
- **WebSocket Session Management:** Luôn dọn dẹp các session WebSocket không hoạt động để tránh rò rỉ bộ nhớ (memory leak) trên máy chủ.
- **Passwords Leak in Logs:** Tránh in log thô (`toString()`) các đối tượng DTO chứa mật khẩu. Hãy loại bỏ trường mật khẩu hoặc ẩn đi trước khi in log.

---

## AUTO MEMORY (Claude Code appends here)
# [AI Agents will automatically append learning entries here during active coding sessions]
