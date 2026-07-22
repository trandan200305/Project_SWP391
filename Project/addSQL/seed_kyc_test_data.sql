-- SQL Script để cập nhật/thêm dữ liệu demo kiểm tra Trạng thái KYC Doanh nghiệp (employers)
USE CNY;
GO

-- 1. Demo Employer 1: Trạng thái BỊ TỪ CHỐI (REJECTED) kèm lý do từ chối
UPDATE employers 
SET kyc_status = 'REJECTED',
    kyc_rejected_reason = N'Ảnh Giấy phép kinh doanh bị mờ, mã số thuế không hợp lệ và thông tin người đại diện không khớp với CCCD. Vui lòng chọn lại file mới.',
    business_license_url = 'sample_gpkd_invalid.pdf',
    representative_id_card_url = 'sample_cccd_invalid.jpg',
    kyc_submitted_at = DATEADD(day, -2, GETDATE()),
    updated_at = GETDATE()
WHERE employer_id = 1;

-- Thêm bản ghi tương ứng vào kyc_requests nếu có
IF OBJECT_ID('dbo.kyc_requests', 'U') IS NOT NULL
BEGIN
    INSERT INTO kyc_requests (employer_id, status, reject_reason, created_at, updated_at)
    VALUES (1, 'REJECTED', N'Ảnh Giấy phép kinh doanh bị mờ, mã số thuế không hợp lệ và thông tin người đại diện không khớp với CCCD. Vui lòng chọn lại file mới.', DATEADD(day, -2, GETDATE()), GETDATE());
END
GO

-- 2. Demo Employer 2 (nếu có): Trạng thái ĐANG CHỜ STAFF DUYỆT (PENDING)
IF EXISTS (SELECT 1 FROM employers WHERE employer_id = 2)
BEGIN
    UPDATE employers
    SET kyc_status = 'PENDING',
        kyc_rejected_reason = NULL,
        business_license_url = 'sample_gpkd_pending.pdf',
        representative_id_card_url = 'sample_cccd_pending.jpg',
        kyc_submitted_at = GETDATE(),
        updated_at = GETDATE()
    WHERE employer_id = 2;
END
GO

-- 3. Demo Employer 3 (nếu có): Trạng thái ĐÃ XÁC THỰC (VERIFIED)
IF EXISTS (SELECT 1 FROM employers WHERE employer_id = 3)
BEGIN
    UPDATE employers
    SET kyc_status = 'VERIFIED',
        kyc_rejected_reason = NULL,
        is_verified = 1,
        business_license_url = 'sample_gpkd_verified.pdf',
        representative_id_card_url = 'sample_cccd_verified.jpg',
        kyc_submitted_at = DATEADD(day, -10, GETDATE()),
        kyc_reviewed_at = DATEADD(day, -9, GETDATE()),
        updated_at = GETDATE()
    WHERE employer_id = 3;
END
GO
