-- 1. CREATE GIGS TABLE IF NOT EXISTS
IF OBJECT_ID('dbo.gigs', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.gigs (
        gig_id INT PRIMARY KEY IDENTITY(1,1),
        freelancer_id INT NOT NULL REFERENCES freelancers(freelancer_id),
        title NVARCHAR(255) NOT NULL,
        description NVARCHAR(MAX) NOT NULL,
        price DECIMAL(18,2) NOT NULL,
        status NVARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETDATE()
    );
    PRINT 'Created gigs table successfully.';
END
ELSE
BEGIN
    PRINT 'Gigs table already exists.';
END
GO

-- 2. SEED PENDING GIGS
DELETE FROM dbo.gigs;
GO

DECLARE @fl_id INT;
SELECT TOP 1 @fl_id = freelancer_id FROM freelancers WHERE status = 'ACTIVE';

IF @fl_id IS NOT NULL
BEGIN
    INSERT INTO dbo.gigs (freelancer_id, title, description, price, status, created_at, updated_at)
    VALUES 
    (@fl_id, N'Thiết kế Logo Doanh nghiệp trọn gói', N'Gói dịch vụ thiết kế logo chuyên nghiệp bao gồm 3 phương án thiết kế và chỉnh sửa không giới hạn.', 2000000.00, 'PENDING', DATEADD(hour, -1, GETDATE()), GETDATE()),
    (@fl_id, N'Lập trình Web App ReactJS/NodeJS', N'Xây dựng ứng dụng web hiện đại với ReactJS và NodeJS, tối ưu hiệu năng.', 15000000.00, 'APPROVED', DATEADD(day, -1, GETDATE()), GETDATE());
    PRINT 'Seeded gigs table.';
END
ELSE
BEGIN
    PRINT 'No active freelancer found to link to gigs.';
END
GO

-- 3. SEED REPORTED REVIEW INTO VIOLATION REPORTS
DELETE FROM dbo.violation_reports WHERE target_type = 'REVIEW';
GO

INSERT INTO dbo.violation_reports (target_type, target_id, reporter_name, accused_name, severity, status, reason, evidence, created_at, updated_at)
VALUES 
('REVIEW', 'REV-999', N'Client John', N'Freelancer Alex', 'MEDIUM', 'PENDING', N'Đánh giá chứa từ ngữ không phù hợp, xúc phạm cá nhân và bôi nhọ uy tín', 'https://example.com/evidence/rev-999.png', DATEADD(hour, -2, GETDATE()), GETDATE());
PRINT 'Seeded reported review into violation_reports.';
GO
