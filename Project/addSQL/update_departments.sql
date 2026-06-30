-- =========================================================================
-- UPDATE DEPARTMENTS TO THE NEW 4 DESIGNATED DEPARTMENTS
-- Project: vLance Freelance Marketplace (CNY)
-- =========================================================================

USE CNY;
GO

BEGIN TRANSACTION;

BEGIN TRY
    -- 1. Gỡ liên kết phòng ban của Manager và Staff hiện tại (tránh lỗi khóa ngoại)
    UPDATE dbo.managers SET department_id = NULL;
    UPDATE dbo.staff SET department_id = NULL;

    -- 2. Xóa dữ liệu các bảng nhật ký/giao dịch/lịch sử liên quan đến phòng ban cũ
    DELETE FROM dbo.department_activity_logs;
    DELETE FROM dbo.department_sessions;
    DELETE FROM dbo.department_transfer_history;
    DELETE FROM dbo.department_task_signoffs;
    DELETE FROM dbo.department_verification_tasks;

    -- 3. Xóa toàn bộ phòng ban cũ
    DELETE FROM dbo.departments;

    -- 4. Reset cột ID tự tăng (IDENTITY) của bảng departments về lại từ đầu (bắt đầu từ 1)
    DBCC CHECKIDENT ('dbo.departments', RESEED, 0);

    -- 5. Thêm mới 4 phòng ban theo giao diện yêu cầu
    INSERT INTO dbo.departments (name, code, description, max_managers) VALUES
        (N'Phòng Tài chính (Finance)', 'FIN', N'Quản lý rút tiền, hoàn tiền, escrow, giao dịch tài chính', 5),
        (N'Phòng Tranh chấp (Dispute Resolution)', 'DIS', N'Xử lý tranh chấp, phân xử hợp đồng giữa các bên', 5),
        (N'Phòng Hỗ trợ (Customer Support)', 'CS', N'Support tickets, hỗ trợ và chăm sóc người dùng', 5),
        (N'Phòng Kỹ thuật (IT & Development)', 'IT', N'Bảo trì hệ thống, cấu hình, CMS, SEO, vận hành kỹ thuật', 5);

    COMMIT TRANSACTION;
    PRINT 'Da cap nhat danh sach phong ban moi thanh cong.';
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
    PRINT 'Co loi xay ra. Da rollback toan bo giao dich.';
    THROW;
END CATCH;
GO
