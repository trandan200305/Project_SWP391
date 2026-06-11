# Phần 1: Phân tích Luồng Nghiệp vụ — Freelancer & Client

> **Dự án:** vLance Freelance Marketplace — SWP391  
> **Phạm vi:** UC-01 → UC-20 (Freelancer + Client)

---

## A. NGƯỜI TÌM VIỆC (FREELANCER) — UC-01 → UC-08

---

### UC-01: Đăng ký Freelancer | Level 1 | Iteration 1

| Hạng mục | Chi tiết |
|---|---|
| **Actor** | Khách (Guest) |
| **Precondition** | Chưa có tài khoản, có email hợp lệ |
| **Trigger** | Nhấn "Đăng ký" → chọn role "Freelancer" |

**Main Flow:**
1. Nhập: Họ tên, Email, Mật khẩu, Xác nhận mật khẩu
2. Chấp nhận Điều khoản dịch vụ (UC-62)
3. Hệ thống validate: email unique, password ≥ 8 ký tự (chữ hoa + số + ký tự đặc biệt)
4. Gửi email xác thực (verification link, TTL = 24h)
5. User click link → account status = `ACTIVE`, role = `FREELANCER`
6. Redirect → trang hoàn thiện hồ sơ (UC-02)

**Alternative Flow:**
- Email đã tồn tại → thông báo lỗi, gợi ý đăng nhập
- Link hết hạn → cho phép gửi lại email xác thực
- Đăng ký qua Google OAuth 2.0 (optional)

**Business Rules:**
- Mỗi email chỉ gắn 1 account
- Account chưa xác thực email → status = `PENDING_VERIFICATION`, không thể đăng nhập
- Mật khẩu lưu dưới dạng BCrypt hash

**Bảng liên quan:** `users`, `user_roles`, `email_verifications`

---

### UC-02: Hồ sơ Freelancer | Level 3 | Iteration 1

| Hạng mục | Chi tiết |
|---|---|
| **Actor** | Freelancer (đã đăng nhập) |
| **Precondition** | Account ACTIVE |

**Main Flow:**
1. Cập nhật thông tin cơ bản: Avatar, Tiêu đề chuyên môn (Professional Title), Mô tả bản thân (Bio), Địa chỉ
2. Thêm Kỹ năng: chọn từ danh mục hệ thống (UC-26) + tự nhập kỹ năng mới
3. Thêm Học vấn: Tên trường, Chuyên ngành, Năm tốt nghiệp
4. Thêm Kinh nghiệm làm việc: Công ty, Vị trí, Thời gian, Mô tả
5. Upload Portfolio: Tên project, Mô tả, Link/Ảnh minh họa (tối đa 10 files, ≤ 5MB/file)
6. Thiết lập mức giá mong muốn (hourly rate / fixed price)
7. Hệ thống tính `profile_completeness` (%)

**Business Rules:**
- Profile completeness ≥ 70% mới hiển thị trên kết quả tìm kiếm (UC-19)
- Avatar: chỉ chấp nhận JPG/PNG, ≤ 2MB
- Kỹ năng tối đa 15 skills/profile

**Bảng liên quan:** `freelancer_profiles`, `skills`, `user_skills`, `educations`, `experiences`, `portfolios`, `portfolio_files`

---

### UC-03: Tìm kiếm việc làm | Level 3 | Iteration 2

| Hạng mục | Chi tiết |
|---|---|
| **Actor** | Freelancer |
| **Precondition** | Đã đăng nhập |

**Main Flow:**
1. Nhập keyword tìm kiếm (tên dự án, kỹ năng)
2. Lọc theo: Danh mục (Category), Ngân sách (min-max), Loại dự án (Fixed/Hourly), Kỹ năng yêu cầu, Ngày đăng
3. Sắp xếp: Mới nhất / Ngân sách cao nhất / Phù hợp nhất (matching score)
4. Hiển thị danh sách kết quả dạng phân trang (20 items/page)
5. Click vào → xem chi tiết dự án (UC-47)

**Business Rules:**
- Chỉ hiển thị dự án status = `APPROVED` (đã qua kiểm duyệt UC-25)
- Dự án đã hết hạn (expired) → không hiển thị
- Matching score = tỷ lệ trùng khớp giữa skills của Freelancer và skills yêu cầu của dự án

**Bảng liên quan:** `projects`, `project_skills`, `job_categories`

---

### UC-04: Việc làm đã lưu | Level 1 | Iteration 2

**Main Flow:**
1. Từ danh sách hoặc trang chi tiết dự án → nhấn icon "Lưu" (bookmark)
2. Dự án được thêm vào danh sách "Việc làm đã lưu"
3. Xem danh sách đã lưu, bỏ lưu, hoặc nhấn "Gửi đề xuất" (Submit Proposal)

**Business Rules:**
- Mỗi user chỉ lưu 1 lần/dự án (toggle on/off)
- Dự án bị xóa/đóng → tự động xóa khỏi danh sách đã lưu

**Bảng liên quan:** `saved_jobs`

---

### UC-05: Workspace Freelancer | Level 2 | Iteration 3

**Main Flow:**
1. Hiển thị danh sách dự án đang hoạt động (status = `IN_PROGRESS`)
2. Mỗi dự án hiển thị: Tên, Client, Tiến độ milestone, Deadline
3. Click vào dự án → xem chi tiết workspace:
   - Danh sách milestones + trạng thái từng milestone
   - Upload deliverables (sản phẩm bàn giao)
   - Cập nhật tiến độ (% completion)
   - Chat với Client (UC-48)
4. Submit deliverable → Client được thông báo để review

**Business Rules:**
- Freelancer chỉ thấy dự án mà mình đã được chọn (UC-13)
- Upload deliverable: tối đa 20MB/file, max 5 files/lần submit

**Bảng liên quan:** `contracts`, `milestones`, `deliverables`, `deliverable_files`

---

### UC-06: Xác nhận Milestone | Level 2 | Iteration 3

**Main Flow:**
1. Client tạo milestone (UC-15) → Freelancer nhận thông báo
2. Freelancer xem chi tiết: Tên milestone, Mô tả công việc, Số tiền, Deadline
3. Freelancer chọn: **Chấp nhận** hoặc **Từ chối** (kèm lý do)
4. Chấp nhận → milestone status = `ACCEPTED`, Client được thông báo escrow tiền
5. Từ chối → Client được thông báo, có thể chỉnh sửa và gửi lại

**State Machine — Milestone:**
```
CREATED → ACCEPTED → FUNDED → IN_PROGRESS → SUBMITTED → APPROVED → RELEASED
                                                      → DISPUTED (UC-50)
       → REJECTED (by Freelancer) → REVISED → ACCEPTED
```

**Bảng liên quan:** `milestones`, `milestone_status_history`

---

### UC-07: Yêu cầu rút tiền | Level 4 | Iteration 3

**Main Flow:**
1. Freelancer vào Ví (Wallet) → kiểm tra số dư khả dụng
2. Nhấn "Yêu cầu rút tiền"
3. Nhập: Số tiền rút, Chọn phương thức (Ngân hàng nội địa / E-wallet), Thông tin tài khoản nhận
4. Hệ thống validate: Số tiền ≤ Số dư khả dụng, ≥ Mức rút tối thiểu
5. Tạo withdrawal request, status = `PENDING`
6. Admin xử lý (UC-28): Approve → chuyển tiền, Reject → hoàn lại số dư

**Business Rules:**
- Mức rút tối thiểu: cấu hình bởi Admin (ví dụ 100.000 VND)
- Phí rút tiền (nếu có): cấu hình bởi Admin
- Số dư khả dụng = Tổng tiền nhận được - Tiền đang chờ xử lý - Phí nền tảng
- Thời gian xử lý: 1-3 ngày làm việc
- Yêu cầu KYC đã được duyệt (UC-31) trước khi rút lần đầu

**Bảng liên quan:** `wallets`, `withdrawal_requests`, `bank_accounts`

---

### UC-08: Hướng dẫn Freelancer | Level 1 | Iteration 6

**Main Flow:**
1. Truy cập menu "Hướng dẫn" → hiển thị danh sách bài viết
2. Nội dung được quản lý bởi Admin qua CMS (UC-40)
3. Bài viết có tag/category để dễ tìm kiếm

**Bảng liên quan:** `articles`, `article_categories`

---

## B. NGƯỜI TUYỂN DỤNG (CLIENT) — UC-09 → UC-20

---

### UC-09: Đăng ký Client | Level 1 | Iteration 1

Tương tự UC-01, nhưng role = `CLIENT`. Sau đăng ký redirect tới UC-10 để hoàn thiện hồ sơ công ty.

**Bảng liên quan:** `users`, `user_roles`

---

### UC-10: Hồ sơ Người tuyển dụng | Level 2 | Iteration 1

**Main Flow:**
1. Cập nhật: Tên công ty, Logo, Mô tả, Website, Địa chỉ, Quy mô, Lĩnh vực hoạt động
2. Thêm thông tin thanh toán (billing details)
3. Hệ thống tính `profile_completeness` (%)

**Bảng liên quan:** `client_profiles`

---

### UC-11: Đăng việc làm | Level 2 | Iteration 2

**Main Flow:**
1. Nhấn "Đăng dự án mới"
2. Nhập: Tiêu đề, Mô tả chi tiết, Danh mục (từ UC-26), Kỹ năng yêu cầu
3. Chọn loại: Fixed Price / Hourly Rate
4. Thiết lập ngân sách (min-max hoặc cố định)
5. Upload tệp đính kèm (Brief, Mockup...) — tối đa 5 files, ≤ 10MB/file
6. Chọn thời hạn (deadline) và thời gian hiển thị bài đăng
7. Submit → status = `PENDING_REVIEW`
8. Admin kiểm duyệt (UC-25): Approve → `APPROVED` (hiển thị), Reject → `REJECTED`

**Business Rules:**
- Client phải có profile completeness ≥ 50% để đăng dự án
- Mỗi dự án cần ít nhất 1 kỹ năng yêu cầu
- Nội dung bị filter các từ cấm (profanity filter)

**Bảng liên quan:** `projects`, `project_skills`, `project_attachments`

---

### UC-12: Quản lý dự án | Level 2 | Iteration 2

**Main Flow:**
1. Xem danh sách dự án đã đăng, filter theo status
2. Sửa dự án (chỉ khi status = `APPROVED` hoặc `PENDING_REVIEW`, chưa có bid nào)
3. Đóng dự án: status → `CLOSED` (không nhận bid mới)
4. Xóa dự án: soft delete, chỉ khi chưa có contract nào

**Project Status Flow:**
```
DRAFT → PENDING_REVIEW → APPROVED → OPEN (nhận bids)
                       → REJECTED
OPEN → IN_PROGRESS (đã chọn freelancer) → COMPLETED → CLOSED
     → CLOSED (đóng thủ công)
     → CANCELLED
```

**Bảng liên quan:** `projects`, `project_status_history`

---

### UC-13: Chọn Freelancer | Level 3 | Iteration 2

**Main Flow:**
1. Xem danh sách proposals (bids) cho dự án
2. Mỗi proposal hiển thị: Freelancer info, Giá chào, Thời gian dự kiến, Cover letter, Portfolio
3. So sánh các proposals
4. Chọn 1 proposal → Nhấn "Chấp nhận"
5. Hệ thống tạo Contract giữa Client và Freelancer
6. Dự án status → `IN_PROGRESS`
7. Các proposal khác → status = `REJECTED`, thông báo cho freelancer

**Business Rules:**
- Mỗi dự án chỉ có 1 freelancer được chọn tại 1 thời điểm
- Freelancer được chọn phải có status account = `ACTIVE`

**Bảng liên quan:** `proposals`, `contracts`

---

### UC-14: Workspace Client | Level 2 | Iteration 3

Tương tự UC-05 nhưng từ góc nhìn Client:
1. Xem danh sách dự án đang thực hiện
2. Theo dõi tiến độ milestone
3. Review deliverable của Freelancer
4. Chat với Freelancer (UC-48)

---

### UC-15: Tạo Milestone | Level 3 | Iteration 3

**Main Flow:**
1. Trong workspace của dự án → nhấn "Tạo Milestone"
2. Nhập: Tên, Mô tả, Số tiền, Deadline
3. Submit → Freelancer nhận thông báo để xác nhận (UC-06)
4. Sau khi Freelancer chấp nhận → Client escrow tiền từ ví vào milestone

**Business Rules:**
- Tổng milestone amount ≤ Budget dự án
- Milestone amount ≤ Số dư ví Client
- Tiền escrow = milestone amount + platform fee (%)

**Bảng liên quan:** `milestones`, `escrow_transactions`

---

### UC-16: Nạp tiền vào ví | Level 3 | Iteration 3

**Main Flow:**
1. Vào Ví → nhấn "Nạp tiền"
2. Nhập số tiền, chọn phương thức (VNPay / Momo / Chuyển khoản ngân hàng)
3. Redirect tới cổng thanh toán → hoàn tất giao dịch
4. Callback → hệ thống verify → cộng tiền vào ví
5. Ghi log transaction: type = `TOP_UP`

**Business Rules:**
- Mức nạp tối thiểu / tối đa: cấu hình bởi Admin
- Mỗi giao dịch có mã tham chiếu (reference code) duy nhất
- Nạp thất bại → không cộng tiền, ghi log lỗi

**Bảng liên quan:** `wallets`, `transactions`, `payment_gateway_logs`

---

### UC-17: Giải ngân (Release Funds) | Level 3 | Iteration 3

**Main Flow:**
1. Freelancer submit deliverable → Client nhận thông báo
2. Client review deliverable
3. Nếu hài lòng → nhấn "Chấp nhận & Giải ngân"
4. Hệ thống:
   - Trừ tiền escrow
   - Tính phí nền tảng (UC-30): `platform_fee = amount × fee_percentage`
   - Chuyển vào ví Freelancer: `net_amount = amount - platform_fee`
   - Ghi log: `RELEASE` transaction cho Client, `EARNING` transaction cho Freelancer
5. Milestone status → `RELEASED`

**Alternative Flow:**
- Client yêu cầu chỉnh sửa (revision) → Freelancer nhận thông báo, milestone status = `REVISION_REQUESTED`
- Client mở tranh chấp (UC-50)

**Bảng liên quan:** `milestones`, `escrow_transactions`, `transactions`, `wallets`

---

### UC-18: Đánh giá Freelancer | Level 2 | Iteration 4

**Main Flow:**
1. Sau khi dự án hoàn thành (tất cả milestones đã released)
2. Client được yêu cầu đánh giá
3. Đánh giá: Điểm (1-5 sao) cho từng tiêu chí (Chất lượng, Giao tiếp, Đúng hạn, Chuyên môn), Nhận xét (text)
4. Submit → Freelancer nhận thông báo
5. Freelancer có thể đánh giá ngược Client (mutual review)
6. Hệ thống cập nhật `average_rating` cho Freelancer

**Business Rules:**
- Chỉ đánh giá 1 lần/contract
- Review chỉ hiển thị sau khi cả 2 bên đã đánh giá, hoặc sau 14 ngày
- Admin có thể ẩn/xóa review spam (UC-33)

**Bảng liên quan:** `reviews`, `review_criteria_scores`

---

### UC-19: Tìm kiếm Freelancer | Level 3 | Iteration 5

**Main Flow:**
1. Client truy cập trang "Tìm Freelancer"
2. Tìm kiếm theo: keyword, kỹ năng, danh mục, mức giá, đánh giá, quốc gia
3. Sắp xếp: Rating cao nhất, Số dự án hoàn thành, Giá thấp nhất
4. Click vào → xem Profile chi tiết Freelancer
5. Có thể "Mời làm việc" (Invite) hoặc "Liên hệ" (Chat)

**Bảng liên quan:** `freelancer_profiles`, `user_skills`, `reviews`

---

### UC-20: Freelancer Top Đầu | Level 2 | Iteration 6

**Main Flow:**
1. Hiển thị danh sách Freelancer có rating cao nhất, được filter theo kỹ năng/danh mục
2. Card hiển thị: Avatar, Tên, Title, Rating, Số dự án hoàn thành, Mức giá
3. Client có thể nhấn "Mời" để gửi lời mời trực tiếp

**Business Rules:**
- Top Freelancer = rating ≥ 4.5 + ≥ 5 dự án hoàn thành + profile completeness ≥ 90% + KYC verified
- Danh sách cập nhật mỗi 24h (cached)

**Bảng liên quan:** `freelancer_profiles`, `reviews`, `contracts`

---

> **Tiếp theo:** Xem [Phần 2 — Luồng Admin](./part2_admin_flows.md) và [Phần 3 — Luồng Người dùng chung](./part3_common_user_flows.md)
