-- =========================================================================
-- SEED 5 STAFF ACCOUNTS CORRESPONDING TO THE 5 DEPARTMENTS
-- Default Password for all accounts: 123456
-- Project: vLance Freelance Marketplace (CNY)
-- =========================================================================

USE CNY;
GO

BEGIN TRANSACTION;

BEGIN TRY
    -- 1. Đảm bảo 5 phòng ban chuẩn tồn tại trong Database
    IF NOT EXISTS (SELECT 1 FROM dbo.departments WHERE code = 'FIN')
        INSERT INTO dbo.departments (name, code, description, max_managers) 
        VALUES (N'Phòng Tài chính (Finance)', 'FIN', N'Quản lý rút tiền, hoàn tiền, escrow, giao dịch tài chính', 5);

    IF NOT EXISTS (SELECT 1 FROM dbo.departments WHERE code = 'MOD')
        INSERT INTO dbo.departments (name, code, description, max_managers) 
        VALUES (N'Phòng Kiểm duyệt (Moderation)', 'MOD', N'Duyệt dự án, kiểm duyệt nội dung, KYC', 5);

    IF NOT EXISTS (SELECT 1 FROM dbo.departments WHERE code = 'DIS')
        INSERT INTO dbo.departments (name, code, description, max_managers) 
        VALUES (N'Phòng Tranh chấp (Dispute Resolution)', 'DIS', N'Xử lý tranh chấp, phân xử hợp đồng giữa các bên', 5);

    IF NOT EXISTS (SELECT 1 FROM dbo.departments WHERE code = 'CS')
        INSERT INTO dbo.departments (name, code, description, max_managers) 
        VALUES (N'Phòng Hỗ trợ (Customer Support)', 'CS', N'Support tickets, hỗ trợ và chăm sóc người dùng', 5);

    IF NOT EXISTS (SELECT 1 FROM dbo.departments WHERE code = 'IT')
        INSERT INTO dbo.departments (name, code, description, max_managers) 
        VALUES (N'Phòng Kỹ thuật (IT & Development)', 'IT', N'Bảo trì hệ thống, cấu hình, CMS, SEO, vận hành kỹ thuật', 5);

    -- 2. Tạo mã BCrypt cho mật khẩu mặc định: 123456
    DECLARE @HashPassword NVARCHAR(255) = '$2a$10$r92g32Q1U8Q/D73m6f5ZxeKz49fN7VqO/kM1Gg8yXlA/4Zt51HhKe';

    -- [1] Staff Phòng Tài chính (Finance) - FIN
    IF NOT EXISTS (SELECT 1 FROM dbo.staff WHERE email = 'staff.finance@gmail.com')
    BEGIN
        INSERT INTO dbo.staff (email, password_hash, display_name, full_name, phone, avatar_url, status, specialization, department_id, is_deleted)
        VALUES (
            'staff.finance@gmail.com', 
            @HashPassword, 
            N'Staff Finance', 
            N'Nhân viên Tài chính', 
            '0912000001', 
            'https://ui-avatars.com/api/?name=Staff+Finance&background=006b2c&color=fff', 
            'ACTIVE', 
            N'Financial Analyst', 
            (SELECT department_id FROM dbo.departments WHERE code = 'FIN'), 
            0
        );
    END

    -- [2] Staff Phòng Kiểm duyệt (Moderation) - MOD
    IF NOT EXISTS (SELECT 1 FROM dbo.staff WHERE email = 'staff.moderation@gmail.com')
    BEGIN
        INSERT INTO dbo.staff (email, password_hash, display_name, full_name, phone, avatar_url, status, specialization, department_id, is_deleted)
        VALUES (
            'staff.moderation@gmail.com', 
            @HashPassword, 
            N'Staff Moderation', 
            N'Nhân viên Kiểm duyệt', 
            '0912000002', 
            'https://ui-avatars.com/api/?name=Staff+Moderation&background=006b2c&color=fff', 
            'ACTIVE', 
            N'Content Moderator', 
            (SELECT department_id FROM dbo.departments WHERE code = 'MOD'), 
            0
        );
    END

    -- [3] Staff Phòng Tranh chấp (Dispute Resolution) - DIS
    IF NOT EXISTS (SELECT 1 FROM dbo.staff WHERE email = 'staff.dispute@gmail.com')
    BEGIN
        INSERT INTO dbo.staff (email, password_hash, display_name, full_name, phone, avatar_url, status, specialization, department_id, is_deleted)
        VALUES (
            'staff.dispute@gmail.com', 
            @HashPassword, 
            N'Staff Dispute', 
            N'Nhân viên Tranh chấp', 
            '0912000003', 
            'https://ui-avatars.com/api/?name=Staff+Dispute&background=006b2c&color=fff', 
            'ACTIVE', 
            N'Dispute Specialist', 
            (SELECT department_id FROM dbo.departments WHERE code = 'DIS'), 
            0
        );
    END

    -- [4] Staff Phòng Hỗ trợ (Customer Support) - CS
    IF NOT EXISTS (SELECT 1 FROM dbo.staff WHERE email = 'staff.support@gmail.com')
    BEGIN
        INSERT INTO dbo.staff (email, password_hash, display_name, full_name, phone, avatar_url, status, specialization, department_id, is_deleted)
        VALUES (
            'staff.support@gmail.com', 
            @HashPassword, 
            N'Staff Support', 
            N'Nhân viên Hỗ trợ', 
            '0912000004', 
            'https://ui-avatars.com/api/?name=Staff+Support&background=006b2c&color=fff', 
            'ACTIVE', 
            N'Customer Support', 
            (SELECT department_id FROM dbo.departments WHERE code = 'CS'), 
            0
        );
    END

    -- [5] Staff Phòng Kỹ thuật (IT & Development) - IT
    IF NOT EXISTS (SELECT 1 FROM dbo.staff WHERE email = 'staff.it@gmail.com')
    BEGIN
        INSERT INTO dbo.staff (email, password_hash, display_name, full_name, phone, avatar_url, status, specialization, department_id, is_deleted)
        VALUES (
            'staff.it@gmail.com', 
            @HashPassword, 
            N'Staff IT', 
            N'Nhân viên Kỹ thuật', 
            '0912000005', 
            'https://ui-avatars.com/api/?name=Staff+IT&background=006b2c&color=fff', 
            'ACTIVE', 
            N'IT Support', 
            (SELECT department_id FROM dbo.departments WHERE code = 'IT'), 
            0
        );
    END

    COMMIT TRANSACTION;
    PRINT 'Da seed 5 tai khoan staff thanh cong!';
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
    PRINT 'Co loi xay ra. Da rollback toan bo giao dich.';
    THROW;
END CATCH;
GO
