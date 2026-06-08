# Giải thích Chi tiết Hệ thống vLance Freelance Marketplace

Tài liệu này giải thích chi tiết ý nghĩa của các **Actors (Tác nhân/Đối tượng tham gia)** và các **Use Cases / Data Flows (Luồng dữ liệu/Chức năng)** trong Sơ đồ Ngữ cảnh (Context Diagram) và Use Case Diagram của dự án vLance.

---

## 1. Các Tác nhân (Actors)

Hệ thống bao gồm 4 Tác nhân nội bộ (người dùng trực tiếp) và 2 Tác nhân bên ngoài (hệ thống bên thứ 3):

- **Guest (Khách vãng lai):** Người dùng truy cập hệ thống nhưng chưa đăng nhập hoặc chưa có tài khoản.
- **Freelancer (Người tìm việc):** Người dùng có kỹ năng chuyên môn, lên nền tảng để tìm kiếm các dự án phù hợp, nộp hồ sơ báo giá (Bidding) và thực hiện công việc để nhận thù lao.
- **Client (Nhà tuyển dụng / Khách hàng):** Người dùng cá nhân hoặc doanh nghiệp có nhu cầu thuê nhân sự ngoài. Họ đăng tải dự án, tìm kiếm Freelancer và trả tiền cho công việc hoàn thành.
- **Admin (Quản trị viên):** Đội ngũ vận hành của vLance, có quyền lực cao nhất để quản lý, kiểm duyệt nội dung, giải quyết tranh chấp và cấu hình hệ thống.
- **Email Service:** Dịch vụ gửi email tự động của bên thứ 3 (như SendGrid, AWS SES) chuyên gửi mã OTP, thư thông báo, thư quảng cáo.
- **Payment Gateway (Cổng thanh toán):** Dịch vụ trung gian thanh toán (Ví dụ: VNPay, Momo, PayPal, Stripe) để xử lý các giao dịch nạp tiền (Top-up) và rút tiền (Withdrawal) bằng tiền thật.

---

## 2. Chi tiết các Chức năng / Luồng dữ liệu (Use Cases & Data Flows)

### A. GUEST (Khách vãng lai)
- **Register (Email, Pass):** Khách vãng lai điền thông tin email, mật khẩu và chọn vai trò của mình (Freelancer hoặc Client) để đăng ký tài khoản.
- **Email Verification Link:** Hệ thống trả về một đường link qua email để xác thực và kích hoạt tài khoản vừa đăng ký.

### B. FREELANCER (Người tìm việc)
**Dữ liệu Freelancer gửi lên Hệ thống (Data In):**
- **Submit Profile:** Cập nhật thông tin hồ sơ cá nhân (Tiểu sử, Chức danh, Portfolio, Kỹ năng) để thu hút Client.
- **Job Search & Filters:** Thực hiện tìm kiếm dự án dựa trên từ khóa, danh mục ngành nghề, hoặc lọc theo ngân sách dự án.
- **Submit Proposal / Bid:** Gửi hồ sơ dự thầu cho một dự án. Bao gồm thư giới thiệu (Cover Letter), mức giá chào (Budget) và thời gian hoàn thành (Time).
- **Submit Deliverables:** Bàn giao các file sản phẩm cuối cùng hoặc báo cáo tiến độ cho các mốc công việc (Milestones).
- **Milestone Acceptance/Rejection:** Chấp nhận hoặc từ chối các điều khoản/cột mốc công việc do Client đề xuất.
- **Withdrawal Request:** Yêu cầu rút tiền từ Ví trong hệ thống (Balance) về tài khoản Ngân hàng cá nhân.
- **Review & Rate Client:** Để lại đánh giá, bình luận và chấm điểm sao cho Client sau khi dự án kết thúc.

**Dữ liệu Hệ thống trả về Freelancer (Data Out):**
- **Job Match Recommendations:** Gợi ý danh sách các công việc phù hợp với bộ kỹ năng của Freelancer.
- **Saved Jobs list / Bookmarks:** Truy xuất các công việc Freelancer đã lưu/yêu thích.
- **Milestone Escrow Notifications:** Thông báo xác nhận rằng Client đã đóng tiền ký quỹ (Escrow) cho cột mốc. Freelancer có thể an tâm bắt đầu làm việc.
- **Payment / Earnings confirmation:** Thông báo tiền đã được cộng vào Ví sau khi Client nghiệm thu.
- **Verification & KYC Status update:** Cập nhật kết quả quá trình xác thực danh tính cá nhân (Đã duyệt / Từ chối).

### C. CLIENT (Nhà tuyển dụng)
**Dữ liệu Client gửi lên Hệ thống (Data In):**
- **Update Company Profile:** Điền thông tin cá nhân hoặc doanh nghiệp để tăng độ uy tín khi tuyển dụng.
- **Post Job:** Đăng tải một dự án/công việc mới. Xác định rõ Tiêu đề, Ngân sách, Kỹ năng đòi hỏi và Hạn chót.
- **Choose Freelancer & Sign Contract:** Lựa chọn hồ sơ dự thầu tốt nhất và ký hợp đồng điện tử để chốt Freelancer làm việc.
- **Create & Fund Milestone (Escrow):** Tạo các mốc thanh toán (ví dụ: 30% lúc bắt đầu, 70% lúc xong) và nạp tiền vào Hệ thống để "giữ hộ" (Ký quỹ/Escrow) nhằm đảm bảo công bằng.
- **Approve & Release Funds to Freelancer:** Nghiệm thu kết quả bàn giao. Nếu hài lòng, Client bấm nút đồng ý để Hệ thống chuyển tiền từ tài khoản Ký quỹ sang cho Freelancer.
- **Wallet Top-up Request:** Lệnh nạp tiền từ Ngân hàng vào Ví của hệ thống để có tiền chi trả các dự án.
- **Review & Rate Freelancer:** Đánh giá chất lượng công việc, thái độ của Freelancer.

**Dữ liệu Hệ thống trả về Client (Data Out):**
- **List of Freelancer Bids / Proposals:** Danh sách các Freelancer đã nộp hồ sơ xin việc vào dự án của mình.
- **Deliverables for Review & Revision:** Nhận các tệp/sản phẩm công việc do Freelancer tải lên để kiểm tra.
- **Milestone Status updates:** Cập nhật trạng thái của các cột mốc (Chờ xử lý, Đang thực hiện, Đã hoàn thành).
- **Wallet Balance & Top-up transactions:** Xem số dư Ví và lịch sử dòng tiền.
- **Verification & KYC Status update:** Kết quả kiểm duyệt thông tin công ty/danh tính.

### D. ADMIN (Quản trị viên)
**Dữ liệu Admin tác động vào Hệ thống (Data In):**
- **Job Moderation / Approvals:** Kiểm duyệt các dự án mới đăng. Phê duyệt cho hiển thị hoặc Từ chối nếu vi phạm quy chuẩn.
- **CMS Management:** Quản lý bài viết blog, trang chính sách (Terms of Service) và danh sách FAQ.
- **KYC / Identity Approvals:** Đội ngũ CSKH kiểm tra đối chiếu CMND/CCCD/GPKD do người dùng tải lên và phê duyệt hợp lệ.
- **Process Withdrawal Requests:** Đối soát dòng tiền và duyệt lệnh chuyển khoản từ Hệ thống ra Ngân hàng của Freelancer.
- **System / Fee Configuration:** Thiết lập các thông số hệ thống, đặc biệt là cấu hình % phí hoa hồng (Commission Fee) hệ thống thu trên mỗi dự án.

**Dữ liệu Hệ thống trả về Admin (Data Out):**
- **System Dashboard / Overview Data:** Bảng điều khiển theo dõi sức khỏe và luồng hoạt động của toàn bộ nền tảng.
- **Revenue & Growth Statistics:** Báo cáo chi tiết về tổng doanh thu, lợi nhuận giữ lại, lượng user đăng ký mới.
- **Reported Issues & Disputes:** Cảnh báo về các dự án đang xảy ra tranh chấp (Client từ chối nghiệm thu, Freelancer khiếu nại) cần Admin đứng ra phân xử.
- **Pending KYC / Approval Requests:** Danh sách các yêu cầu nạp/rút tiền, bài đăng việc làm đang nằm chờ Admin xử lý.

### E. HỆ THỐNG BÊN THỨ 3 (Third-Party Systems)
- **Email Service:**
  - *System gửi đi:* Thông tin người nhận, nội dung thư (Mã OTP xác thực, Thông báo có tin nhắn mới, Cảnh báo số dư).
  - *Service trả về:* Webhook báo cáo trạng thái gửi (Đã vào Inbox, Bị vào Spam, Địa chỉ email không tồn tại - Bounce).
- **Payment Gateway (VNPay / Momo):**
  - *System gửi đi:* Yêu cầu khởi tạo mã thanh toán cho giao dịch Nạp tiền (Top-up), hoặc yêu cầu chuyển khoản tự động (Payout API) khi xử lý lệnh rút tiền.
  - *Gateway trả về:* Webhook báo cáo trạng thái của dòng tiền (Giao dịch thành công, Bị hủy, Không đủ số dư). Lệnh gọi Callback này rất quan trọng để hệ thống cộng/trừ tiền trong Ví (Wallet) một cách chính xác.
