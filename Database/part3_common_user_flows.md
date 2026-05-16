# Phần 3: Phân tích Luồng Nghiệp vụ — NGƯỜI DÙNG CHUNG

> **Dự án:** vLance Freelance Marketplace — SWP391  
> **Phạm vi:** UC-43 → UC-62 (Common User — tất cả roles)

---

## A. XÁC THỰC & TÀI KHOẢN

---

### UC-43: Đăng nhập | Level 1 | Iteration 1

| Hạng mục | Chi tiết |
|---|---|
| **Actor** | Tất cả User (Freelancer, Client, Admin) |
| **Precondition** | Đã có tài khoản, status = `ACTIVE` |

**Main Flow:**
1. Nhập Email + Mật khẩu
2. Hệ thống validate credentials (BCrypt compare)
3. Kiểm tra status: `ACTIVE` → cho phép, `LOCKED`/`BANNED` → từ chối kèm thông báo
4. Tạo session / JWT token (TTL = 24h, refresh token = 7 ngày)
5. Redirect theo role:
   - `FREELANCER` → Freelancer Dashboard
   - `CLIENT` → Client Dashboard
   - `ADMIN` / `SUPER_ADMIN` → Admin Panel
6. Ghi login log: user_id, IP, user_agent, timestamp

**Alternative Flow:**
- Sai mật khẩu 5 lần liên tục → lock tạm 15 phút (brute-force protection)
- Account chưa verify email → thông báo + nút gửi lại email
- Đăng nhập qua Google OAuth 2.0 (nếu đã liên kết)

**Business Rules:**
- Session single-device hoặc multi-device (cấu hình)
- Mỗi lần đăng nhập ghi lại vào `login_history`

**Bảng liên quan:** `users`, `login_history`, `sessions`

---

### UC-44: Quên mật khẩu | Level 1 | Iteration 1

**Main Flow:**
1. Nhấn "Quên mật khẩu" → nhập email đã đăng ký
2. Hệ thống kiểm tra email tồn tại
3. Gửi email chứa reset link (token, TTL = 1 giờ)
4. User click link → nhập mật khẩu mới + xác nhận
5. Validate: ≥ 8 ký tự, chữ hoa + số + ký tự đặc biệt, khác mật khẩu cũ
6. Cập nhật password hash, invalidate tất cả sessions hiện tại
7. Redirect → trang đăng nhập

**Alternative Flow:**
- Email không tồn tại → vẫn hiển thị "Đã gửi email" (bảo mật, không leak thông tin)
- Token hết hạn → thông báo, cho phép gửi lại

**Business Rules:**
- Mỗi token chỉ dùng 1 lần (one-time use)
- Rate limit: max 3 request/email/giờ

**Bảng liên quan:** `password_reset_tokens`

---

### UC-46: Cài đặt chung | Level 2 | Iteration 1

**Main Flow:**
1. Truy cập "Cài đặt tài khoản"
2. Thay đổi:
   - Tên hiển thị (Display Name)
   - Đổi mật khẩu (nhập mật khẩu cũ + mật khẩu mới)
   - Ảnh đại diện
   - Ngôn ngữ hiển thị
   - Múi giờ
3. Liên kết / hủy liên kết Google OAuth
4. Xóa tài khoản (soft delete, yêu cầu xác nhận bằng mật khẩu)

**Business Rules:**
- Xóa tài khoản: chỉ cho phép nếu không có dự án đang `IN_PROGRESS` và ví số dư = 0
- Tài khoản bị xóa → status = `DEACTIVATED`, giữ data 30 ngày trước khi xóa vĩnh viễn

**Bảng liên quan:** `users`, `user_settings`

---

## B. TRANG CÔNG KHAI

---

### UC-45: Trang chủ | Level 2 | Iteration 1

**Main Flow:**
1. Hiển thị Hero Section: slogan, nút CTA (Tìm việc / Đăng dự án)
2. Thanh tìm kiếm nhanh (keyword + category)
3. Danh mục phổ biến (grid cards từ UC-26)
4. Dự án nổi bật (6-8 dự án mới nhất, status = `APPROVED`)
5. Freelancer hàng đầu (6-8 freelancer rating cao nhất)
6. Thống kê nền tảng: Tổng dự án, Freelancer, Client, Tiền đã giải ngân
7. Testimonials / Đánh giá từ user
8. Footer (UC-39)

**Business Rules:**
- Content cached, refresh mỗi 15 phút
- Thống kê là số liệu thật từ DB (có thể làm tròn)

**Bảng liên quan:** `projects`, `freelancer_profiles`, `reviews`, `job_categories`

---

### UC-47: Chi tiết Dự án | Level 2 | Iteration 2

**Main Flow:**
1. Click vào dự án từ danh sách → trang chi tiết
2. Hiển thị:
   - Tiêu đề, Mô tả đầy đủ
   - Danh mục, Kỹ năng yêu cầu (tags)
   - Ngân sách, Loại (Fixed/Hourly)
   - Deadline, Ngày đăng
   - Số lượng proposals đã nhận
   - Thông tin Client: Tên, Rating, Số dự án đã đăng, Ngày tham gia
   - Tệp đính kèm (có thể tải về)
3. Nút "Gửi đề xuất" (Submit Proposal) — chỉ hiển thị cho Freelancer
4. Nút "Lưu" (Bookmark) — UC-04

**Business Rules:**
- Chỉ hiển thị dự án status = `APPROVED` hoặc `OPEN`
- Freelancer đã gửi proposal → hiển thị "Đã gửi đề xuất" thay vì nút submit
- Guest (chưa đăng nhập) vẫn xem được, nhưng phải đăng nhập để gửi proposal

**Bảng liên quan:** `projects`, `project_skills`, `project_attachments`, `proposals`, `client_profiles`

---

### UC-55: Bảng xếp hạng | Level 3 | Iteration 5

**Main Flow:**
1. Truy cập "Bảng xếp hạng"
2. Tabs: Top Freelancers / Top Employers
3. Filter: theo kỹ năng, danh mục, khoảng thời gian
4. Hiển thị: Hạng, Avatar, Tên, Rating, Số dự án hoàn thành, Tổng thu nhập (ẩn số chính xác)
5. Click → xem profile chi tiết

**Business Rules:**
- Ranking tính dựa trên: rating × 0.4 + projects_completed × 0.3 + earnings × 0.2 + profile_completeness × 0.1
- Cập nhật ranking mỗi 24h (batch job)
- Chỉ hiển thị user có ≥ 3 dự án hoàn thành

**Bảng liên quan:** `user_rankings`, `reviews`, `contracts`

---

### UC-56: Việc phổ biến nhất | Level 2 | Iteration 6

**Main Flow:**
1. Hiển thị danh sách danh mục công việc phổ biến (theo số lượng dự án)
2. Click vào danh mục → danh sách dự án thuộc danh mục đó
3. Sắp xếp: Mới nhất / Ngân sách cao nhất

**Bảng liên quan:** `job_categories`, `projects`

---

## C. GIAO TIẾP & TƯƠNG TÁC

---

### UC-48: Chat & Tin nhắn | Level 3 | Iteration 3

**Main Flow:**
1. Truy cập "Tin nhắn" → danh sách conversations
2. Mỗi conversation gắn với 1 project/contract (hoặc direct message)
3. Real-time messaging (WebSocket hoặc Long Polling)
4. Hiển thị: tin nhắn text, timestamp, read status, typing indicator
5. Tìm kiếm trong lịch sử tin nhắn
6. Thông báo push khi có tin nhắn mới

**Business Rules:**
- Chỉ cho phép chat giữa Client ↔ Freelancer cùng 1 project (hoặc sau khi Client invite)
- Tin nhắn không thể xóa (evidence cho dispute)
- Max 5000 ký tự/tin nhắn
- Lưu lịch sử vĩnh viễn

**Bảng liên quan:** `conversations`, `messages`, `conversation_participants`

---

### UC-49: Gửi tệp đính kèm | Level 2 | Iteration 3

**Main Flow:**
1. Trong chat → nhấn icon đính kèm
2. Chọn file từ máy tính
3. Upload → hiển thị preview (nếu là ảnh) hoặc icon file
4. Gửi → người nhận thấy file kèm link download

**Business Rules:**
- Định dạng cho phép: jpg, png, pdf, doc, docx, xls, xlsx, zip, rar
- Max 10MB/file, max 5 files/tin nhắn
- File lưu trên cloud storage (AWS S3 hoặc tương đương)

**Bảng liên quan:** `messages`, `message_attachments`

---

## D. TRANH CHẤP & BÁO CÁO

---

### UC-50: Mở Tranh chấp (Dispute) | Level 3 | Iteration 4

**Main Flow:**
1. Trong workspace → chọn milestone muốn tranh chấp
2. Nhấn "Mở tranh chấp"
3. Chọn lý do: Chất lượng không đạt / Không giao hàng / Vi phạm hợp đồng / Khác
4. Mô tả chi tiết vấn đề (≥ 50 ký tự)
5. Upload bằng chứng: screenshots, files (max 10 files, ≤ 5MB/file)
6. Submit → Dispute status = `OPEN`
7. Thông báo cho đối phương (Client/Freelancer) và Admin
8. Đối phương có 7 ngày để phản hồi (counter-evidence)
9. Sau đó Admin xử lý (UC-32)

**Business Rules:**
- Chỉ mở dispute cho milestone status = `SUBMITTED` hoặc `IN_PROGRESS`
- Mỗi milestone chỉ có tối đa 1 dispute active
- Trong thời gian dispute: tiền escrow bị đóng băng (frozen)
- Deadline mở dispute: trong 14 ngày sau khi deliverable được submit

**Bảng liên quan:** `disputes`, `dispute_evidences`

---

### UC-51: Báo cáo Vi phạm | Level 2 | Iteration 4

**Main Flow:**
1. Từ profile user / bài đăng dự án / review → nhấn "Báo cáo"
2. Chọn loại vi phạm: Spam, Giả mạo, Nội dung không phù hợp, Lừa đảo, Khác
3. Mô tả chi tiết (≥ 20 ký tự)
4. Upload bằng chứng (optional)
5. Submit → report status = `PENDING`
6. Admin xử lý (UC-34)

**Business Rules:**
- Mỗi user chỉ report 1 đối tượng 1 lần (tránh spam report)
- Không thể tự report chính mình
- User bị report không biết ai đã report (ẩn danh)

**Bảng liên quan:** `reports`, `report_evidences`

---

### UC-52: Yêu cầu KYC | Level 2 | Iteration 4

**Main Flow:**
1. Truy cập "Cài đặt" → "Xác minh danh tính"
2. Upload tài liệu:
   - CCCD/CMND mặt trước (bắt buộc)
   - CCCD/CMND mặt sau (bắt buộc)
   - Ảnh selfie cầm CCCD (bắt buộc)
3. Nhập: Họ tên đầy đủ (khớp CCCD), Ngày sinh, Số CCCD
4. Submit → KYC status = `PENDING`
5. Admin phê duyệt (UC-31)

**Business Rules:**
- Chỉ chấp nhận ảnh JPG/PNG, ≤ 5MB
- Ảnh phải rõ ràng, không bị mờ/cắt xén
- KYC bắt buộc trước khi rút tiền (UC-07)
- Mỗi user chỉ có **1 KYC request đang xử lý** tại một thời điểm (status = `PENDING`) → không thể submit thêm khi đang chờ duyệt
- **Trường hợp APPROVED:** Hoàn tất, user nhận badge "Đã xác thực", không cần submit lại
- **Trường hợp REJECTED:** User nhận lý do từ chối cụ thể → được phép submit lại với hồ sơ đã chỉnh sửa (tạo KYC request mới, request cũ giữ nguyên lịch sử)

**Bảng liên quan:** `kyc_requests`, `kyc_documents`

---

## E. TÀI CHÍNH & THÔNG BÁO

---

### UC-53: Lịch sử Giao dịch | Level 1 | Iteration 5

**Main Flow:**
1. Truy cập "Ví" → tab "Lịch sử giao dịch"
2. Hiển thị số dư hiện tại
3. Danh sách transactions, filter: loại, khoảng thời gian, trạng thái
4. Mỗi dòng: ID, Loại (Nạp/Rút/Nhận/Phí), Số tiền, Status, Ngày, Mô tả
5. Click vào → xem chi tiết (milestone, project liên quan)

**Bảng liên quan:** `transactions`, `wallets`

---

### UC-54: Cài đặt Thông báo | Level 2 | Iteration 5

**Main Flow:**
1. Truy cập "Cài đặt" → "Thông báo"
2. Bật/tắt từng loại thông báo:
   - Email: Dự án mới phù hợp, Proposal được chấp nhận, Thanh toán, Tin nhắn mới
   - In-app: Tất cả hoạt động liên quan
3. Chọn tần suất email: Ngay lập tức / Tóm tắt hàng ngày / Tắt
4. Lưu cài đặt

**Bảng liên quan:** `notification_settings`, `notifications`

---

## F. NỘI DUNG TĨNH & THÔNG TIN

---

### UC-57: Kiến thức vLance | Level 2 | Iteration 6

**Main Flow:**
1. Truy cập "Kiến thức" → danh sách bài viết (từ CMS UC-40)
2. Filter: theo category, tags
3. Click bài viết → đọc nội dung đầy đủ
4. Bài viết liên quan (related articles) ở sidebar

**Bảng liên quan:** `articles`, `article_categories`

---

### UC-58: Trợ giúp & FAQ | Level 1 | Iteration 6

**Main Flow:**
1. Truy cập "Trợ giúp" → danh sách câu hỏi thường gặp
2. Tìm kiếm trong FAQ
3. Accordion expand/collapse cho mỗi câu hỏi
4. Link tới "Gửi báo lỗi" (UC-59) nếu không tìm thấy câu trả lời

**Bảng liên quan:** `faqs`, `faq_categories`

---

### UC-59: Gửi Báo lỗi | Level 2 | Iteration 6

**Main Flow:**
1. Truy cập "Liên hệ" hoặc "Báo lỗi"
2. Nhập: Tiêu đề, Mô tả chi tiết, Loại (Lỗi kỹ thuật / Góp ý / Liên hệ khác)
3. Upload screenshots (optional, max 3 files)
4. Submit → tạo support ticket, status = `OPEN`
5. Admin xử lý (UC-41)
6. User nhận email xác nhận đã tiếp nhận

**Bảng liên quan:** `support_tickets`, `ticket_attachments`

---

### UC-60: Giới thiệu Nền tảng | Level 1 | Iteration 7

Trang tĩnh "Về chúng tôi": sứ mệnh, tầm nhìn, đội ngũ, con số thống kê. Nội dung quản lý qua CMS (UC-40).

---

### UC-61: Nhận bản tin Email | Level 1 | Iteration 7

**Main Flow:**
1. Nhập email vào form "Đăng ký nhận tin" (footer hoặc trang chủ)
2. Validate email format
3. Lưu email vào danh sách subscriber
4. Gửi email xác nhận đăng ký (double opt-in)
5. Click xác nhận → status = `ACTIVE`

**Business Rules:**
- Cho phép unsubscribe bất cứ lúc nào (link trong mỗi email)
- Tuân thủ quy định chống spam

**Bảng liên quan:** `newsletter_subscribers`

---

### UC-62: Điều khoản Dịch vụ | Level 1 | Iteration 1

Trang tĩnh hiển thị nội dung ToS từ DB (UC-36). Hiển thị version và ngày cập nhật.

**Bảng liên quan:** `policy_pages`

---

> **Tiếp theo:** Xem [Phần 4 — Thiết kế Database](./part4_database_design.md)
