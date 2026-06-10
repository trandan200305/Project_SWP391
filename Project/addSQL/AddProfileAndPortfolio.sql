-- =========================================================================
-- Cập nhật cấu trúc DB cho tính năng Hồ sơ cá nhân (Freelancer Profile)
-- Chạy đoạn script này để thêm bảng và các cột thiếu thay vì sửa file CNY.sql gốc
-- =========================================================================

USE CNY;
GO

-- 1. Bổ sung các trường còn thiếu cho "Hồ sơ làm việc"
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'freelancer_profiles' AND COLUMN_NAME = 'personal_website')
    ALTER TABLE freelancer_profiles ADD personal_website VARCHAR(255);
GO

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'freelancer_profiles' AND COLUMN_NAME = 'expertise_field')
    ALTER TABLE freelancer_profiles ADD expertise_field NVARCHAR(255);
GO

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'freelancer_profiles' AND COLUMN_NAME = 'experience_level')
    ALTER TABLE freelancer_profiles ADD experience_level VARCHAR(50);
GO

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'freelancer_profiles' AND COLUMN_NAME = 'primary_skills')
    ALTER TABLE freelancer_profiles ADD primary_skills NVARCHAR(MAX);
GO

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'freelancer_profiles' AND COLUMN_NAME = 'services_offered')
    ALTER TABLE freelancer_profiles ADD services_offered NVARCHAR(MAX);
GO

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'freelancer_profiles' AND COLUMN_NAME = 'availability_type')
    ALTER TABLE freelancer_profiles ADD availability_type VARCHAR(50);
GO

-- 2. Tạo bảng mới cho "Hồ sơ năng lực" (Portfolio)
IF OBJECT_ID('dbo.freelancer_portfolios', 'U') IS NULL
BEGIN
    CREATE TABLE freelancer_portfolios (
        portfolio_id INT IDENTITY(1,1) PRIMARY KEY,
        freelancer_id INT NOT NULL,
        title NVARCHAR(255) NOT NULL,
        attachment_url VARCHAR(500),
        description NVARCHAR(MAX),
        related_service NVARCHAR(255),
        product_link VARCHAR(500),
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_Freelancer_Portfolio FOREIGN KEY (freelancer_id) REFERENCES freelancers(freelancer_id) ON DELETE CASCADE
    );
END
GO
