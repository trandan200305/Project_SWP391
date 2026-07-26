-- 1. Update existing freelancers with titles & bios
UPDATE freelancers 
SET professional_title = N'Lập trình viên React & Node.js', 
    bio = N'Chuyên viên phát triển Web Front-end với 3 năm kinh nghiệm.'
WHERE freelancer_id = 1;

UPDATE freelancers 
SET professional_title = N'Chuyên gia Fullstack Java & React', 
    bio = N'Lập trình viên Fullstack 4 năm kinh nghiệm làm việc với Spring Boot và ReactJS.'
WHERE freelancer_id = 2;

-- 2. Add 3rd Freelancer if not exists
IF NOT EXISTS (SELECT 1 FROM freelancers WHERE email = 'nam.tran@lancerpro.com')
BEGIN
    INSERT INTO freelancers (
        email, password_hash, display_name, full_name, phone, status, 
        email_verified, is_verified, professional_title, bio, hourly_rate, created_at, updated_at
    ) VALUES (
        'nam.tran@lancerpro.com', '$2a$10$abcdefghijklmnopqrstuvwxyz123456', N'Nam Tran', N'Trần Hoàng Nam', '0912345678', 'ACTIVE', 
        1, 1, N'Senior Fullstack Web Developer', N'5 năm kinh nghiệm thiết kế kiến trúc hệ thống và phát triển Web App.', 250000.00, GETDATE(), GETDATE()
    );
END

DECLARE @freelancer3Id INT;
SELECT @freelancer3Id = freelancer_id FROM freelancers WHERE email = 'nam.tran@lancerpro.com';

-- 3. Clear any existing proposals for projects 6 & 7 to avoid duplicate entries
DELETE FROM proposals WHERE project_id IN (6, 7);

-- 4. Insert 2 proposals for Project ID 6
INSERT INTO proposals (
    project_id, freelancer_id, bid_amount, estimated_days, cover_letter, status, created_at, updated_at
) VALUES 
(
    6, 1, 4500000.00, 5, 
    N'Chào anh/chị Nhà tuyển dụng, em đã có 3 năm kinh nghiệm lập trình React.js và Spring Boot. Em có thể hoàn thành dự án đúng hạn với chất lượng cam kết tốt nhất. Rất mong có cơ hội được hợp tác!', 
    'SUBMITTED', GETDATE(), GETDATE()
),
(
    6, 2, 5000000.00, 7, 
    N'Chào bạn, mình xem mô tả dự án và thấy rất phù hợp với kỹ năng của mình. Mình đã làm nhiều dự án tương tự và cam kết bảo hành sản phẩm 30 ngày sau khi bàn giao.', 
    'SUBMITTED', GETDATE(), GETDATE()
);

-- 5. Insert 2 proposals for Project ID 7
INSERT INTO proposals (
    project_id, freelancer_id, bid_amount, estimated_days, cover_letter, status, created_at, updated_at
) VALUES 
(
    7, 2, 3800000.00, 4, 
    N'Tôi rất quan tâm đến dự án này. Tôi đã từng triển khai nhiều hệ thống tương tự và sẵn sàng demo sản phẩm mẫu.', 
    'SUBMITTED', GETDATE(), GETDATE()
),
(
    7, @freelancer3Id, 4200000.00, 6, 
    N'Chào anh/chị, tôi là Nam - Fullstack Developer 5 năm kinh nghiệm. Tôi có thể bắt đầu làm việc ngay lập tức và hoàn thành các tính năng theo đúng yêu cầu đề ra.', 
    'SUBMITTED', GETDATE(), GETDATE()
);

-- 6. Update proposal_count in projects table
UPDATE projects SET proposal_count = 2 WHERE project_id IN (6, 7);
