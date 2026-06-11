# TỔNG HỢP VAI TRÒ VÀ KHÓA NGOẠI 45 BẢNG (BÁM SÁT SƠ ĐỒ HTML ERD)
*Tài liệu này được biên soạn bám sát 100% theo file `schema_diagram_erd.html`. Bảng `users` đã được tách thành 3 bảng độc lập (`freelancers`, `employers`, `admins`) và các cấu hình phụ đã được rút gọn lại còn 45 bảng cốt lõi.*

---

## 1. ACTORS (Nhóm Người dùng gốc - 3 Bảng)
1.  **`freelancers`**: Chứa toàn bộ thông tin tài khoản và hồ sơ (Profile) của người nhận việc. *(Không chứa khóa ngoại)*.
2.  **`employers`**: Chứa toàn bộ thông tin tài khoản, công ty của khách hàng thuê người. *(Không chứa khóa ngoại)*.
3.  **`admins`**: Chứa tài khoản của Ban quản trị hệ thống. *(Không chứa khóa ngoại)*.

---

## 2. LOGS & STATUS (Lịch sử & Trạng thái - 2 Bảng)
4.  **`login_history`**: Ghi nhận lịch sử đăng nhập. 
    *   *(Khóa ngoại $\to$ `freelancers`, `employers`, `admins`)*
5.  **`user_status_history`**: Lịch sử khóa/mở khóa tài khoản. 
    *   *(Khóa ngoại $\to$ `freelancers`, `employers`)*

---

## 3. SKILLS & EDUCATION (Kỹ năng & Bằng cấp - 7 Bảng)
6.  **`job_categories`**: Danh mục ngành nghề phân cấp. *(Khóa ngoại $\to$ `job_categories`)*.
7.  **`skills`**: Từ điển các kỹ năng chuyên môn. *(Khóa ngoại $\to$ `job_categories`)*.
8.  **`freelancer_skills`**: (Junction) Liên kết Freelancer và Kỹ năng. 
    *   *(Khóa ngoại $\to$ `freelancers`, `skills`)*
9.  **`educations`**: Bằng cấp, trường học. *(Khóa ngoại $\to$ `freelancers`)*.
10. **`experiences`**: Kinh nghiệm làm việc. *(Khóa ngoại $\to$ `freelancers`)*.
11. **`portfolios`**: Dự án mẫu (Portfolio). *(Khóa ngoại $\to$ `freelancers`)*.
12. **`portfolio_files`**: Các file trong Portfolio. *(Khóa ngoại $\to$ `portfolios`)*.

---

## 4. PROJECTS & PROPOSALS (Dự án & Chào giá - 5 Bảng)
13. **`projects`**: Bảng chính lưu các công việc. 
    *   *(Khóa ngoại $\to$ `employers`, `job_categories`, `admins` [duyệt])*
14. **`project_skills`**: Yêu cầu kỹ năng của dự án. *(Khóa ngoại $\to$ `projects`, `skills`)*.
15. **`project_attachments`**: Các file đính kèm dự án. *(Khóa ngoại $\to$ `projects`)*.
16. **`saved_jobs`**: Lưu công việc yêu thích. *(Khóa ngoại $\to$ `freelancers`, `projects`)*.
17. **`proposals`**: Đơn chào giá (Bid). *(Khóa ngoại $\to$ `projects`, `freelancers`)*.

---

## 5. CONTRACTS & DELIVERABLES (Hợp đồng & Nghiệm thu - 4 Bảng)
18. **`contracts`**: Bản Hợp đồng chính thức được tạo. 
    *   *(Khóa ngoại $\to$ `projects`, `freelancers`, `employers`)*
19. **`milestones`**: Các giai đoạn công việc. *(Khóa ngoại $\to$ `contracts`)*.
20. **`deliverables`**: Báo cáo hoàn thành. *(Khóa ngoại $\to$ `milestones`)*.
21. **`deliverable_files`**: File nộp sản phẩm. *(Khóa ngoại $\to$ `deliverables`)*.

---

## 6. WALLETS & FINANCE (Tài chính & Ví Ký Quỹ - 7 Bảng)
22. **`wallets`**: Ví tiền điện tử nội bộ. *(Khóa ngoại $\to$ `freelancers`, `employers`)*.
23. **`transactions`**: Lưu mọi giao dịch ví. *(Khóa ngoại $\to$ `wallets`)*.
24. **`escrow_transactions`**: Tiền ký quỹ đảm bảo hợp đồng. *(Khóa ngoại $\to$ `contracts`, `milestones`)*.
25. **`bank_accounts`**: Tài khoản ngân hàng thật. *(Khóa ngoại $\to$ `freelancers`, `employers`)*.
26. **`withdrawal_requests`**: Yêu cầu rút tiền. 
    *   *(Khóa ngoại $\to$ `freelancers`, `bank_accounts`, `admins`)*
27. **`payment_gateway_logs`**: Nhật ký nạp tiền qua Momo/VNPay. *(Khóa ngoại $\to$ `transactions`)*.
28. **`platform_fee_configs`**: % thu phí nền tảng. *(Khóa ngoại $\to$ `admins`)*.

---

## 7. REVIEWS & DISPUTES (Đánh giá & Tranh chấp - 6 Bảng)
29. **`reviews`**: Lời nhận xét (Sao) chéo. 
    *   *(Khóa ngoại $\to$ `contracts`, `freelancers`, `employers`)*
30. **`user_warnings`**: Thẻ phạt/Cảnh cáo. *(Khóa ngoại $\to$ `freelancers`, `employers`, `admins`)*.
31. **`disputes`**: Khiếu nại/Cãi nhau hợp đồng. *(Khóa ngoại $\to$ `contracts`, `freelancers`, `employers`)*.
32. **`dispute_evidences`**: Bằng chứng tranh chấp. *(Khóa ngoại $\to$ `disputes`, `freelancers`, `employers`)*.
33. **`dispute_decisions`**: Quyết định của Admin. *(Khóa ngoại $\to$ `disputes`, `admins`)*.

---

## 8. KYC (Xác minh danh tính - 2 Bảng)
34. **`kyc_requests`**: Đơn xác minh CCCD. *(Khóa ngoại $\to$ `freelancers`, `employers`, `admins`)*.
35. **`kyc_documents`**: File ảnh CCCD. *(Khóa ngoại $\to$ `kyc_requests`)*.

---

## 9. CHAT SYSTEM (Nhắn tin Real-time - 4 Bảng)
36. **`conversations`**: Các nhóm chat. *(Không chứa khóa ngoại)*.
37. **`conversation_participants`**: Ai đang trong phòng. *(Khóa ngoại $\to$ `conversations`, `freelancers`, `employers`)*.
38. **`messages`**: Từng dòng tin nhắn. *(Khóa ngoại $\to$ `conversations`, `freelancers`, `employers`)*.
39. **`message_attachments`**: File trong tin nhắn. *(Khóa ngoại $\to$ `messages`)*.

---

## 10. SUPPORT & SYSTEM (Hỗ trợ CSKH & Thông báo - 6 Bảng)
40. **`support_tickets`**: Ticket gửi hỗ trợ CSKH. 
    *   *(Khóa ngoại $\to$ `freelancers`, `employers`, `admins`)*
41. **`ticket_messages`**: Chat trong ticket. *(Khóa ngoại $\to$ `support_tickets`, `freelancers`, `employers`, `admins`)*.
42. **`ticket_attachments`**: File trong ticket. *(Khóa ngoại $\to$ `ticket_messages`)*.
43. **`notifications`**: Chuông thông báo góc màn hình. *(Khóa ngoại $\to$ `freelancers`, `employers`, `admins`)*.
44. **`newsletter_subscribers`**: Khách đăng ký bản tin. *(Khóa ngoại $\to$ `freelancers`, `employers`)*.
45. **`admin_audit_logs`**: Nhật ký hoạt động. *(Khóa ngoại $\to$ `admins`)*.
