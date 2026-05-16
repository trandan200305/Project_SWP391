# Phần 2: Phân tích Luồng Nghiệp vụ — ADMIN MODULE

> **Dự án:** vLance Freelance Marketplace — SWP391  
> **Phạm vi:** UC-21 → UC-42 (Admin / Super Admin)

---

## A. DASHBOARD & THỐNG KÊ

---

### UC-21: Tổng quan Dashboard | Level 5 | Iteration 7

| Hạng mục | Chi tiết |
|---|---|
| **Actor** | Admin / Super Admin |
| **Precondition** | Đăng nhập với quyền Admin |

**Main Flow:**
1. Truy cập Admin Panel → mặc định mở trang Dashboard
2. Hiển thị các KPI cards:
   - Tổng số User mới (hôm nay / tuần / tháng)
   - Tổng số dự án đang hoạt động (status = `IN_PROGRESS`)
   - Tổng doanh thu nền tảng (platform fees) trong tháng
   - Số tranh chấp đang mở (status = `OPEN` / `REVIEWING`)
   - Số ticket hỗ trợ chưa xử lý (status = `OPEN`)
   - Số yêu cầu rút tiền chờ duyệt
3. Biểu đồ:
   - Line chart: User đăng ký mới theo 30 ngày gần nhất
   - Bar chart: Doanh thu theo tháng (6 tháng gần nhất)
   - Pie chart: Phân bố dự án theo danh mục
4. Bảng hoạt động gần nhất (Recent Activities): 10 hoạt động mới nhất trên hệ thống

**Business Rules:**
- Data được cache, refresh mỗi 5 phút
- Quyền xem Dashboard: tất cả staff có quyền Admin

**Bảng liên quan:** Aggregate query từ `users`, `projects`, `transactions`, `disputes`, `support_tickets`

---

### UC-29: Thống kê Doanh thu | Level 5 | Iteration 7

**Main Flow:**
1. Truy cập menu "Thống kê" → "Doanh thu"
2. Lọc theo khoảng thời gian (date range picker)
3. Hiển thị:
   - Tổng doanh thu (platform fees collected)
   - Tổng giá trị giao dịch (GMV - Gross Merchandise Value)
   - Tỷ lệ phí trung bình
   - Top 10 dự án có giá trị cao nhất
   - Biểu đồ doanh thu theo ngày/tuần/tháng
4. Export báo cáo ra CSV/Excel

**Bảng liên quan:** `transactions`, `escrow_transactions`, `platform_fee_configs`

---

### UC-35: Thống kê Tăng trưởng | Level 5 | Iteration 4

**Main Flow:**
1. Truy cập "Thống kê" → "Tăng trưởng"
2. Hiển thị metrics:
   - Tổng user (Freelancer / Client / tỷ lệ)
   - User mới theo thời gian (biểu đồ)
   - Tổng dự án đã đăng / đã hoàn thành
   - Tỷ lệ dự án thành công (completed / total)
   - Tỷ lệ user quay lại (retention rate)
3. So sánh giai đoạn: tháng này vs tháng trước

**Bảng liên quan:** `users`, `projects`, `contracts`

---

## B. QUẢN LÝ NGƯỜI DÙNG & PHÂN QUYỀN

---

### UC-22: Quản lý Tài khoản | Level 3 | Iteration 1

**Main Flow:**
1. Truy cập "Quản lý người dùng" → danh sách user phân trang
2. Tìm kiếm: theo tên, email, role, status
3. Xem chi tiết tài khoản bất kỳ
4. Thao tác:
   - **Khóa tài khoản** (Lock): status → `LOCKED`, user không thể đăng nhập, kèm lý do
   - **Mở khóa** (Unlock): status → `ACTIVE`
   - **Cấm vĩnh viễn** (Ban): status → `BANNED`, user không thể đăng nhập và không thể tự mở khóa
5. Mỗi thao tác ghi vào Audit Log (UC-37)

**User Status Flow:**
```
PENDING_VERIFICATION → ACTIVE → LOCKED → ACTIVE (unlock)
                               → BANNED (permanent)
```

**Business Rules:**
- Không thể khóa/cấm Super Admin
- Khóa user → tất cả dự án đang active bị đóng băng (freeze), thông báo cho các bên liên quan
- Phải ghi lý do khi khóa/cấm

**Bảng liên quan:** `users`, `user_status_history`, `admin_audit_logs`

---

### UC-23: Chi tiết Người dùng | Level 3 | Iteration 5

**Main Flow:**
1. Từ danh sách user → click vào 1 user
2. Hiển thị thông tin đầy đủ:
   - Thông tin cá nhân (ẩn CCCD nếu chưa duyệt KYC)
   - Role hiện tại, ngày đăng ký, lần đăng nhập cuối
   - Lịch sử giao dịch (transactions)
   - Danh sách dự án (đã đăng / đã làm)
   - Danh sách review đã nhận / đã gửi
   - Danh sách report bị nhận
   - Trạng thái KYC
   - Số dư ví hiện tại

**Bảng liên quan:** `users`, `freelancer_profiles`, `client_profiles`, `transactions`, `reviews`, `reports`, `kyc_requests`, `wallets`

---

### UC-24: Phân quyền Nội bộ | Level 4 | Iteration 7

| Hạng mục | Chi tiết |
|---|---|
| **Actor** | Super Admin (chỉ Super Admin) |

**Main Flow:**
1. Truy cập "Quản lý nhân sự" → danh sách staff
2. Thêm staff mới: Tạo tài khoản với role = `STAFF`
3. Gán quyền cụ thể cho từng staff:
   - **Moderator**: UC-25 (kiểm duyệt), UC-33 (review), UC-34 (report)
   - **Finance**: UC-27, UC-28, UC-29, UC-30 (tài chính)
   - **Support**: UC-41 (ticket), UC-31 (KYC), UC-32 (dispute)
   - **Content**: UC-39, UC-40, UC-42 (CMS, SEO)
4. Sửa/xóa quyền staff
5. Vô hiệu hóa (disable) tài khoản staff

**Business Rules:**
- Chỉ Super Admin mới có quyền truy cập UC-24
- Một staff có thể có nhiều quyền (nhiều role)
- Mọi thay đổi phân quyền → ghi Audit Log
- Super Admin không thể tự xóa quyền chính mình

**Bảng liên quan:** `users`, `roles`, `permissions`, `role_permissions`, `user_roles`

---

## C. KIỂM DUYỆT & NỘI DUNG

---

### UC-25: Kiểm duyệt Dự án | Level 4 | Iteration 2

**Main Flow:**
1. Truy cập "Kiểm duyệt" → danh sách dự án status = `PENDING_REVIEW`
2. Sắp xếp theo thời gian submit (FIFO)
3. Click vào dự án → xem chi tiết đầy đủ: nội dung, attachments, thông tin Client
4. Kiểm tra:
   - Nội dung có hợp lệ không (không spam, không vi phạm)
   - Ngân sách hợp lý
   - Danh mục đúng
5. Thao tác:
   - **Phê duyệt** (Approve): status → `APPROVED`, dự án hiển thị công khai
   - **Từ chối** (Reject): status → `REJECTED`, kèm lý do → Client nhận thông báo
   - **Yêu cầu chỉnh sửa**: status → `REVISION_NEEDED`, kèm ghi chú
6. Ghi Audit Log

**Business Rules:**
- SLA kiểm duyệt: ≤ 24h kể từ khi submit
- Auto-approve nếu Client có ≥ 10 dự án đã duyệt trước đó và không có report (trusted client)

**Bảng liên quan:** `projects`, `project_reviews`, `admin_audit_logs`

---

### UC-26: Quản lý Lĩnh vực CV (Job Categories) | Level 3 | Iteration 5

**Main Flow:**
1. Truy cập "Danh mục" → cây phân cấp danh mục (tree structure)
2. CRUD:
   - **Tạo mới**: Tên, Mô tả, Icon, Parent category (nếu là sub-category), thứ tự hiển thị
   - **Sửa**: cập nhật thông tin
   - **Xóa**: soft delete (nếu không có dự án nào đang dùng) hoặc deactivate
   - **Sắp xếp**: drag-and-drop thứ tự hiển thị
3. Danh mục có cấu trúc 2 cấp: Parent → Children

**Business Rules:**
- Không xóa danh mục đang có dự án active
- Tên danh mục phải unique trong cùng 1 cấp

**Bảng liên quan:** `job_categories`

---

### UC-33: Quản lý Đánh giá | Level 3 | Iteration 4

**Main Flow:**
1. Truy cập "Đánh giá" → danh sách tất cả reviews
2. Filter: theo rating, theo user, theo dự án, theo flagged status
3. Xem chi tiết review: nội dung, điểm, người gửi, người nhận, dự án
4. Thao tác:
   - **Ẩn** (Hide): review không hiển thị công khai nhưng vẫn lưu
   - **Xóa** (Delete): soft delete
   - **Khôi phục** (Restore): khôi phục review đã ẩn
5. Ghi Audit Log

**Bảng liên quan:** `reviews`, `admin_audit_logs`

---

### UC-34: Quản lý Báo cáo Vi phạm | Level 4 | Iteration 4

**Main Flow:**
1. Truy cập "Báo cáo vi phạm" → danh sách reports (status = `PENDING`)
2. Xem chi tiết: Người báo cáo, Đối tượng bị báo cáo (User/Project/Review), Lý do, Bằng chứng
3. Điều tra: xem profile đối tượng, lịch sử vi phạm
4. Thao tác xử lý:
   - **Bỏ qua** (Dismiss): report không có căn cứ → status = `DISMISSED`
   - **Cảnh cáo** (Warn): gửi email cảnh cáo tới user vi phạm → status = `WARNED`
   - **Khóa tài khoản** (Lock): vi phạm nghiêm trọng → user status = `LOCKED`
   - **Cấm** (Ban): vi phạm nhiều lần → user status = `BANNED`
5. Ghi Audit Log kèm lý do và hình thức xử lý

**Report Status Flow:**
```
PENDING → REVIEWING → DISMISSED / WARNED / ACTION_TAKEN
```

**Bảng liên quan:** `reports`, `report_evidences`, `user_warnings`, `admin_audit_logs`

---

## D. TÀI CHÍNH

---

### UC-27: Giám sát Giao dịch | Level 4 | Iteration 3

**Main Flow:**
1. Truy cập "Giao dịch" → danh sách tất cả transactions
2. Filter: loại (TOP_UP, RELEASE, WITHDRAWAL, REFUND, PLATFORM_FEE), status, khoảng thời gian, user
3. Mỗi transaction hiển thị: ID, User, Loại, Số tiền, Status, Ngày, Mã tham chiếu
4. Click vào → xem chi tiết: metadata, related milestone/project, gateway response
5. Phát hiện bất thường: giao dịch giá trị cao, nhiều giao dịch liên tục từ 1 user (fraud detection flag)

**Business Rules:**
- Giao dịch > 10.000.000 VND → auto-flag để Admin review
- Không thể sửa/xóa transaction (immutable ledger)

**Bảng liên quan:** `transactions`, `payment_gateway_logs`

---

### UC-28: Xử lý Rút tiền / Hoàn tiền | Level 4 | Iteration 5

**Main Flow:**
1. Truy cập "Yêu cầu thanh toán" → danh sách withdrawal requests (status = `PENDING`)
2. Xem chi tiết: User, Số tiền, Thông tin ngân hàng, KYC status, Lịch sử rút trước đó
3. Thao tác:
   - **Phê duyệt** (Approve): xác nhận đã chuyển tiền → status = `APPROVED` → `COMPLETED`
   - **Từ chối** (Reject): kèm lý do → status = `REJECTED`, hoàn lại số dư vào ví user
4. Xử lý Hoàn tiền (Refund) từ dispute (UC-32): tạo refund transaction
5. Ghi Audit Log

**Business Rules:**
- Chỉ xử lý cho user có KYC = `APPROVED`
- Double confirmation: Admin nhập mã xác nhận trước khi approve
- Mỗi ngày tổng hợp báo cáo rút tiền gửi cho Finance Manager

**Bảng liên quan:** `withdrawal_requests`, `wallets`, `transactions`, `admin_audit_logs`

---

### UC-30: Quản lý Phí dịch vụ | Level 2 | Iteration 5

**Main Flow:**
1. Truy cập "Cấu hình" → "Phí dịch vụ"
2. Xem % phí hiện tại (ví dụ: 10%)
3. Sửa % phí → nhập giá trị mới
4. Chọn ngày áp dụng (effective date) → có thể lên lịch thay đổi
5. Lưu → ghi lịch sử thay đổi phí

**Business Rules:**
- Phí mới chỉ áp dụng cho milestone tạo SAU ngày effective
- Milestone đang active giữ nguyên mức phí cũ
- Phí hợp lệ: 0% - 30%

**Bảng liên quan:** `platform_fee_configs`

---

### UC-32: Xử lý Tranh chấp | Level 4 | Iteration 4

**Main Flow:**
1. User mở dispute (UC-50) → Admin nhận thông báo
2. Truy cập "Tranh chấp" → danh sách disputes (status = `OPEN`)
3. Xem chi tiết:
   - Thông tin milestone tranh chấp, số tiền escrow
   - Lý do tranh chấp (từ cả 2 bên)
   - Bằng chứng đính kèm (screenshots, files, chat logs)
   - Lịch sử project & contract
4. Admin đặt status = `REVIEWING`, yêu cầu bổ sung bằng chứng nếu cần
5. Đưa ra quyết định:
   - **Hoàn tiền cho Client**: 100% escrow → ví Client
   - **Trả cho Freelancer**: 100% escrow → ví Freelancer (trừ phí)
   - **Chia tỷ lệ**: X% → Client, Y% → Freelancer
6. Thực thi quyết định → tạo transactions tương ứng
7. Dispute status → `RESOLVED`
8. Thông báo kết quả cho cả 2 bên

**Dispute Status Flow:**
```
OPEN → REVIEWING → RESOLVED (refund_client / pay_freelancer / split)
                 → ESCALATED (nếu cần Super Admin)
```

**Business Rules:**
- SLA xử lý: ≤ 7 ngày làm việc
- Quyết định của Admin là quyết định cuối cùng
- Dispute chỉ được mở trong vòng 14 ngày sau khi deliverable được submit

**Bảng liên quan:** `disputes`, `dispute_evidences`, `dispute_decisions`, `escrow_transactions`, `transactions`

---

## E. XÁC THỰC & HỖ TRỢ

---

### UC-31: Phê duyệt KYC | Level 3 | Iteration 4

**Main Flow:**
1. User submit KYC (UC-52) → Admin nhận thông báo
2. Truy cập "KYC" → danh sách requests (status = `PENDING`)
3. Xem tài liệu: Ảnh CCCD mặt trước/sau, Ảnh selfie cầm CCCD
4. Đối chiếu: tên trên CCCD khớp tên tài khoản, ảnh rõ ràng, không chỉnh sửa
5. Thao tác:
   - **Phê duyệt**: KYC status → `APPROVED`, user nhận badge "Đã xác thực"
   - **Từ chối**: kèm lý do cụ thể, user có thể submit lại
6. Ghi Audit Log

**KYC Status Flow:**
```
NOT_SUBMITTED → PENDING → APPROVED
                        → REJECTED → PENDING (re-submit)
```

**Business Rules:**
- KYC bắt buộc trước khi rút tiền lần đầu (UC-07)
- Tài liệu KYC được mã hóa (encrypted at rest)
- Chỉ Admin có quyền `SUPPORT` mới xem được tài liệu KYC
- SLA duyệt: ≤ 48h

**Bảng liên quan:** `kyc_requests`, `kyc_documents`, `admin_audit_logs`

---

### UC-41: Quản lý Ticket Hỗ trợ | Level 4 | Iteration 7

**Main Flow:**
1. User gửi ticket (UC-59) → Admin nhận thông báo
2. Truy cập "Hỗ trợ" → danh sách tickets
3. Filter: status (Open/In Progress/Resolved/Closed), priority, category
4. Nhận ticket: Admin tự assign hoặc được assign bởi Lead
5. Xem chi tiết: nội dung, attachments, lịch sử trao đổi
6. Trả lời ticket (thread conversation)
7. Thay đổi status: `OPEN` → `IN_PROGRESS` → `RESOLVED` → `CLOSED`
8. Nếu user không phản hồi trong 7 ngày sau `RESOLVED` → auto-close

**Business Rules:**
- SLA phản hồi: ≤ 24h (giờ làm việc)
- Priority: Low / Medium / High / Critical
- Critical tickets → thông báo ngay cho Admin Lead

**Bảng liên quan:** `support_tickets`, `ticket_messages`, `ticket_attachments`

---

## F. HỆ THỐNG & CMS

---

### UC-36: Quản lý Chính sách | Level 2 | Iteration 5

**Main Flow:**
1. Truy cập "Nội dung" → "Chính sách"
2. Danh sách trang: Điều khoản dịch vụ (ToS), Chính sách bảo mật (Privacy Policy)
3. Sửa nội dung bằng Rich Text Editor (WYSIWYG)
4. Preview trước khi publish
5. Publish → version cũ được lưu archive, version mới hiển thị

**Business Rules:**
- Lưu lịch sử version (versioning)
- User phải chấp nhận ToS mới nếu có thay đổi (prompt khi đăng nhập)

**Bảng liên quan:** `policy_pages`, `policy_versions`

---

### UC-37: Nhật ký Hoạt động | Level 2 | Iteration 5

**Main Flow:**
1. Truy cập "Hệ thống" → "Nhật ký"
2. Hiển thị danh sách logs, filter: theo admin user, action type, thời gian, module
3. Mỗi log: Admin ID, Action, Module, Target (user/project/...), Old Value, New Value, IP, Timestamp
4. Tìm kiếm full-text trong logs
5. Export logs ra CSV

**Business Rules:**
- Log KHÔNG thể xóa hoặc sửa (append-only)
- Retention: giữ tối thiểu 1 năm
- Chỉ Super Admin mới xem được toàn bộ logs

**Bảng liên quan:** `admin_audit_logs`

---

### UC-39: Quản lý Nội dung Footer | Level 3 | Iteration 6

**Main Flow:**
1. Truy cập "CMS" → "Footer"
2. Quản lý các nhóm link: Về chúng tôi, Hỗ trợ, Chính sách, Mạng xã hội
3. CRUD từng link: Label, URL, Thứ tự, Nhóm
4. Cập nhật thông tin công ty: Tên, Địa chỉ, Email, Hotline
5. Preview → Publish

**Bảng liên quan:** `footer_sections`, `footer_links`, `company_info`

---

### UC-40: Quản lý Bài viết CMS | Level 3 | Iteration 7

**Main Flow:**
1. Truy cập "CMS" → "Bài viết"
2. Danh sách bài viết, filter: status (Draft/Published), category
3. Tạo/sửa bài viết: Tiêu đề, Nội dung (Rich Text Editor), Ảnh bìa, Category, Tags, SEO meta
4. Preview → Publish hoặc Save Draft
5. Sắp xếp thứ tự hiển thị

**Bảng liên quan:** `articles`, `article_categories`, `article_tags`

---

### UC-42: Cấu hình SEO | Level 2 | Iteration 7

**Main Flow:**
1. Truy cập "CMS" → "SEO"
2. Danh sách trang cần cấu hình: Trang chủ, các trang danh mục, trang tìm kiếm
3. Cấu hình cho mỗi trang: Meta Title, Meta Description, OG Image, Canonical URL
4. Lưu → áp dụng ngay lên trang tương ứng

**Bảng liên quan:** `seo_configs`
