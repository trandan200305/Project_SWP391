USE CNY;
GO

-- Sửa kiểu dữ liệu các cột trong bảng disputes sang NVARCHAR để hỗ trợ Unicode tiếng Việt
ALTER TABLE disputes ALTER COLUMN project_title NVARCHAR(255);
ALTER TABLE disputes ALTER COLUMN client_name NVARCHAR(255);
ALTER TABLE disputes ALTER COLUMN freelancer_name NVARCHAR(255);
GO

-- Xóa các bản ghi có ký tự bị lỗi dấu để chèn lại cho đẹp
DELETE FROM disputes WHERE status = 'RESOLVED_CLIENT_FAVOR';
GO

-- ============================================================================
-- 1. SQL chèn dữ liệu mẫu cho mục "Hoàn tiền" (Refunds)
-- (Danh mục này hiển thị các tranh chấp có trạng thái 'RESOLVED_CLIENT_FAVOR'
--  và bắt buộc phải tham chiếu đến một Contract hợp lệ)
-- ============================================================================

-- Tìm hoặc tự động tạo một Hợp đồng (Contract) mẫu để liên kết
DECLARE @contractId INT;
SELECT TOP 1 @contractId = contract_id FROM contracts;

IF @contractId IS NULL
BEGIN
    DECLARE @projectId INT;
    DECLARE @freelancerId INT;
    DECLARE @clientId INT;
    
    SELECT TOP 1 @projectId = project_id FROM projects;
    SELECT TOP 1 @freelancerId = freelancer_id FROM freelancers;
    SELECT TOP 1 @clientId = employer_id FROM employers;
    
    -- Chỉ tạo hợp đồng mẫu nếu hệ thống đã có Project, Freelancer và Employer
    IF @projectId IS NOT NULL AND @freelancerId IS NOT NULL AND @clientId IS NOT NULL
    BEGIN
        INSERT INTO contracts (project_id, freelancer_id, client_id, title, agreed_amount, start_date, status)
        VALUES (@projectId, @freelancerId, @clientId, N'Hợp đồng mẫu phát triển Website', 15000000, GETDATE(), 'ACTIVE');
        
        SELECT TOP 1 @contractId = contract_id FROM contracts;
    END
END

-- Chèn dữ liệu tranh chấp hoàn tiền nếu có hợp đồng hợp lệ
IF @contractId IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM disputes WHERE project_title = N'Thiết kế Landing Page Bất Động Sản')
    BEGIN
        INSERT INTO disputes (contract_id, project_title, client_name, freelancer_name, amount, reason, priority, status, created_at, updated_at)
        VALUES (@contractId, N'Thiết kế Landing Page Bất Động Sản', N'Vingroup Agency', N'Nguyễn Minh Anh', 4500000, N'Freelancer không bàn giao source code đúng hẹn', 'HIGH', 'RESOLVED_CLIENT_FAVOR', DATEADD(day, -1, GETDATE()), DATEADD(day, -1, GETDATE()));
    END

    IF NOT EXISTS (SELECT 1 FROM disputes WHERE project_title = N'Xây dựng Mobile App bán hàng Flutter')
    BEGIN
        INSERT INTO disputes (contract_id, project_title, client_name, freelancer_name, amount, reason, priority, status, created_at, updated_at)
        VALUES (@contractId, N'Xây dựng Mobile App bán hàng Flutter', N'Cửa hàng thời trang Hana', N'Trần Quang Huy', 15000000, N'Ứng dụng lỗi liên tục và không hỗ trợ sửa lỗi', 'HIGH', 'RESOLVED_CLIENT_FAVOR', DATEADD(day, -2, GETDATE()), DATEADD(day, -2, GETDATE()));
    END
END
ELSE
BEGIN
    PRINT 'CANNOT SEED DISPUTES: Please ensure you have at least one Project, Freelancer, and Employer seeded first.';
END
GO


-- ============================================================================
-- 2. SQL chèn dữ liệu mẫu cho mục "Giao dịch lỗi" (Failed Transactions / VNPay)
-- ============================================================================

-- Chèn giao dịch 1 (FAILED)
IF NOT EXISTS (SELECT 1 FROM payment_transactions WHERE txn_ref = 'TXN87654321')
BEGIN
    INSERT INTO payment_transactions (txn_ref, employer_id, project_id, amount, status, vnp_transaction_no, created_at, updated_at)
    VALUES ('TXN87654321', 1, 102, 5000000, 'FAILED', 'N/A', DATEADD(day, -1, GETDATE()), DATEADD(day, -1, GETDATE()));
END

-- Chèn giao dịch 2 (SUCCESS)
IF NOT EXISTS (SELECT 1 FROM payment_transactions WHERE txn_ref = 'TXN12345678')
BEGIN
    INSERT INTO payment_transactions (txn_ref, employer_id, project_id, amount, status, vnp_transaction_no, created_at, updated_at)
    VALUES ('TXN12345678', 1, 101, 15000000, 'SUCCESS', '14012345', GETDATE(), GETDATE());
END

-- Chèn giao dịch 3 (PENDING)
IF NOT EXISTS (SELECT 1 FROM payment_transactions WHERE txn_ref = 'TXN99999999')
BEGIN
    INSERT INTO payment_transactions (txn_ref, employer_id, project_id, amount, status, vnp_transaction_no, created_at, updated_at)
    VALUES ('TXN99999999', 1, 103, 3500000, 'PENDING', 'N/A', DATEADD(hour, -2, GETDATE()), DATEADD(hour, -2, GETDATE()));
END
GO


-- ============================================================================
-- 3. SQL chèn dữ liệu mẫu cho mục "Rút tiền" (Withdrawals)
-- ============================================================================

-- Tạo tài khoản ngân hàng mẫu nếu chưa có tài khoản nào
IF NOT EXISTS (SELECT 1 FROM bank_accounts WHERE account_number = '102345910')
BEGIN
    DECLARE @firstFreelancerId INT;
    SELECT TOP 1 @firstFreelancerId = freelancer_id FROM freelancers ORDER BY freelancer_id ASC;
    
    IF @firstFreelancerId IS NOT NULL
    BEGIN
        INSERT INTO bank_accounts (freelancer_id, bank_name, account_number, account_holder, is_default)
        VALUES (@firstFreelancerId, 'Vietcombank', '102345910', 'NGUYEN MINH ANH', 1);
    END
END
GO

-- Chèn các yêu cầu rút tiền mẫu liên kết với tài khoản ngân hàng đã có
DECLARE @fid INT;
DECLARE @bid INT;
SELECT TOP 1 @fid = freelancer_id, @bid = bank_account_id FROM bank_accounts;

IF @fid IS NOT NULL AND @bid IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM withdrawal_requests WHERE amount = 12000000 AND status = 'PENDING')
    BEGIN
        INSERT INTO withdrawal_requests (freelancer_id, amount, bank_account_id, status, created_at, updated_at)
        VALUES (@fid, 12000000, @bid, 'PENDING', GETDATE(), GETDATE());
    END
    
    IF NOT EXISTS (SELECT 1 FROM withdrawal_requests WHERE amount = 3500000 AND status = 'APPROVED')
    BEGIN
        INSERT INTO withdrawal_requests (freelancer_id, amount, bank_account_id, status, created_at, updated_at)
        VALUES (@fid, 3500000, @bid, 'APPROVED', DATEADD(day, -3, GETDATE()), GETDATE());
    END
    
    IF NOT EXISTS (SELECT 1 FROM withdrawal_requests WHERE amount = 1500000 AND status = 'REJECTED')
    BEGIN
        INSERT INTO withdrawal_requests (freelancer_id, amount, bank_account_id, status, created_at, updated_at)
        VALUES (@fid, 1500000, @bid, 'REJECTED', DATEADD(day, -5, GETDATE()), GETDATE());
    END
END
GO
