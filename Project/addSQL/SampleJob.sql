-- =========================================================================
-- LANCERPRO (CNY) - SAMPLE DATA SCRIPT
-- Dữ liệu mẫu Nhà tuyển dụng, Lĩnh vực và Công việc để test Phân trang
-- Chạy script này sau khi cấu trúc database CNY đã được tạo
-- =========================================================================

USE CNY;
GO

-- 1. Thêm Nhà tuyển dụng mẫu (Employers)
-- SQL Server UNIQUE constraint treats multiple NULLs as duplicates. 
-- Bổ sung google_id giả để tránh lỗi duplicate NULL.
IF NOT EXISTS (SELECT 1 FROM employers WHERE email = 'employer1@gmail.com')
BEGIN
    INSERT INTO employers (email, password_hash, display_name, full_name, company_name, status, google_id, created_at)
    VALUES ('employer1@gmail.com', 'hash123', 'TechCorp', 'Nguyen Van A', 'TechCorp Vietnam', 'ACTIVE', 'google_emp_1', GETDATE());
END

IF NOT EXISTS (SELECT 1 FROM employers WHERE email = 'employer2@gmail.com')
BEGIN
    INSERT INTO employers (email, password_hash, display_name, full_name, company_name, status, google_id, created_at)
    VALUES ('employer2@gmail.com', 'hash123', 'DesignStudio', 'Tran Thi B', 'Design Studio HN', 'ACTIVE', 'google_emp_2', GETDATE());
END

IF NOT EXISTS (SELECT 1 FROM employers WHERE email = 'employer3@gmail.com')
BEGIN
    INSERT INTO employers (email, password_hash, display_name, full_name, company_name, status, google_id, created_at)
    VALUES ('employer3@gmail.com', 'hash123', 'MarketingPro', 'Le Van C', 'Marketing Pro Agency', 'ACTIVE', 'google_emp_3', GETDATE());
END
GO

-- 2. Thêm Lĩnh vực mẫu (Job Categories)
IF NOT EXISTS (SELECT 1 FROM job_categories WHERE category_name = N'Công nghệ thông tin')
    INSERT INTO job_categories (category_name, description, created_at) VALUES (N'Công nghệ thông tin', N'Phát triển phần mềm, Web, App', GETDATE());

IF NOT EXISTS (SELECT 1 FROM job_categories WHERE category_name = N'Thiết kế đồ họa')
    INSERT INTO job_categories (category_name, description, created_at) VALUES (N'Thiết kế đồ họa', N'Logo, Banner, UI/UX', GETDATE());

IF NOT EXISTS (SELECT 1 FROM job_categories WHERE category_name = N'Marketing')
    INSERT INTO job_categories (category_name, description, created_at) VALUES (N'Marketing', N'SEO, Chạy Ads, Content', GETDATE());
GO

-- 3. Thêm Công việc mẫu (Projects)
DECLARE @emp1 INT = (SELECT TOP 1 employer_id FROM employers WHERE email = 'employer1@gmail.com');
DECLARE @emp2 INT = (SELECT TOP 1 employer_id FROM employers WHERE email = 'employer2@gmail.com');
DECLARE @emp3 INT = (SELECT TOP 1 employer_id FROM employers WHERE email = 'employer3@gmail.com');

DECLARE @cat1 INT = (SELECT TOP 1 category_id FROM job_categories WHERE category_name = N'Công nghệ thông tin');
DECLARE @cat2 INT = (SELECT TOP 1 category_id FROM job_categories WHERE category_name = N'Thiết kế đồ họa');
DECLARE @cat3 INT = (SELECT TOP 1 category_id FROM job_categories WHERE category_name = N'Marketing');

-- Chỉ thêm dữ liệu mẫu nếu lấy được ID thành công
IF @emp1 IS NOT NULL AND @emp2 IS NOT NULL AND @emp3 IS NOT NULL 
   AND @cat1 IS NOT NULL AND @cat2 IS NOT NULL AND @cat3 IS NOT NULL
BEGIN
    INSERT INTO projects (client_id, category_id, title, description, project_type, budget_min, budget_max, deadline, posting_expires, status, proposal_count, created_at)
    VALUES
    -- IT Jobs
    (@emp1, @cat1, N'Lập trình website bán hàng bằng ReactJS và Node.js', N'Cần tìm một lập trình viên Fullstack để xây dựng website bán hàng. Yêu cầu có kinh nghiệm làm việc với ReactJS, Node.js, MongoDB. Website có chức năng giỏ hàng, thanh toán online và quản lý đơn hàng. Chi tiết sẽ trao đổi sau. Yêu cầu code sạch, có comment rõ ràng và bàn giao full source code.', 'PROJECT', 5000000, 15000000, '2026-12-31', '2026-11-30', 'PUBLISHED', 5, GETDATE()),
    (@emp1, @cat1, N'Viết ứng dụng di động quản lý chi tiêu (Flutter)', N'Dự án ngắn hạn. Cần xây dựng một app quản lý chi tiêu cá nhân cơ bản bằng Flutter. Chạy được trên cả iOS và Android. Có chức năng thêm chi tiêu, thu nhập, xem biểu đồ báo cáo và nhắc nhở hàng ngày.', 'PROJECT', 3000000, 8000000, '2026-10-15', '2026-09-15', 'PUBLISHED', 12, GETDATE()),
    (@emp1, @cat1, N'Tối ưu hóa cơ sở dữ liệu SQL Server', N'Hệ thống hiện tại đang bị chậm, cần người am hiểu SQL Server để review lại schema, tối ưu hóa các câu query và đánh index. Cần viết báo cáo chi tiết về các thay đổi.', 'PROJECT', 2000000, 5000000, '2026-08-01', '2026-07-01', 'PUBLISHED', 2, DATEADD(day, -5, GETDATE())),

    -- Design Jobs
    (@emp2, @cat2, N'Thiết kế logo và bộ nhận diện thương hiệu cho quán cafe', N'Quán cafe mới mở theo phong cách vintage, cần thiết kế 1 logo, menu, và danh thiếp. Ưu tiên có kinh nghiệm làm F&B. Phải có ít nhất 3 bản demo logo để chọn.', 'PROJECT', 1000000, 3000000, '2026-09-01', '2026-08-01', 'PUBLISHED', 8, GETDATE()),
    (@emp2, @cat2, N'Thiết kế UI/UX cho ứng dụng giao hàng', N'Cần thiết kế khoảng 15 màn hình cho app giao đồ ăn (tương tự ShopeeFood). Phong cách trẻ trung, năng động. Giao file trên Figma.', 'PROJECT', 8000000, 20000000, '2026-11-20', '2026-10-20', 'PUBLISHED', 15, DATEADD(day, -10, GETDATE())),
    (@emp2, @cat2, N'Làm banner quảng cáo Facebook', N'Cần 5 banner quảng cáo cho chiến dịch Back-to-school. Yêu cầu sáng tạo và bắt mắt.', 'PROJECT', 500000, 1500000, '2026-07-25', '2026-07-20', 'PUBLISHED', 3, GETDATE()),

    -- Marketing Jobs
    (@emp3, @cat3, N'Chạy chiến dịch Google Ads cho khóa học tiếng Anh', N'Ngân sách chạy 20 triệu. Yêu cầu tối ưu hóa CPC và tăng tỷ lệ chuyển đổi form đăng ký. Yêu cầu báo cáo hàng tuần.', 'PROJECT', 2000000, 6000000, '2026-08-30', '2026-08-15', 'PUBLISHED', 4, GETDATE()),
    (@emp3, @cat3, N'Viết 20 bài chuẩn SEO về chủ đề du lịch', N'Các bài viết cần dài 1000 - 1500 chữ, unique 100%, có hình ảnh minh họa. Không dùng AI để tạo nội dung.', 'PROJECT', 1000000, 2500000, '2026-09-15', '2026-09-01', 'PUBLISHED', 20, DATEADD(day, -2, GETDATE())),
    (@emp3, @cat3, N'Quản lý Fanpage Tiktok 1 tháng', N'Đăng 3 video/tuần, lên kịch bản và theo dõi tương tác. Phân tích insight và điều chỉnh kịch bản theo tuần.', 'PROJECT', 3000000, 5000000, '2026-10-30', '2026-09-30', 'PUBLISHED', 7, GETDATE()),

    -- More Jobs for pagination testing
    (@emp1, @cat1, N'Xây dựng API với Spring Boot', N'Cần làm 10 endpoints cho ứng dụng quản lý kho. Sử dụng Clean Architecture.', 'PROJECT', 2000000, 4000000, '2026-08-10', '2026-08-01', 'PUBLISHED', 1, GETDATE()),
    (@emp2, @cat2, N'Vẽ minh họa sách thiếu nhi', N'Sách 20 trang, chủ đề động vật. Hình ảnh ngộ nghĩnh, màu sắc tươi sáng.', 'PROJECT', 5000000, 10000000, '2026-12-01', '2026-11-01', 'PUBLISHED', 9, GETDATE()),
    (@emp3, @cat3, N'Tư vấn chiến lược Marketing 2027', N'Lên kế hoạch tổng thể cho công ty start-up. Tư vấn kênh truyền thông phù hợp.', 'PROJECT', 10000000, 30000000, '2026-11-15', '2026-10-15', 'PUBLISHED', 2, DATEADD(day, -1, GETDATE()));
END
GO
