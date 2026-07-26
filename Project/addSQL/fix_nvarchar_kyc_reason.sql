-- SQL Script sửa lỗi font chữ Tiếng Việt (?) cho cột kyc_rejected_reason trong SQL Server
USE CNY;
GO

-- 1. Chuyển kiểu dữ liệu cột kyc_rejected_reason sang NVARCHAR(500) để hỗ trợ Tiếng Việt Unicode
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('employers') AND name = 'kyc_rejected_reason')
BEGIN
    ALTER TABLE employers ALTER COLUMN kyc_rejected_reason NVARCHAR(500);
END
GO

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('freelancers') AND name = 'kyc_rejected_reason')
BEGIN
    ALTER TABLE freelancers ALTER COLUMN kyc_rejected_reason NVARCHAR(500);
END
GO

IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'kyc_requests')
BEGIN
    ALTER TABLE kyc_requests ALTER COLUMN reject_reason NVARCHAR(500);
END
GO

-- 2. Cập nhật lại chuỗi Tiếng Việt chuẩn có tiền tố N'' (Lưu ý: BẮT BUỘC phải có chữ N trước dấu ngoặc đơn '')
UPDATE employers
SET kyc_rejected_reason = N'Ảnh Giấy phép kinh doanh bị mờ và không đúng thông tin. Vui lòng tải lại bản quét rõ nét.'
WHERE kyc_status = 'REJECTED';
GO
