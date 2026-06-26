USE CNY;
GO

-- Xóa dữ liệu cũ để tránh rác nếu anh chạy nhiều lần
DELETE FROM department_verification_tasks;
GO

-- Thêm 10 công việc rút tiền (WITHDRAWAL)
INSERT INTO department_verification_tasks (task_type, reference_id, title, description, status, required_departments, assigned_to_email, created_at, updated_at) VALUES 
('WITHDRAWAL', 101, N'Yêu cầu rút 5.000.000 VND', N'Rút tiền về Vietcombank 09182371. Cần FIN check số dư.', 'PENDING', 'FIN', NULL, GETDATE(), GETDATE()),
('WITHDRAWAL', 102, N'Yêu cầu rút 12.500.000 VND', N'Rút tiền về Techcombank 1903xxx. Cần FIN duyệt.', 'PENDING', 'FIN', NULL, GETDATE(), GETDATE()),
('WITHDRAWAL', 103, N'Yêu cầu rút 1.000.000 VND', N'Rút tiền về Momo 098xxx. Cần FIN duyệt.', 'IN_PROGRESS', 'FIN', 'staff1@gmail.com', GETDATE(), GETDATE()),
('WITHDRAWAL', 104, N'Yêu cầu rút 50.000.000 VND', N'Khoản rút lớn. Cần MOD soát xét và FIN chi.', 'PENDING', 'MOD,FIN', NULL, GETDATE(), GETDATE()),
('WITHDRAWAL', 105, N'Yêu cầu rút 2.500.000 VND', N'Rút tiền về TPBank.', 'PENDING', 'FIN', NULL, GETDATE(), GETDATE()),
('WITHDRAWAL', 106, N'Yêu cầu rút 7.000.000 VND', N'Rút tiền về MBBank.', 'PENDING', 'FIN', NULL, GETDATE(), GETDATE()),
('WITHDRAWAL', 107, N'Yêu cầu rút 15.000.000 VND', N'Tài khoản VIP yêu cầu rút.', 'IN_PROGRESS', 'FIN', 'staff2@gmail.com', GETDATE(), GETDATE()),
('WITHDRAWAL', 108, N'Yêu cầu rút 3.000.000 VND', N'Rút tiền về VietinBank.', 'PENDING', 'FIN', NULL, GETDATE(), GETDATE()),
('WITHDRAWAL', 109, N'Yêu cầu rút 8.500.000 VND', N'Rút tiền về Agribank.', 'PENDING', 'FIN', NULL, GETDATE(), GETDATE()),
('WITHDRAWAL', 110, N'Yêu cầu rút 20.000.000 VND', N'Rút tiền về BIDV.', 'PENDING', 'FIN', NULL, GETDATE(), GETDATE());

-- Thêm 10 công việc giải quyết tranh chấp (DISPUTE_REFUND)
INSERT INTO department_verification_tasks (task_type, reference_id, title, description, status, required_departments, assigned_to_email, created_at, updated_at) VALUES 
('DISPUTE_REFUND', 201, N'Tranh chấp hợp đồng #991', N'Freelancer trễ deadline 5 ngày. Client đòi hoàn tiền 100%.', 'PENDING', 'CS,DIS,FIN', NULL, GETDATE(), GETDATE()),
('DISPUTE_REFUND', 202, N'Tranh chấp chất lượng App', N'Client báo App nhiều bug. Freelancer không fix.', 'IN_PROGRESS', 'DIS', 'staff@gmail.com', GETDATE(), GETDATE()),
('DISPUTE_REFUND', 203, N'Hủy dự án ngang chừng', N'Freelancer mất tích. Cần DIS xử lý.', 'PENDING', 'CS,DIS', NULL, GETDATE(), GETDATE()),
('DISPUTE_REFUND', 204, N'Tranh chấp thiết kế Logo', N'Client bảo logo copy trên mạng. Cần MOD check bản quyền.', 'PENDING', 'MOD,DIS', NULL, GETDATE(), GETDATE()),
('DISPUTE_REFUND', 205, N'Yêu cầu hoàn trả phí', N'Giao dịch lỗi trừ đúp tiền.', 'PENDING', 'FIN', NULL, GETDATE(), GETDATE()),
('DISPUTE_REFUND', 206, N'Tranh chấp thanh toán Milestone 2', N'Client không chịu release tiền milestone 2.', 'PENDING', 'CS,DIS', NULL, GETDATE(), GETDATE()),
('DISPUTE_REFUND', 207, N'Freelancer giao source code rỗng', N'Khách hàng báo cáo file zip trống.', 'IN_PROGRESS', 'MOD', 'admin@gmail.com', GETDATE(), GETDATE()),
('DISPUTE_REFUND', 208, N'Bùng kèo phút chót', N'Client biến mất sau khi Freelancer bàn giao.', 'PENDING', 'DIS', NULL, GETDATE(), GETDATE()),
('DISPUTE_REFUND', 209, N'Tranh chấp viết bài SEO', N'Bài viết trùng lặp nội dung 80%.', 'PENDING', 'DIS', NULL, GETDATE(), GETDATE()),
('DISPUTE_REFUND', 210, N'Tranh chấp chỉnh sửa Video', N'Freelancer không giao file Project gốc.', 'PENDING', 'CS,DIS', NULL, GETDATE(), GETDATE());

-- Thêm 10 công việc xác thực KYC/Doanh nghiệp (KYC_VERIFICATION)
INSERT INTO department_verification_tasks (task_type, reference_id, title, description, status, required_departments, assigned_to_email, created_at, updated_at) VALUES 
('KYC_VERIFICATION', 301, N'Xác thực Doanh Nghiệp FPT', N'Yêu cầu cấp tick xanh doanh nghiệp.', 'PENDING', 'MOD', NULL, GETDATE(), GETDATE()),
('KYC_VERIFICATION', 302, N'Xác thực Thẻ tín dụng', N'Phát hiện thẻ lạ liên kết tài khoản.', 'PENDING', 'FIN', NULL, GETDATE(), GETDATE()),
('KYC_VERIFICATION', 303, N'Xác minh CCCD mờ', N'Ảnh chụp CCCD quá mờ, cần check tay bằng video call.', 'IN_PROGRESS', 'CS', 'staff@gmail.com', GETDATE(), GETDATE()),
('KYC_VERIFICATION', 304, N'Xác thực Agency nước ngoài', N'Công ty Mỹ đăng ký, cần check Legal.', 'PENDING', 'MOD', NULL, GETDATE(), GETDATE()),
('KYC_VERIFICATION', 305, N'Nâng cấp tài khoản PRO', N'Cần xác minh năng lực.', 'PENDING', 'MOD', NULL, GETDATE(), GETDATE()),
('KYC_VERIFICATION', 306, N'Xác minh tuổi tác', N'Có dấu hiệu user dưới 18 tuổi.', 'PENDING', 'CS', NULL, GETDATE(), GETDATE()),
('KYC_VERIFICATION', 307, N'Xác thực Doanh Nghiệp VNPT', N'Cần check giấy đăng ký kinh doanh.', 'PENDING', 'MOD', NULL, GETDATE(), GETDATE()),
('KYC_VERIFICATION', 308, N'Tài khoản trùng IP', N'Phát hiện 5 acc đăng ký chung 1 máy.', 'PENDING', 'MOD', NULL, GETDATE(), GETDATE()),
('KYC_VERIFICATION', 309, N'Xác minh khuôn mặt', N'Face ID không khớp với CCCD.', 'PENDING', 'MOD', NULL, GETDATE(), GETDATE()),
('KYC_VERIFICATION', 310, N'Xác thực mã số thuế', N'Yêu cầu xuất hóa đơn đỏ.', 'PENDING', 'FIN', NULL, GETDATE(), GETDATE());

-- Thêm 10 công việc cảnh báo gian lận (FRAUD_ALERT)
INSERT INTO department_verification_tasks (task_type, reference_id, title, description, status, required_departments, assigned_to_email, created_at, updated_at) VALUES 
('FRAUD_ALERT', 401, N'Cảnh báo rửa tiền', N'Giao dịch 500tr chuyển vào và rút ra ngay lập tức.', 'PENDING', 'MOD,FIN', NULL, GETDATE(), GETDATE()),
('FRAUD_ALERT', 402, N'Hack tài khoản', N'Login từ IP Nga, thay đổi email và đổi pass liên tục.', 'IN_PROGRESS', 'MOD', 'admin@gmail.com', GETDATE(), GETDATE()),
('FRAUD_ALERT', 403, N'Gian lận review', N'Cùng 1 máy tính tạo 10 acc clone để tự đánh giá 5 sao.', 'PENDING', 'MOD', NULL, GETDATE(), GETDATE()),
('FRAUD_ALERT', 404, N'Spam link lừa đảo', N'Freelancer gửi link phishing cho hàng loạt Client.', 'PENDING', 'MOD,CS', NULL, GETDATE(), GETDATE()),
('FRAUD_ALERT', 405, N'Đánh cắp Source Code', N'Report freelancer copy code dự án bán cho người khác.', 'PENDING', 'DIS,MOD', NULL, GETDATE(), GETDATE()),
('FRAUD_ALERT', 406, N'Thẻ tín dụng bị trộm', N'Ngân hàng báo cáo chargeback từ thẻ ăn cắp.', 'PENDING', 'FIN', NULL, GETDATE(), GETDATE()),
('FRAUD_ALERT', 407, N'Gian lận Affiliate', N'Tự ref link đăng ký nhận hoa hồng ảo.', 'PENDING', 'MOD', NULL, GETDATE(), GETDATE()),
('FRAUD_ALERT', 408, N'Đe dọa tống tiền', N'Freelancer dọa xóa database nếu không chuyển thêm tiền.', 'PENDING', 'MOD,CS', NULL, GETDATE(), GETDATE()),
('FRAUD_ALERT', 409, N'Giả mạo nhân viên sàn', N'User giả danh admin để xin password.', 'PENDING', 'MOD', NULL, GETDATE(), GETDATE()),
('FRAUD_ALERT', 410, N'Bot click tự động', N'Nghi ngờ dùng bot quét dữ liệu nền tảng.', 'PENDING', 'MOD', NULL, GETDATE(), GETDATE());

-- Thêm 10 công việc kháng cáo tài khoản (ACCOUNT_APPEAL)
INSERT INTO department_verification_tasks (task_type, reference_id, title, description, status, required_departments, assigned_to_email, created_at, updated_at) VALUES 
('ACCOUNT_APPEAL', 501, N'Xin mở khóa tài khoản HieuPC', N'Bị ban nhầm vì IP trùng, yêu cầu xem xét lại.', 'PENDING', 'MOD', NULL, GETDATE(), GETDATE()),
('ACCOUNT_APPEAL', 502, N'Kháng cáo review 1 sao', N'Client ác ý spam review 1 sao, Freelancer xin xóa.', 'PENDING', 'MOD,DIS', NULL, GETDATE(), GETDATE()),
('ACCOUNT_APPEAL', 503, N'Khóa nhầm do nhầm tên', N'Bị khóa do trùng tên với 1 scammer.', 'PENDING', 'CS', NULL, GETDATE(), GETDATE()),
('ACCOUNT_APPEAL', 504, N'Xin gỡ cấm chat', N'Bị ban chat 30 ngày do văng tục, hứa sẽ ngoan.', 'IN_PROGRESS', 'MOD', 'staff2@gmail.com', GETDATE(), GETDATE()),
('ACCOUNT_APPEAL', 505, N'Kháng cáo cấm đấu thầu', N'Lỡ hủy thầu 5 lần bị cấm, xin nộp phạt để gỡ.', 'PENDING', 'DIS,FIN', NULL, GETDATE(), GETDATE()),
('ACCOUNT_APPEAL', 506, N'Mở khóa quỹ Escrow', N'Bị hold tiền quá hạn do dự án tranh chấp kéo dài.', 'PENDING', 'FIN,DIS', NULL, GETDATE(), GETDATE()),
('ACCOUNT_APPEAL', 507, N'Xóa cờ cảnh cáo', N'Bị warning vì giao trễ, nay đã đền bù cho khách.', 'PENDING', 'MOD', NULL, GETDATE(), GETDATE()),
('ACCOUNT_APPEAL', 508, N'Khôi phục Portfolio bị xóa', N'Dự án mẫu bị xóa do vi phạm bản quyền, xin cung cấp bằng chứng.', 'PENDING', 'MOD', NULL, GETDATE(), GETDATE()),
('ACCOUNT_APPEAL', 509, N'Mở lại bài đăng Gig', N'Gig bị ẩn do thiếu mô tả, đã bổ sung.', 'PENDING', 'MOD', NULL, GETDATE(), GETDATE()),
('ACCOUNT_APPEAL', 510, N'Kháng cáo cấm Rút tiền', N'Bị cấm rút do nghi ngờ rửa tiền, xin nộp sao kê.', 'PENDING', 'FIN', NULL, GETDATE(), GETDATE());
GO
