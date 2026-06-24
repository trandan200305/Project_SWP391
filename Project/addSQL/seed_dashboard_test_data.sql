-- =========================================================================
-- LANCERPRO (CNY) - COMPLETE DASHBOARD SEED TEST DATA SCRIPT
-- Chèn dữ liệu mẫu từ 15-20 dòng cho TẤT CẢ các mục để test phân trang/giao diện
-- =========================================================================

USE CNY;
GO

-- ─────────────────────────────────────────────────────────────────────────
-- 1. DỌN DẸP DỮ LIỆU CŨ ĐỂ TRÁNH TRÙNG LẶP KHI CHẠY LẠI SCRIPT (DỌN TỪ CON SANG CHA)
-- ─────────────────────────────────────────────────────────────────────────
PRINT 'Cleaning old test data...';

-- Clean ticket attachments and messages first (CS)
DELETE FROM ticket_attachments;
DELETE FROM ticket_messages;
DELETE FROM support_tickets;

-- Clean violation reports and disputes
DELETE FROM violation_reports;
DELETE FROM dispute_decisions;
DELETE FROM dispute_evidences;
DELETE FROM disputes;
DELETE FROM contracts;

-- Clean withdrawal requests and bank accounts of test freelancers
DELETE FROM withdrawal_requests;
DELETE FROM bank_accounts WHERE freelancer_id IN (SELECT freelancer_id FROM freelancers WHERE email LIKE 'kyc_test_fl%')
   OR employer_id IN (SELECT employer_id FROM employers WHERE email LIKE 'kyc_test_emp%');

-- Clean project and profile requests
DELETE FROM employer_profile_requests;
DELETE FROM project_attachments WHERE project_id IN (SELECT project_id FROM projects WHERE client_id IN (SELECT employer_id FROM employers WHERE email LIKE 'kyc_test_emp%') OR status = 'PENDING');
DELETE FROM project_skills WHERE project_id IN (SELECT project_id FROM projects WHERE client_id IN (SELECT employer_id FROM employers WHERE email LIKE 'kyc_test_emp%') OR status = 'PENDING');
DELETE FROM proposals WHERE project_id IN (SELECT project_id FROM projects WHERE client_id IN (SELECT employer_id FROM employers WHERE email LIKE 'kyc_test_emp%') OR status = 'PENDING');
DELETE FROM saved_jobs WHERE project_id IN (SELECT project_id FROM projects WHERE client_id IN (SELECT employer_id FROM employers WHERE email LIKE 'kyc_test_emp%') OR status = 'PENDING');
DELETE FROM projects WHERE client_id IN (SELECT employer_id FROM employers WHERE email LIKE 'kyc_test_emp%') OR status = 'PENDING';

-- Clean profile related details for test freelancers
DELETE FROM freelancer_skills WHERE freelancer_id IN (SELECT freelancer_id FROM freelancers WHERE email LIKE 'kyc_test_fl%');
DELETE FROM experiences WHERE freelancer_id IN (SELECT freelancer_id FROM freelancers WHERE email LIKE 'kyc_test_fl%');
DELETE FROM educations WHERE freelancer_id IN (SELECT freelancer_id FROM freelancers WHERE email LIKE 'kyc_test_fl%');
DELETE FROM portfolios WHERE freelancer_id IN (SELECT freelancer_id FROM freelancers WHERE email LIKE 'kyc_test_fl%');
DELETE FROM freelancer_profiles WHERE freelancer_id IN (SELECT freelancer_id FROM freelancers WHERE email LIKE 'kyc_test_fl%');

-- Finally clean test freelancers and employers
DELETE FROM freelancers WHERE email LIKE 'kyc_test_fl%';
DELETE FROM employers WHERE email LIKE 'kyc_test_emp%';
GO

-- ─────────────────────────────────────────────────────────────────────────
-- 2. TẠO TÀI KHOẢN FREELANCER VÀ EMPLOYER MỚI ĐỂ PHỤC VỤ XÁC THỰC KYC VÀ KIỂM THỬ (15-20 MẪU)
-- ─────────────────────────────────────────────────────────────────────────
PRINT 'Seeding test accounts for KYC queue...';

-- Seed Freelancers (có trạng thái kyc_status = 'PENDING' để chui vào hàng chờ KYC)
INSERT INTO freelancers (email, password_hash, display_name, full_name, phone, avatar_url, status, email_verified, google_id, professional_title, kyc_status, id_card_front_url, kyc_submitted_at, is_verified, created_at, updated_at) VALUES
('kyc_test_fl1@gmail.com', 'hash123', 'Le Hoang Nam', 'Le Hoang Nam', '0912000001', 'https://ui-avatars.com/api/?name=Le+Hoang+Nam', 'ACTIVE', 1, 'google_fl_kyc1', 'React Developer', 'PENDING', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&fit=crop', DATEADD(hour, -1, GETDATE()), 0, GETDATE(), GETDATE()),
('kyc_test_fl2@gmail.com', 'hash123', 'Tran Thu Ha', 'Tran Thu Ha', '0912000002', 'https://ui-avatars.com/api/?name=Tran+Thu+Ha', 'ACTIVE', 1, 'google_fl_kyc2', 'Graphic Designer', 'PENDING', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&fit=crop', DATEADD(hour, -2, GETDATE()), 0, GETDATE(), GETDATE()),
('kyc_test_fl3@gmail.com', 'hash123', 'Nguyen Dang Khoa', 'Nguyen Dang Khoa', '0912000003', 'https://ui-avatars.com/api/?name=Nguyen+Dang+Khoa', 'ACTIVE', 1, 'google_fl_kyc3', 'Content Writer', 'PENDING', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&fit=crop', DATEADD(hour, -3, GETDATE()), 0, GETDATE(), GETDATE()),
('kyc_test_fl4@gmail.com', 'hash123', 'Pham Quoc Bao', 'Pham Quoc Bao', '0912000004', 'https://ui-avatars.com/api/?name=Pham+Quoc+Bao', 'ACTIVE', 1, 'google_fl_kyc4', 'SEO Specialist', 'PENDING', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&fit=crop', DATEADD(hour, -4, GETDATE()), 0, GETDATE(), GETDATE()),
('kyc_test_fl5@gmail.com', 'hash123', 'Do Thuy Chi', 'Do Thuy Chi', '0912000005', 'https://ui-avatars.com/api/?name=Do+Thuy+Chi', 'ACTIVE', 1, 'google_fl_kyc5', 'Data Analyst', 'PENDING', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&fit=crop', DATEADD(hour, -5, GETDATE()), 0, GETDATE(), GETDATE()),
('kyc_test_fl6@gmail.com', 'hash123', 'Hoang Minh Tu', 'Hoang Minh Tu', '0912000006', 'https://ui-avatars.com/api/?name=Hoang+Minh+Tu', 'ACTIVE', 1, 'google_fl_kyc6', 'DevOps Engineer', 'PENDING', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&fit=crop', DATEADD(hour, -6, GETDATE()), 0, GETDATE(), GETDATE()),
('kyc_test_fl7@gmail.com', 'hash123', 'Vu Hong Quan', 'Vu Hong Quan', '0912000007', 'https://ui-avatars.com/api/?name=Vu+Hong+Quan', 'ACTIVE', 1, 'google_fl_kyc7', 'UI/UX Specialist', 'PENDING', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&fit=crop', DATEADD(hour, -7, GETDATE()), 0, GETDATE(), GETDATE()),
('kyc_test_fl8@gmail.com', 'hash123', 'Dinh Gia Hung', 'Dinh Gia Hung', '0912000008', 'https://ui-avatars.com/api/?name=Dinh+Gia+Hung', 'ACTIVE', 1, 'google_fl_kyc8', 'Python Developer', 'PENDING', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&fit=crop', DATEADD(hour, -8, GETDATE()), 0, GETDATE(), GETDATE()),
('kyc_test_fl9@gmail.com', 'hash123', 'Lam My Tam', 'Lam My Tam', '0912000009', 'https://ui-avatars.com/api/?name=Lam+My+Tam', 'ACTIVE', 1, 'google_fl_kyc9', 'Copywriter', 'PENDING', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&fit=crop', DATEADD(hour, -9, GETDATE()), 0, GETDATE(), GETDATE()),
('kyc_test_fl10@gmail.com', 'hash123', 'Trinh Quoc Viet', 'Trinh Quoc Viet', '0912000010', 'https://ui-avatars.com/api/?name=Trinh+Quoc+Viet', 'ACTIVE', 1, 'google_fl_kyc10', 'QA Engineer', 'PENDING', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&fit=crop', DATEADD(hour, -10, GETDATE()), 0, GETDATE(), GETDATE());

-- Seed Employers
INSERT INTO employers (email, password_hash, display_name, full_name, phone, avatar_url, status, email_verified, google_id, company_name, kyc_status, id_card_front_url, kyc_submitted_at, is_verified, created_at, updated_at) VALUES
('kyc_test_emp1@gmail.com', 'hash123', 'VinGroup', 'Pham Nhat V', '0909000001', 'https://ui-avatars.com/api/?name=VinGroup', 'ACTIVE', 1, 'google_emp_kyc1', 'VinGroup JSC', 'PENDING', 'https://images.unsplash.com/photo-1554469384-e58fac16e23a?w=400&fit=crop', DATEADD(hour, -1, GETDATE()), 0, GETDATE(), GETDATE()),
('kyc_test_emp2@gmail.com', 'hash123', 'SunGroup', 'Le Viet L', '0909000002', 'https://ui-avatars.com/api/?name=SunGroup', 'ACTIVE', 1, 'google_emp_kyc2', 'SunGroup Corp', 'PENDING', 'https://images.unsplash.com/photo-1554469384-e58fac16e23a?w=400&fit=crop', DATEADD(hour, -2, GETDATE()), 0, GETDATE(), GETDATE()),
('kyc_test_emp3@gmail.com', 'hash123', 'Viettel', 'Nguyen Manh H', '0909000003', 'https://ui-avatars.com/api/?name=Viettel', 'ACTIVE', 1, 'google_emp_kyc3', 'Viettel Group', 'PENDING', 'https://images.unsplash.com/photo-1554469384-e58fac16e23a?w=400&fit=crop', DATEADD(hour, -3, GETDATE()), 0, GETDATE(), GETDATE()),
('kyc_test_emp4@gmail.com', 'hash123', 'FPT Software', 'Truong Gia B', '0909000004', 'https://ui-avatars.com/api/?name=FPT', 'ACTIVE', 1, 'google_emp_kyc4', 'FPT Software Ltd', 'PENDING', 'https://images.unsplash.com/photo-1554469384-e58fac16e23a?w=400&fit=crop', DATEADD(hour, -4, GETDATE()), 0, GETDATE(), GETDATE()),
('kyc_test_emp5@gmail.com', 'hash123', 'Momo Pay', 'Nguyen Ba D', '0909000005', 'https://ui-avatars.com/api/?name=Momo', 'ACTIVE', 1, 'google_emp_kyc5', 'M-Service Online', 'PENDING', 'https://images.unsplash.com/photo-1554469384-e58fac16e23a?w=400&fit=crop', DATEADD(hour, -5, GETDATE()), 0, GETDATE(), GETDATE());
GO

-- ─────────────────────────────────────────────────────────────────────────
-- 3. TẠO CÁC BIẾN LOOKUP ĐỂ ĐỒNG BỘ KHÓA NGOẠI (FOREIGN KEY)
-- ─────────────────────────────────────────────────────────────────────────
DECLARE @fl1 INT = (SELECT TOP 1 freelancer_id FROM freelancers WHERE email = 'kyc_test_fl1@gmail.com');
DECLARE @fl2 INT = (SELECT TOP 1 freelancer_id FROM freelancers WHERE email = 'kyc_test_fl2@gmail.com');
DECLARE @fl3 INT = (SELECT TOP 1 freelancer_id FROM freelancers WHERE email = 'kyc_test_fl3@gmail.com');
DECLARE @fl4 INT = (SELECT TOP 1 freelancer_id FROM freelancers WHERE email = 'kyc_test_fl4@gmail.com');
DECLARE @fl5 INT = (SELECT TOP 1 freelancer_id FROM freelancers WHERE email = 'kyc_test_fl5@gmail.com');

DECLARE @emp1 INT = (SELECT TOP 1 employer_id FROM employers WHERE email = 'kyc_test_emp1@gmail.com');
DECLARE @emp2 INT = (SELECT TOP 1 employer_id FROM employers WHERE email = 'kyc_test_emp2@gmail.com');
DECLARE @emp3 INT = (SELECT TOP 1 employer_id FROM employers WHERE email = 'kyc_test_emp3@gmail.com');
DECLARE @emp4 INT = (SELECT TOP 1 employer_id FROM employers WHERE email = 'kyc_test_emp4@gmail.com');
DECLARE @emp5 INT = (SELECT TOP 1 employer_id FROM employers WHERE email = 'kyc_test_emp5@gmail.com');

DECLARE @cat1 INT = (SELECT TOP 1 category_id FROM job_categories ORDER BY category_id ASC);
DECLARE @cat2 INT = (SELECT TOP 1 category_id FROM job_categories WHERE category_id > @cat1 ORDER BY category_id ASC);

-- Đảm bảo có tài khoản ngân hàng liên kết cho Freelancer để rút tiền
IF NOT EXISTS (SELECT 1 FROM bank_accounts WHERE freelancer_id = @fl1)
    INSERT INTO bank_accounts (freelancer_id, bank_name, account_number, account_holder, is_default, created_at)
    VALUES (@fl1, 'Vietcombank', '102345910', 'LE HOANG NAM', 1, GETDATE());

IF NOT EXISTS (SELECT 1 FROM bank_accounts WHERE freelancer_id = @fl2)
    INSERT INTO bank_accounts (freelancer_id, bank_name, account_number, account_holder, is_default, created_at)
    VALUES (@fl2, 'Techcombank', '190345129', 'TRAN THU HA', 1, GETDATE());

IF NOT EXISTS (SELECT 1 FROM bank_accounts WHERE freelancer_id = @fl3)
    INSERT INTO bank_accounts (freelancer_id, bank_name, account_number, account_holder, is_default, created_at)
    VALUES (@fl3, 'Momo Wallet', '0912000003', 'NGUYEN DANG KHOA', 1, GETDATE());

IF NOT EXISTS (SELECT 1 FROM bank_accounts WHERE freelancer_id = @fl4)
    INSERT INTO bank_accounts (freelancer_id, bank_name, account_number, account_holder, is_default, created_at)
    VALUES (@fl4, 'VPBank', '224098512', 'PHAM QUOC BAO', 1, GETDATE());

IF NOT EXISTS (SELECT 1 FROM bank_accounts WHERE freelancer_id = @fl5)
    INSERT INTO bank_accounts (freelancer_id, bank_name, account_number, account_holder, is_default, created_at)
    VALUES (@fl5, 'TPBank', '480214801', 'DO THUY CHI', 1, GETDATE());

DECLARE @ba1 INT = (SELECT TOP 1 bank_account_id FROM bank_accounts WHERE freelancer_id = @fl1);
DECLARE @ba2 INT = (SELECT TOP 1 bank_account_id FROM bank_accounts WHERE freelancer_id = @fl2);
DECLARE @ba3 INT = (SELECT TOP 1 bank_account_id FROM bank_accounts WHERE freelancer_id = @fl3);
DECLARE @ba4 INT = (SELECT TOP 1 bank_account_id FROM bank_accounts WHERE freelancer_id = @fl4);
DECLARE @ba5 INT = (SELECT TOP 1 bank_account_id FROM bank_accounts WHERE freelancer_id = @fl5);

-- ─────────────────────────────────────────────────────────────────────────
-- 4. SEED YÊU CẦU RÚT TIỀN (withdrawal_requests) - 15 MẪU
-- ─────────────────────────────────────────────────────────────────────────
PRINT 'Seeding withdrawal requests (Finance)...';
INSERT INTO withdrawal_requests (freelancer_id, amount, bank_account_id, status, created_at, updated_at) VALUES
(@fl1, 1500000.00, @ba1, 'PENDING', DATEADD(hour, -1, GETDATE()), DATEADD(hour, -1, GETDATE())),
(@fl2, 2800000.00, @ba2, 'PENDING', DATEADD(hour, -2, GETDATE()), DATEADD(hour, -2, GETDATE())),
(@fl3, 4200000.00, @ba3, 'PENDING', DATEADD(hour, -3, GETDATE()), DATEADD(hour, -3, GETDATE())),
(@fl4, 10500000.00, @ba4, 'PENDING', DATEADD(hour, -4, GETDATE()), DATEADD(hour, -4, GETDATE())),
(@fl5, 750000.00, @ba5, 'PENDING', DATEADD(hour, -5, GETDATE()), DATEADD(hour, -5, GETDATE())),
(@fl1, 15000000.00, @ba1, 'PENDING', DATEADD(hour, -6, GETDATE()), DATEADD(hour, -6, GETDATE())),
(@fl2, 3500000.00, @ba2, 'PENDING', DATEADD(hour, -7, GETDATE()), DATEADD(hour, -7, GETDATE())),
(@fl3, 9200000.00, @ba3, 'PENDING', DATEADD(hour, -8, GETDATE()), DATEADD(hour, -8, GETDATE())),
(@fl4, 500000.00, @ba4, 'PENDING', DATEADD(hour, -9, GETDATE()), DATEADD(hour, -9, GETDATE())),
(@fl5, 12000000.00, @ba5, 'PENDING', DATEADD(hour, -10, GETDATE()), DATEADD(hour, -10, GETDATE())),
(@fl1, 6400000.00, @ba1, 'PENDING', DATEADD(hour, -11, GETDATE()), DATEADD(hour, -11, GETDATE())),
(@fl2, 8500000.00, @ba2, 'PENDING', DATEADD(hour, -12, GETDATE()), DATEADD(hour, -12, GETDATE())),
(@fl3, 2300000.00, @ba3, 'PENDING', DATEADD(hour, -13, GETDATE()), DATEADD(hour, -13, GETDATE())),
(@fl4, 1100000.00, @ba4, 'PENDING', DATEADD(hour, -14, GETDATE()), DATEADD(hour, -14, GETDATE())),
(@fl5, 19500000.00, @ba5, 'PENDING', DATEADD(hour, -15, GETDATE()), DATEADD(hour, -15, GETDATE()));

-- ─────────────────────────────────────────────────────────────────────────
-- 5. SEED KHIẾU NẠI & TRANH CHẤP (disputes) - 15 MẪU (YÊU CẦU CÓ HỢP ĐỒNG ĐI KÈM)
-- ─────────────────────────────────────────────────────────────────────────
PRINT 'Seeding projects and contracts for disputes...';

-- Create 15 projects for contracts (so we can dispute them)
INSERT INTO projects (client_id, category_id, title, description, project_type, budget_fixed, deadline, status, created_at, updated_at) VALUES
(@emp1, @cat1, N'Dự án Tranh Chấp 1', N'Dự án kiểm thử tranh chấp 1', 'FIXED_PRICE', 25000000.00, GETDATE(), 'PUBLISHED', GETDATE(), GETDATE()),
(@emp2, @cat2, N'Dự án Tranh Chấp 2', N'Dự án kiểm thử tranh chấp 2', 'FIXED_PRICE', 8000000.00, GETDATE(), 'PUBLISHED', GETDATE(), GETDATE()),
(@emp3, @cat1, N'Dự án Tranh Chấp 3', N'Dự án kiểm thử tranh chấp 3', 'FIXED_PRICE', 4500000.00, GETDATE(), 'PUBLISHED', GETDATE(), GETDATE()),
(@emp4, @cat2, N'Dự án Tranh Chấp 4', N'Dự án kiểm thử tranh chấp 4', 'FIXED_PRICE', 12000000.00, GETDATE(), 'PUBLISHED', GETDATE(), GETDATE()),
(@emp5, @cat1, N'Dự án Tranh Chấp 5', N'Dự án kiểm thử tranh chấp 5', 'FIXED_PRICE', 15000000.00, GETDATE(), 'PUBLISHED', GETDATE(), GETDATE()),
(@emp1, @cat2, N'Dự án Tranh Chấp 6', N'Dự án kiểm thử tranh chấp 6', 'FIXED_PRICE', 3000000.00, GETDATE(), 'PUBLISHED', GETDATE(), GETDATE()),
(@emp2, @cat1, N'Dự án Tranh Chấp 7', N'Dự án kiểm thử tranh chấp 7', 'FIXED_PRICE', 10000000.00, GETDATE(), 'PUBLISHED', GETDATE(), GETDATE()),
(@emp3, @cat2, N'Dự án Tranh Chấp 8', N'Dự án kiểm thử tranh chấp 8', 'FIXED_PRICE', 2500000.00, GETDATE(), 'PUBLISHED', GETDATE(), GETDATE()),
(@emp4, @cat1, N'Dự án Tranh Chấp 9', N'Dự án kiểm thử tranh chấp 9', 'FIXED_PRICE', 9000000.00, GETDATE(), 'PUBLISHED', GETDATE(), GETDATE()),
(@emp5, @cat2, N'Dự án Tranh Chấp 10', N'Dự án kiểm thử tranh chấp 10', 'FIXED_PRICE', 35000000.00, GETDATE(), 'PUBLISHED', GETDATE(), GETDATE()),
(@emp1, @cat1, N'Dự án Tranh Chấp 11', N'Dự án kiểm thử tranh chấp 11', 'FIXED_PRICE', 5000000.00, GETDATE(), 'PUBLISHED', GETDATE(), GETDATE()),
(@emp2, @cat2, N'Dự án Tranh Chấp 12', N'Dự án kiểm thử tranh chấp 12', 'FIXED_PRICE', 1500000.00, GETDATE(), 'PUBLISHED', GETDATE(), GETDATE()),
(@emp3, @cat1, N'Dự án Tranh Chấp 13', N'Dự án kiểm thử tranh chấp 13', 'FIXED_PRICE', 4000000.00, GETDATE(), 'PUBLISHED', GETDATE(), GETDATE()),
(@emp4, @cat2, N'Dự án Tranh Chấp 14', N'Dự án kiểm thử tranh chấp 14', 'FIXED_PRICE', 18000000.00, GETDATE(), 'PUBLISHED', GETDATE(), GETDATE()),
(@emp5, @cat1, N'Dự án Tranh Chấp 15', N'Dự án kiểm thử tranh chấp 15', 'FIXED_PRICE', 50000000.00, GETDATE(), 'PUBLISHED', GETDATE(), GETDATE());

-- Retrieve the IDs of these 15 projects
DECLARE @proj_tbl TABLE (idx INT IDENTITY(1,1), proj_id INT);
INSERT INTO @proj_tbl (proj_id)
SELECT project_id FROM projects WHERE title LIKE N'Dự án Tranh Chấp %' ORDER BY project_id ASC;

-- Insert 15 contracts
INSERT INTO contracts (project_id, freelancer_id, client_id, title, agreed_amount, start_date, status, created_at, updated_at) VALUES
((SELECT proj_id FROM @proj_tbl WHERE idx = 1), @fl1, @emp1, N'Hợp đồng Tranh Chấp 1', 25000000.00, GETDATE(), 'ACTIVE', GETDATE(), GETDATE()),
((SELECT proj_id FROM @proj_tbl WHERE idx = 2), @fl2, @emp2, N'Hợp đồng Tranh Chấp 2', 8000000.00, GETDATE(), 'ACTIVE', GETDATE(), GETDATE()),
((SELECT proj_id FROM @proj_tbl WHERE idx = 3), @fl3, @emp3, N'Hợp đồng Tranh Chấp 3', 4500000.00, GETDATE(), 'ACTIVE', GETDATE(), GETDATE()),
((SELECT proj_id FROM @proj_tbl WHERE idx = 4), @fl4, @emp4, N'Hợp đồng Tranh Chấp 4', 12000000.00, GETDATE(), 'ACTIVE', GETDATE(), GETDATE()),
((SELECT proj_id FROM @proj_tbl WHERE idx = 5), @fl5, @emp5, N'Hợp đồng Tranh Chấp 5', 15000000.00, GETDATE(), 'ACTIVE', GETDATE(), GETDATE()),
((SELECT proj_id FROM @proj_tbl WHERE idx = 6), @fl1, @emp1, N'Hợp đồng Tranh Chấp 6', 3000000.00, GETDATE(), 'ACTIVE', GETDATE(), GETDATE()),
((SELECT proj_id FROM @proj_tbl WHERE idx = 7), @fl2, @emp2, N'Hợp đồng Tranh Chấp 7', 10000000.00, GETDATE(), 'ACTIVE', GETDATE(), GETDATE()),
((SELECT proj_id FROM @proj_tbl WHERE idx = 8), @fl3, @emp3, N'Hợp đồng Tranh Chấp 8', 2500000.00, GETDATE(), 'ACTIVE', GETDATE(), GETDATE()),
((SELECT proj_id FROM @proj_tbl WHERE idx = 9), @fl4, @emp4, N'Hợp đồng Tranh Chấp 9', 9000000.00, GETDATE(), 'ACTIVE', GETDATE(), GETDATE()),
((SELECT proj_id FROM @proj_tbl WHERE idx = 10), @fl5, @emp5, N'Hợp đồng Tranh Chấp 10', 35000000.00, GETDATE(), 'ACTIVE', GETDATE(), GETDATE()),
((SELECT proj_id FROM @proj_tbl WHERE idx = 11), @fl1, @emp1, N'Hợp đồng Tranh Chấp 11', 5000000.00, GETDATE(), 'ACTIVE', GETDATE(), GETDATE()),
((SELECT proj_id FROM @proj_tbl WHERE idx = 12), @fl2, @emp2, N'Hợp đồng Tranh Chấp 12', 1500000.00, GETDATE(), 'ACTIVE', GETDATE(), GETDATE()),
((SELECT proj_id FROM @proj_tbl WHERE idx = 13), @fl3, @emp3, N'Hợp đồng Tranh Chấp 13', 4000000.00, GETDATE(), 'ACTIVE', GETDATE(), GETDATE()),
((SELECT proj_id FROM @proj_tbl WHERE idx = 14), @fl4, @emp4, N'Hợp đồng Tranh Chấp 14', 18000000.00, GETDATE(), 'ACTIVE', GETDATE(), GETDATE()),
((SELECT proj_id FROM @proj_tbl WHERE idx = 15), @fl5, @emp5, N'Hợp đồng Tranh Chấp 15', 50000000.00, GETDATE(), 'ACTIVE', GETDATE(), GETDATE());

-- Retrieve the IDs of these 15 contracts
DECLARE @contr_tbl TABLE (idx INT IDENTITY(1,1), contr_id INT);
INSERT INTO @contr_tbl (contr_id)
SELECT contract_id FROM contracts WHERE title LIKE N'Hợp đồng Tranh Chấp %' ORDER BY contract_id ASC;

PRINT 'Seeding disputes...';
INSERT INTO disputes (contract_id, project_title, client_name, freelancer_name, amount, reason, priority, status, created_at, updated_at) VALUES
((SELECT contr_id FROM @contr_tbl WHERE idx = 1), N'Xây dựng App bán hàng iOS/Android', N'VinGroup JSC', N'Le Hoang Nam', 25000000, N'Freelancer biến mất không phản hồi tin nhắn quá 7 ngày và trễ tiến độ', 'HIGH', 'OPEN', DATEADD(day, -1, GETDATE()), DATEADD(day, -1, GETDATE())),
((SELECT contr_id FROM @contr_tbl WHERE idx = 2), N'Thiết kế giao diện Figma cho Web App', N'SunGroup Corp', N'Tran Thu Ha', 8000000, N'Sản phẩm thiết kế không đúng mô tả thiết kế ban đầu, quá nhiều lỗi', 'MEDIUM', 'OPEN', DATEADD(day, -2, GETDATE()), DATEADD(day, -2, GETDATE())),
((SELECT contr_id FROM @contr_tbl WHERE idx = 3), N'Viết bài viết SEO Marketing 30 bài', N'Viettel Group', N'Nguyen Dang Khoa', 4500000, N'Bài viết copy paste sao chép từ đối thủ cạnh tranh trên 70%', 'LOW', 'OPEN', DATEADD(day, -3, GETDATE()), DATEADD(day, -3, GETDATE())),
((SELECT contr_id FROM @contr_tbl WHERE idx = 4), N'Chạy quảng cáo Facebook Ads 1 tháng', N'FPT Software Ltd', N'Pham Quoc Bao', 12000000, N'Freelancer tự ý đổi tài khoản quảng cáo không báo trước làm giảm tương tác', 'HIGH', 'OPEN', DATEADD(day, -4, GETDATE()), DATEADD(day, -4, GETDATE())),
((SELECT contr_id FROM @contr_tbl WHERE idx = 5), N'Tối ưu hóa Database SQL Server', N'M-Service Online', N'Do Thuy Chi', 15000000, N'Hệ thống bị sập và mất dữ liệu sau khi Freelancer thao tác cấu hình', 'HIGH', 'OPEN', DATEADD(day, -5, GETDATE()), DATEADD(day, -5, GETDATE())),
((SELECT contr_id FROM @contr_tbl WHERE idx = 6), N'Viết kịch bản video Tiktok chuyên nghiệp', N'VinGroup JSC', N'Le Hoang Nam', 3000000, N'Freelancer bàn giao kịch bản sơ sài, không chỉnh sửa theo ý kiến khách hàng', 'LOW', 'OPEN', DATEADD(day, -6, GETDATE()), DATEADD(day, -6, GETDATE())),
((SELECT contr_id FROM @contr_tbl WHERE idx = 7), N'Lập trình module chat WebSocket Java', N'SunGroup Corp', N'Tran Thu Ha', 10000000, N'Source code lỗi kết nối không chạy được, không cài đặt được', 'HIGH', 'OPEN', DATEADD(day, -7, GETDATE()), DATEADD(day, -7, GETDATE())),
((SELECT contr_id FROM @contr_tbl WHERE idx = 8), N'Thiết kế logo Specialty Cafe', N'Viettel Group', N'Nguyen Dang Khoa', 2500000, N'Ý tưởng thiết kế trùng lặp và sao chép với thương hiệu nổi tiếng khác', 'MEDIUM', 'OPEN', DATEADD(day, -8, GETDATE()), DATEADD(day, -8, GETDATE())),
((SELECT contr_id FROM @contr_tbl WHERE idx = 9), N'Dịch thuật tài liệu y khoa Anh-Việt', N'FPT Software Ltd', N'Pham Quoc Bao', 9000000, N'Bản dịch sai lệch thuật ngữ nghiêm trọng, sử dụng Google Translate', 'MEDIUM', 'OPEN', DATEADD(day, -9, GETDATE()), DATEADD(day, -9, GETDATE())),
((SELECT contr_id FROM @contr_tbl WHERE idx = 10), N'Lập trình Web App đặt lịch khám bệnh', N'M-Service Online', N'Do Thuy Chi', 35000000, N'Freelancer bàn giao thiếu chức năng thanh toán trực tuyến như thỏa thuận', 'HIGH', 'OPEN', DATEADD(day, -10, GETDATE()), DATEADD(day, -10, GETDATE())),
((SELECT contr_id FROM @contr_tbl WHERE idx = 11), N'Cắt HTML/CSS responsive 5 trang', N'VinGroup JSC', N'Le Hoang Nam', 5000000, N'Giao diện bị vỡ trên các màn hình di động phổ biến', 'LOW', 'OPEN', DATEADD(day, -11, GETDATE()), DATEADD(day, -11, GETDATE())),
((SELECT contr_id FROM @contr_tbl WHERE idx = 12), N'Viết bài đánh giá sản phẩm công nghệ', N'SunGroup Corp', N'Tran Thu Ha', 1500000, N'Chất lượng bài viết quá kém so với kỳ vọng ban đầu', 'LOW', 'OPEN', DATEADD(day, -12, GETDATE()), DATEADD(day, -12, GETDATE())),
((SELECT contr_id FROM @contr_tbl WHERE idx = 13), N'Thiết kế banner sự kiện âm nhạc', N'Viettel Group', N'Nguyen Dang Khoa', 4000000, N'Bàn giao muộn 3 ngày làm nhỡ lịch trình chạy quảng bá sự kiện', 'HIGH', 'OPEN', DATEADD(day, -13, GETDATE()), DATEADD(day, -13, GETDATE())),
((SELECT contr_id FROM @contr_tbl WHERE idx = 14), N'Tối ưu SEO On-page website thương mại', N'FPT Software Ltd', N'Pham Quoc Bao', 18000000, N'Từ khóa bị tụt hạng nghiêm trọng sau khi bàn giao dự án', 'MEDIUM', 'OPEN', DATEADD(day, -14, GETDATE()), DATEADD(day, -14, GETDATE())),
((SELECT contr_id FROM @contr_tbl WHERE idx = 15), N'Lập trình Smart Contract solidity', N'M-Service Online', N'Do Thuy Chi', 50000000, N'Smart contract dính lỗi bảo mật nghiêm trọng không deploy được', 'HIGH', 'OPEN', DATEADD(day, -15, GETDATE()), DATEADD(day, -15, GETDATE()));

-- ─────────────────────────────────────────────────────────────────────────
-- 6. SEED BÁO CÁO VI PHẠM (violation_reports) - 15 MẪU
-- ─────────────────────────────────────────────────────────────────────────
PRINT 'Seeding violation reports (Moderation)...';
INSERT INTO violation_reports (target_type, target_id, reporter_name, accused_name, severity, status, reason, evidence, created_at, updated_at) VALUES
('PROJECT', 'PRJ-101', N'Trần Văn Long', N'Employer VinGroup', 'HIGH', 'PENDING', N'Dự án tuyển dụng chứa nội dung lừa đảo yêu cầu nộp cọc tiền', 'https://example.com/evidence/prj-101.png', DATEADD(hour, -1, GETDATE()), GETDATE()),
('USER', 'USR-402', N'Lê Minh Nhật', N'Freelancer Le Hoang Nam', 'MEDIUM', 'PENDING', N'Freelancer gạ gẫm giao dịch ngoài nền tảng để trốn phí giao dịch', 'https://example.com/evidence/usr-402.png', DATEADD(hour, -2, GETDATE()), GETDATE()),
('PROJECT', 'PRJ-105', N'Nguyễn Hoàng Hải', N'SunGroup Corp', 'LOW', 'PENDING', N'Mô tả dự án có từ ngữ mang tính phân biệt đối xử vùng miền', 'https://example.com/evidence/prj-105.png', DATEADD(hour, -3, GETDATE()), GETDATE()),
('USER', 'USR-409', N'Đỗ Hà My', N'Employer Viettel Group', 'HIGH', 'PENDING', N'Khách hàng quỵt tiền sau khi Freelancer bàn giao source code', 'https://example.com/evidence/usr-409.png', DATEADD(hour, -4, GETDATE()), GETDATE()),
('PROJECT', 'PRJ-112', N'Bùi Tiến Dũng', N'FPT Software Ltd', 'MEDIUM', 'PENDING', N'Dự án có dấu hiệu spam bài đăng 5 lần liên tục cùng nội dung', 'https://example.com/evidence/prj-112.png', DATEADD(hour, -5, GETDATE()), GETDATE()),
('USER', 'USR-301', N'Phạm Thùy Chi', N'Freelancer Tran Thu Ha', 'LOW', 'PENDING', N'Sử dụng tài khoản clone tự đánh giá 5 sao cho bản thân', 'https://example.com/evidence/usr-301.png', DATEADD(hour, -6, GETDATE()), GETDATE()),
('PROJECT', 'PRJ-120', N'Nguyễn Quốc Anh', N'M-Service Online', 'HIGH', 'PENDING', N'Dự án đăng tải link độc hại chứa mã độc lừa đảo người dùng', 'https://example.com/evidence/prj-120.png', DATEADD(hour, -7, GETDATE()), GETDATE()),
('USER', 'USR-502', N'Đặng Thu Thảo', N'Freelancer Nguyen Dang Khoa', 'MEDIUM', 'PENDING', N'Hành vi quấy rối bằng tin nhắn thô tục xúc phạm danh dự', 'https://example.com/evidence/usr-502.png', DATEADD(hour, -8, GETDATE()), GETDATE()),
('PROJECT', 'PRJ-130', N'Vũ Gia Bảo', N'VinGroup JSC', 'LOW', 'PENDING', N'Thông tin dự án đăng tải sai sự thật, dụ dỗ làm CTV bán hàng đa cấp', 'https://example.com/evidence/prj-130.png', DATEADD(hour, -9, GETDATE()), GETDATE()),
('USER', 'USR-601', N'Hoàng Thanh Trúc', N'Freelancer Pham Quoc Bao', 'HIGH', 'PENDING', N'Freelancer lấy cắp mã nguồn dự án của công ty mang đi bán ngoài', 'https://example.com/evidence/usr-601.png', DATEADD(hour, -10, GETDATE()), GETDATE()),
('PROJECT', 'PRJ-140', N'Lâm Khánh Chi', N'SunGroup Corp', 'MEDIUM', 'PENDING', N'Dự án yêu cầu làm test không trả công với khối lượng công việc lớn', 'https://example.com/evidence/prj-140.png', DATEADD(hour, -11, GETDATE()), GETDATE()),
('USER', 'USR-701', N'Nguyễn Trọng Nghĩa', N'Employer Viettel Group', 'LOW', 'PENDING', N'Yêu cầu thông tin thẻ tín dụng cá nhân của freelancer trước khi giao việc', 'https://example.com/evidence/usr-701.png', DATEADD(hour, -12, GETDATE()), GETDATE()),
('PROJECT', 'PRJ-150', N'Trịnh Thăng Bình', N'FPT Software Ltd', 'HIGH', 'PENDING', N'Dự án lừa đảo nộp tiền mua tài liệu khóa học trước khi bắt đầu', 'https://example.com/evidence/prj-150.png', DATEADD(hour, -13, GETDATE()), GETDATE()),
('USER', 'USR-801', N'Ngô Kiến Huy', N'Freelancer Do Thuy Chi', 'MEDIUM', 'PENDING', N'Freelancer spam tin nhắn chào mời dịch vụ SEO quá nhiều lần', 'https://example.com/evidence/usr-801.png', DATEADD(hour, -14, GETDATE()), GETDATE()),
('PROJECT', 'PRJ-160', N'Nguyễn Thanh Tùng', N'M-Service Online', 'LOW', 'PENDING', N'Mô tả dự án vi phạm bản quyền thương hiệu FelanPro', 'https://example.com/evidence/prj-160.png', DATEADD(hour, -15, GETDATE()), GETDATE());

-- ─────────────────────────────────────────────────────────────────────────
-- 7. SEED HỖ TRỢ KHÁCH HÀNG (support_tickets & ticket_messages) - 15 MẪU CHAT
-- ─────────────────────────────────────────────────────────────────────────
PRINT 'Seeding support tickets (CS Chats)...';
INSERT INTO support_tickets (freelancer_id, employer_id, subject, description, status, priority, assigned_staff_id, created_at, updated_at) VALUES
(@fl1, NULL, N'Yêu cầu gỡ cấm chat tạm thời', N'Tôi bị cấm chat do hiểu nhầm ngôn từ. Nhờ CS hỗ trợ mở khóa', 'OPEN', 'MEDIUM', NULL, DATEADD(minute, -10, GETDATE()), GETDATE()),
(NULL, @emp1, N'Không xuất được hóa đơn điện tử', N'Hệ thống báo lỗi định dạng mã số thuế doanh nghiệp', 'OPEN', 'HIGH', NULL, DATEADD(minute, -20, GETDATE()), GETDATE()),
(@fl2, NULL, N'Lỗi cập nhật ảnh chân dung KYC', N'Mỗi lần tải ảnh chân dung lên đều báo lỗi kích thước vượt giới hạn', 'OPEN', 'LOW', NULL, DATEADD(minute, -30, GETDATE()), GETDATE()),
(NULL, @emp2, N'Yêu cầu hoàn trả tiền Escrow', N'Dự án #120 đã quá hạn 10 ngày nhưng Freelancer không giao bài', 'OPEN', 'HIGH', NULL, DATEADD(minute, -40, GETDATE()), GETDATE()),
(@fl3, NULL, N'Tài khoản không hiển thị trên danh sách', N'Tôi đã bật sẵn sàng làm việc nhưng không thấy hồ sơ của mình', 'OPEN', 'LOW', NULL, DATEADD(minute, -50, GETDATE()), GETDATE()),
(NULL, @emp3, N'Hỗ trợ cấu hình cổng thanh toán MOMO', N'Muốn liên kết cổng MOMO doanh nghiệp với tài khoản LancerPro', 'OPEN', 'MEDIUM', NULL, DATEADD(minute, -60, GETDATE()), GETDATE()),
(@fl4, NULL, N'Nghi vấn có người hack tài khoản', N'Tôi nhận được mail đăng nhập từ IP lạ ở nước ngoài', 'OPEN', 'HIGH', NULL, DATEADD(minute, -70, GETDATE()), GETDATE()),
(NULL, @emp4, N'Lỗi giao diện đăng dự án mới', N'Nhấn nút đăng dự án nhưng màn hình cứ xoay vòng', 'OPEN', 'LOW', NULL, DATEADD(minute, -80, GETDATE()), GETDATE()),
(@fl5, NULL, N'Không liên kết được tài khoản Vietcombank', N'Thông báo tên chủ thẻ không khớp mặc dù đã ghi in hoa', 'OPEN', 'MEDIUM', NULL, DATEADD(minute, -90, GETDATE()), GETDATE()),
(NULL, @emp5, N'Yêu cầu đổi thông tin MST', N'Doanh nghiệp thay đổi đăng ký kinh doanh, cần đổi thông tin MST', 'OPEN', 'MEDIUM', NULL, DATEADD(minute, -100, GETDATE()), GETDATE()),
(@fl1, NULL, N'Freelancer Pro badge chưa kích hoạt', N'Tôi đã đủ điều kiện nâng cấp lên PRO nhưng chưa thấy cập nhật', 'OPEN', 'LOW', NULL, DATEADD(minute, -110, GETDATE()), GETDATE()),
(NULL, @emp1, N'Kháng nghị báo cáo vi phạm spam', N'Bị cảnh báo spam bài đăng dù đây là 2 dự án hoàn toàn khác nhau', 'OPEN', 'MEDIUM', NULL, DATEADD(minute, -120, GETDATE()), GETDATE()),
(@fl2, NULL, N'Hủy hợp đồng khẩn cấp do scam', N'Khách hàng có hành vi lừa đảo bên ngoài sàn, tôi muốn hủy hợp đồng', 'OPEN', 'HIGH', NULL, DATEADD(minute, -130, GETDATE()), GETDATE()),
(NULL, @emp2, N'Yêu cầu trích xuất lịch sử giao dịch', N'Cần file Excel thống kê chi tiêu quý 1 để báo cáo thuế', 'OPEN', 'LOW', NULL, DATEADD(minute, -140, GETDATE()), GETDATE()),
(@fl3, NULL, N'Ví của tôi bị âm số dư vô cớ', N'Sau khi hoàn tiền dự án, ví hiển thị số dư âm. Cần giải trình', 'OPEN', 'HIGH', NULL, DATEADD(minute, -150, GETDATE()), GETDATE());

-- Đồng bộ tin nhắn đầu tiên tự động cho mỗi ticket để tránh lỗi chat rỗng
INSERT INTO ticket_messages (ticket_id, sender_freelancer_id, sender_employer_id, sender_admin_id, message_text, is_read, sent_at)
SELECT ticket_id, freelancer_id, employer_id, NULL, N'Chào Ban Hỗ Trợ, tôi gặp sự cố này mong anh chị hỗ trợ giải quyết gấp giúp tôi với ạ. Xin cảm ơn!', 0, GETDATE()
FROM support_tickets;
GO

-- ─────────────────────────────────────────────────────────────────────────
-- 8. SEED DỰ ÁN CHỜ DUYỆT (projects với status = 'PENDING') - 15 MẪU
-- ─────────────────────────────────────────────────────────────────────────
PRINT 'Seeding pending projects for moderation...';
DECLARE @emp1 INT = (SELECT TOP 1 employer_id FROM employers WHERE email = 'kyc_test_emp1@gmail.com');
DECLARE @emp2 INT = (SELECT TOP 1 employer_id FROM employers WHERE email = 'kyc_test_emp2@gmail.com');
DECLARE @emp3 INT = (SELECT TOP 1 employer_id FROM employers WHERE email = 'kyc_test_emp3@gmail.com');
DECLARE @emp4 INT = (SELECT TOP 1 employer_id FROM employers WHERE email = 'kyc_test_emp4@gmail.com');
DECLARE @emp5 INT = (SELECT TOP 1 employer_id FROM employers WHERE email = 'kyc_test_emp5@gmail.com');

DECLARE @cat1 INT = (SELECT TOP 1 category_id FROM job_categories ORDER BY category_id ASC);
DECLARE @cat2 INT = (SELECT TOP 1 category_id FROM job_categories WHERE category_id > @cat1 ORDER BY category_id ASC);

INSERT INTO projects (client_id, category_id, title, description, project_type, budget_min, budget_max, deadline, status, proposal_count, created_at, updated_at) VALUES
(@emp1, @cat1, N'Xây dựng hệ thống quản lý nhân sự HRM', N'Cần thiết kế và xây dựng phần mềm quản lý chấm công, tính lương và hồ sơ nhân sự bằng Java Spring Boot và Angular.', 'PROJECT', 20000000.00, 45000000.00, DATEADD(day, 30, GETDATE()), 'PENDING', 0, DATEADD(hour, -1, GETDATE()), GETDATE()),
(@emp2, @cat2, N'Thiết kế giao diện landing page cho hãng mỹ phẩm', N'Cần thiết kế 1 trang Landing Page giới thiệu dòng sản phẩm son môi mới. Phong cách trẻ trung, sang trọng.', 'PROJECT', 4000000.00, 8000000.00, DATEADD(day, 10, GETDATE()), 'PENDING', 0, DATEADD(hour, -2, GETDATE()), GETDATE()),
(@emp3, @cat1, N'Viết tool auto checkout sàn TMĐT', N'Viết script Python tự động thêm sản phẩm vào giỏ hàng và thanh toán nhanh trên Shopee/Lazada.', 'PROJECT', 5000000.00, 10000000.00, DATEADD(day, 15, GETDATE()), 'PENDING', 0, DATEADD(hour, -3, GETDATE()), GETDATE()),
(@emp4, @cat2, N'Thiết kế bộ nhận diện thương hiệu bất động sản', N'Thiết kế logo, namecard, phong bì thư, tài liệu bán hàng cho công ty bất động sản LandGroup.', 'PROJECT', 15000000.00, 25000000.00, DATEADD(day, 45, GETDATE()), 'PENDING', 0, DATEADD(hour, -4, GETDATE()), GETDATE()),
(@emp5, @cat1, N'Lập trình Web App học tiếng Anh online', N'Ứng dụng học từ vựng tiếng Anh giao tiếp có chấm điểm phát âm bằng AI API.', 'PROJECT', 30000000.00, 60000000.00, DATEADD(day, 60, GETDATE()), 'PENDING', 0, DATEADD(hour, -5, GETDATE()), GETDATE()),
(@emp1, @cat2, N'Vẽ ảnh minh họa cho truyện ngắn', N'Cần vẽ 15 bức tranh minh họa màu nước cho tập truyện ngắn thiếu nhi.', 'PROJECT', 6000000.00, 12000000.00, DATEADD(day, 20, GETDATE()), 'PENDING', 0, DATEADD(hour, -6, GETDATE()), GETDATE()),
(@emp2, @cat1, N'Tối ưu hóa tốc độ tải trang Web Ecommerce', N'Website NextJS tải quá chậm (PageSpeed Score dưới 40). Cần tối ưu đạt trên 85 điểm.', 'PROJECT', 3000000.00, 7000000.00, DATEADD(day, 7, GETDATE()), 'PENDING', 0, DATEADD(hour, -7, GETDATE()), GETDATE()),
(@emp3, @cat2, N'Thiết kế UI/UX app giao hàng nhanh', N'Thiết kế khoảng 25 màn hình ứng dụng shipper và khách hàng trên Figma.', 'PROJECT', 12000000.00, 20000000.00, DATEADD(day, 25, GETDATE()), 'PENDING', 0, DATEADD(hour, -8, GETDATE()), GETDATE()),
(@emp4, @cat1, N'Xây dựng hệ thống Chatbot Fanpage AI', N'Chatbot tự động tư vấn sản phẩm quần áo và chốt đơn dựa trên OpenAI API.', 'PROJECT', 8000000.00, 15000000.00, DATEADD(day, 14, GETDATE()), 'PENDING', 0, DATEADD(hour, -9, GETDATE()), GETDATE()),
(@emp5, @cat2, N'Làm video 2D animation giới thiệu sản phẩm', N'Video thời lượng 90 giây giới thiệu tính năng của ứng dụng ví điện tử.', 'PROJECT', 10000000.00, 18000000.00, DATEADD(day, 18, GETDATE()), 'PENDING', 0, DATEADD(hour, -10, GETDATE()), GETDATE()),
(@emp1, @cat1, N'Lập trình extension Chrome quản lý tab', N'Extension giúp nhóm các tab làm việc cùng chủ đề và tự động sao lưu Cloud.', 'PROJECT', 2000000.00, 5000000.00, DATEADD(day, 5, GETDATE()), 'PENDING', 0, DATEADD(hour, -11, GETDATE()), GETDATE()),
(@emp2, @cat2, N'Thiết kế bao bì hộp trà thảo mộc', N'Thiết kế bao bì dạng hộp giấy cứng và nhãn mác chai thủy tinh.', 'PROJECT', 5000000.00, 9000000.00, DATEADD(day, 12, GETDATE()), 'PENDING', 0, DATEADD(hour, -12, GETDATE()), GETDATE()),
(@emp3, @cat1, N'Setup và cấu hình server Ubuntu VPS', N'Cài đặt nginx, SSL, NodeJS, MySQL và deploy 3 website lên VPS.', 'PROJECT', 1500000.00, 3000000.00, DATEADD(day, 3, GETDATE()), 'PENDING', 0, DATEADD(hour, -13, GETDATE()), GETDATE()),
(@emp4, @cat2, N'Thiết kế slide thuyết trình gọi vốn', N'Cần thiết kế bộ slide Pitch Deck 15 trang chuyên nghiệp, hiện đại.', 'PROJECT', 3000000.00, 6000000.00, DATEADD(day, 6, GETDATE()), 'PENDING', 0, DATEADD(hour, -14, GETDATE()), GETDATE()),
(@emp5, @cat1, N'Lập trình chức năng quét mã vạch sản phẩm', N'Tích hợp chức năng quét mã vạch kiểm kho vào app React Native có sẵn.', 'PROJECT', 4000000.00, 8000000.00, DATEADD(day, 8, GETDATE()), 'PENDING', 0, DATEADD(hour, -15, GETDATE()), GETDATE());
GO

-- ─────────────────────────────────────────────────────────────────────────
-- 9. SEED YÊU CẦU CẬP NHẬT HỒ SƠ DOANH NGHIỆP (employer_profile_requests) - 15 MẪU
-- ─────────────────────────────────────────────────────────────────────────
PRINT 'Seeding profile moderation requests...';
DECLARE @emp1 INT = (SELECT TOP 1 employer_id FROM employers WHERE email = 'kyc_test_emp1@gmail.com');
DECLARE @emp2 INT = (SELECT TOP 1 employer_id FROM employers WHERE email = 'kyc_test_emp2@gmail.com');
DECLARE @emp3 INT = (SELECT TOP 1 employer_id FROM employers WHERE email = 'kyc_test_emp3@gmail.com');
DECLARE @emp4 INT = (SELECT TOP 1 employer_id FROM employers WHERE email = 'kyc_test_emp4@gmail.com');
DECLARE @emp5 INT = (SELECT TOP 1 employer_id FROM employers WHERE email = 'kyc_test_emp5@gmail.com');

INSERT INTO employer_profile_requests (employer_id, display_name, full_name, phone, company_name, company_logo_url, company_description, website, address, city, country, company_size, industry, tax_code, status, created_at, updated_at) VALUES
(@emp1, 'VinGroup Corp', 'Nguyen Viet Q', '0909000001', 'VinGroup JSC', 'https://ui-avatars.com/api/?name=VinGroup', N'Chúng tôi cập nhật mô tả tầm nhìn chiến lược phát triển xe điện.', 'https://vingroup.net', '72 Le Thanh Ton', 'Ho Chi Minh', 'Viet Nam', '500+', 'Cong nghiep', '0102345671', 'PENDING', DATEADD(hour, -1, GETDATE()), GETDATE()),
(@emp2, 'SunGroup', 'Le Viet L', '0909000002', 'SunGroup Corp', 'https://ui-avatars.com/api/?name=SunGroup', N'Cập nhật giới thiệu chuỗi resort và khách sạn cao cấp.', 'https://sungroup.com.vn', '3 Pasteur', 'Da Nang', 'Viet Nam', '500+', 'Du lich', '0203456781', 'PENDING', DATEADD(hour, -2, GETDATE()), GETDATE()),
(@emp3, 'Viettel Corp', 'Nguyen Manh H', '0909000003', 'Viettel Group', 'https://ui-avatars.com/api/?name=Viettel', N'Cập nhật thông tin chi tiết nhà mạng viễn thông quốc gia.', 'https://viettel.com.vn', '1 Giang Van Minh', 'Ha Noi', 'Viet Nam', '500+', 'Vien thong', '0304567891', 'PENDING', DATEADD(hour, -3, GETDATE()), GETDATE()),
(@emp4, 'FPT Soft', 'Truong Gia B', '0909000004', 'FPT Software Ltd', 'https://ui-avatars.com/api/?name=FPT', N'Yêu cầu cập nhật địa điểm văn phòng đại diện tại Hòa Lạc.', 'https://fpt-software.com', 'Hoa Lac High Tech', 'Ha Noi', 'Viet Nam', '500+', 'IT Outsourcing', '0405678901', 'PENDING', DATEADD(hour, -4, GETDATE()), GETDATE()),
(@emp5, 'Momo Pay', 'Nguyen Ba D', '0909000005', 'M-Service Online', 'https://ui-avatars.com/api/?name=Momo', N'Cập nhật thông tin ví điện tử số 1 Việt Nam.', 'https://momo.vn', '235 Dong Khoi', 'Ho Chi Minh', 'Viet Nam', '100-500', 'Fintech', '0506789011', 'PENDING', DATEADD(hour, -5, GETDATE()), GETDATE()),
(@emp1, 'VinGroup Corp', 'Nguyen Viet Q', '0909000001', 'VinGroup JSC', 'https://ui-avatars.com/api/?name=VinGroup', N'Cập nhật số điện thoại đường dây nóng hỗ trợ tuyển dụng.', 'https://vingroup.net', '72 Le Thanh Ton', 'Ho Chi Minh', 'Viet Nam', '500+', 'Cong nghiep', '0102345671', 'PENDING', DATEADD(hour, -6, GETDATE()), GETDATE()),
(@emp2, 'SunGroup', 'Le Viet L', '0909000002', 'SunGroup Corp', 'https://ui-avatars.com/api/?name=SunGroup', N'Cập nhật tài khoản thanh toán thuế mới.', 'https://sungroup.com.vn', '3 Pasteur', 'Da Nang', 'Viet Nam', '500+', 'Du lich', '0203456781', 'PENDING', DATEADD(hour, -7, GETDATE()), GETDATE()),
(@emp3, 'Viettel Corp', 'Nguyen Manh H', '0909000003', 'Viettel Group', 'https://ui-avatars.com/api/?name=Viettel', N'Thay đổi địa chỉ email tiếp nhận hóa đơn VAT.', 'https://viettel.com.vn', '1 Giang Van Minh', 'Ha Noi', 'Viet Nam', '500+', 'Vien thong', '0304567891', 'PENDING', DATEADD(hour, -8, GETDATE()), GETDATE()),
(@emp4, 'FPT Soft', 'Truong Gia B', '0909000004', 'FPT Software Ltd', 'https://ui-avatars.com/api/?name=FPT', N'Thay đổi đại diện liên lạc phòng nhân sự.', 'https://fpt-software.com', 'Hoa Lac High Tech', 'Ha Noi', 'Viet Nam', '500+', 'IT Outsourcing', '0405678901', 'PENDING', DATEADD(hour, -9, GETDATE()), GETDATE()),
(@emp5, 'Momo Pay', 'Nguyen Ba D', '0909000005', 'M-Service Online', 'https://ui-avatars.com/api/?name=Momo', N'Cập nhật website hỗ trợ đối tác bán hàng.', 'https://momo.vn', '235 Dong Khoi', 'Ho Chi Minh', 'Viet Nam', '100-500', 'Fintech', '0506789011', 'PENDING', DATEADD(hour, -10, GETDATE()), GETDATE()),
(@emp1, 'VinGroup Corp', 'Nguyen Viet Q', '0909000001', 'VinGroup JSC', 'https://ui-avatars.com/api/?name=VinGroup', N'Đổi tên hiển thị ngắn trên sàn để Freelancer dễ tìm kiếm.', 'https://vingroup.net', '72 Le Thanh Ton', 'Ho Chi Minh', 'Viet Nam', '500+', 'Cong nghiep', '0102345671', 'PENDING', DATEADD(hour, -11, GETDATE()), GETDATE()),
(@emp2, 'SunGroup', 'Le Viet L', '0909000002', 'SunGroup Corp', 'https://ui-avatars.com/api/?name=SunGroup', N'Cập nhật lĩnh vực hoạt động: Bất động sản nghỉ dưỡng.', 'https://sungroup.com.vn', '3 Pasteur', 'Da Nang', 'Viet Nam', '500+', 'Bất động sản', '0203456781', 'PENDING', DATEADD(hour, -12, GETDATE()), GETDATE()),
(@emp3, 'Viettel Corp', 'Nguyen Manh H', '0909000003', 'Viettel Group', 'https://ui-avatars.com/api/?name=Viettel', N'Thêm mã bưu chính của tòa nhà Viettel.', 'https://viettel.com.vn', '1 Giang Van Minh', 'Ha Noi', 'Viet Nam', '500+', 'Vien thong', '0304567891', 'PENDING', DATEADD(hour, -13, GETDATE()), GETDATE()),
(@emp4, 'FPT Soft', 'Truong Gia B', '0909000004', 'FPT Software Ltd', 'https://ui-avatars.com/api/?name=FPT', N'Cập nhật Logo chuẩn HD mới nhất.', 'https://fpt-software.com', 'Hoa Lac High Tech', 'Ha Noi', 'Viet Nam', '500+', 'IT Outsourcing', '0405678901', 'PENDING', DATEADD(hour, -14, GETDATE()), GETDATE()),
(@emp5, 'Momo Pay', 'Nguyen Ba D', '0909000005', 'M-Service Online', 'https://ui-avatars.com/api/?name=Momo', N'Cập nhật MST doanh nghiệp chính thức của MOMO.', 'https://momo.vn', '235 Dong Khoi', 'Ho Chi Minh', 'Viet Nam', '100-500', 'Fintech', '0506789011', 'PENDING', DATEADD(hour, -15, GETDATE()), GETDATE());

PRINT 'Seed completed successfully!';
GO
