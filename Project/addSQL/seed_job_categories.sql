-- =========================================================================
-- SEED DETAILED JOB CATEGORIES (DANH MỤC CÔNG VIỆC)
-- Project: vLance Freelance Marketplace (CNY)
-- =========================================================================

USE CNY;
GO

BEGIN TRANSACTION;

BEGIN TRY
    -- 1. Xóa dữ liệu cũ (Tùy chọn, nếu muốn reset lại từ đầu)
    -- LƯU Ý: Nếu đã có Project liên kết với Category, việc xóa sẽ bị lỗi khóa ngoại.
    -- Chỉ nên chạy script xóa này nếu db còn trống hoặc chưa có Project nào.
    -- DELETE FROM dbo.job_categories;
    -- DBCC CHECKIDENT ('dbo.job_categories', RESEED, 0);

    -- 2. Chèn các danh mục GỐC (Parent Categories)
    INSERT INTO dbo.job_categories (category_name, description, icon_url, display_order, is_active, created_at, updated_at) VALUES
    (N'Lập trình & Công nghệ', N'Phát triển phần mềm, web, mobile app và hệ thống IT', 'code', 1, 1, GETDATE(), GETDATE()),
    (N'Thiết kế & Đồ họa', N'Thiết kế logo, UI/UX, banner, ấn phẩm truyền thông', 'palette', 2, 1, GETDATE(), GETDATE()),
    (N'Marketing & Bán hàng', N'Digital marketing, SEO, chạy ads, chiến lược bán hàng', 'megaphone', 3, 1, GETDATE(), GETDATE()),
    (N'Viết lách & Dịch thuật', N'Sáng tạo nội dung, copywriting, biên phiên dịch', 'pen-tool', 4, 1, GETDATE(), GETDATE()),
    (N'Video, Ảnh & Âm thanh', N'Chỉnh sửa video, chụp ảnh, sản xuất âm nhạc/podcast', 'video', 5, 1, GETDATE(), GETDATE()),
    (N'Hành chính & Trợ lý ảo', N'Nhập liệu, trợ lý cá nhân, quản lý khách hàng', 'folder-open', 6, 1, GETDATE(), GETDATE()),
    (N'Kế toán & Tư vấn', N'Tư vấn luật, tài chính, thuế, kế toán doanh nghiệp', 'briefcase', 7, 1, GETDATE(), GETDATE());

    -- Lấy ID của các danh mục gốc vừa chèn
    DECLARE @cat_it INT = (SELECT category_id FROM dbo.job_categories WHERE category_name = N'Lập trình & Công nghệ' AND parent_id IS NULL);
    DECLARE @cat_design INT = (SELECT category_id FROM dbo.job_categories WHERE category_name = N'Thiết kế & Đồ họa' AND parent_id IS NULL);
    DECLARE @cat_mkt INT = (SELECT category_id FROM dbo.job_categories WHERE category_name = N'Marketing & Bán hàng' AND parent_id IS NULL);
    DECLARE @cat_write INT = (SELECT category_id FROM dbo.job_categories WHERE category_name = N'Viết lách & Dịch thuật' AND parent_id IS NULL);
    DECLARE @cat_media INT = (SELECT category_id FROM dbo.job_categories WHERE category_name = N'Video, Ảnh & Âm thanh' AND parent_id IS NULL);
    DECLARE @cat_admin INT = (SELECT category_id FROM dbo.job_categories WHERE category_name = N'Hành chính & Trợ lý ảo' AND parent_id IS NULL);
    DECLARE @cat_consult INT = (SELECT category_id FROM dbo.job_categories WHERE category_name = N'Kế toán & Tư vấn' AND parent_id IS NULL);

    -- 3. Chèn các danh mục CON (Sub-categories)
    
    -- Sub-categories cho Lập trình & Công nghệ
    IF @cat_it IS NOT NULL
    BEGIN
        INSERT INTO dbo.job_categories (parent_id, category_name, description, icon_url, display_order, is_active, created_at, updated_at) VALUES
        (@cat_it, N'Phát triển Website', N'Làm web bằng React, Vue, WordPress, PHP, Node.js...', 'globe', 1, 1, GETDATE(), GETDATE()),
        (@cat_it, N'Phát triển Mobile App', N'Làm app iOS, Android bằng Flutter, React Native, Swift...', 'smartphone', 2, 1, GETDATE(), GETDATE()),
        (@cat_it, N'Phát triển Game', N'Làm game Unity, Unreal Engine, game 2D/3D...', 'monitor', 3, 1, GETDATE(), GETDATE()),
        (@cat_it, N'Data Science & AI', N'Machine learning, AI, phân tích dữ liệu, Python...', 'database', 4, 1, GETDATE(), GETDATE()),
        (@cat_it, N'Bảo mật & Quản trị mạng', N'DevOps, AWS, bảo mật hệ thống, cấu hình server...', 'shield', 5, 1, GETDATE(), GETDATE()),
        (@cat_it, N'QA & Testing', N'Kiểm thử phần mềm thủ công và tự động (Automation Test)...', 'check-circle', 6, 1, GETDATE(), GETDATE());
    END

    -- Sub-categories cho Thiết kế & Đồ họa
    IF @cat_design IS NOT NULL
    BEGIN
        INSERT INTO dbo.job_categories (parent_id, category_name, description, icon_url, display_order, is_active, created_at, updated_at) VALUES
        (@cat_design, N'Thiết kế Logo & Bộ nhận diện', N'Logo, danh thiếp, bao bì, nhận diện thương hiệu...', 'image', 1, 1, GETDATE(), GETDATE()),
        (@cat_design, N'Thiết kế UI/UX', N'Thiết kế giao diện Web, App trên Figma, Adobe XD...', 'layout', 2, 1, GETDATE(), GETDATE()),
        (@cat_design, N'Thiết kế Banner & Mạng xã hội', N'Thiết kế ảnh quảng cáo FB, banner shopee, youtube thumbnail...', 'tv', 3, 1, GETDATE(), GETDATE()),
        (@cat_design, N'Thiết kế 3D & Kiến trúc', N'Mô hình 3D, thiết kế nội thất, bản vẽ AutoCAD...', 'box', 4, 1, GETDATE(), GETDATE()),
        (@cat_design, N'Vẽ minh họa & Truyện tranh', N'Vẽ tay, digital art, minh họa sách, NFT...', 'pen-tool', 5, 1, GETDATE(), GETDATE());
    END

    -- Sub-categories cho Marketing & Bán hàng
    IF @cat_mkt IS NOT NULL
    BEGIN
        INSERT INTO dbo.job_categories (parent_id, category_name, description, icon_url, display_order, is_active, created_at, updated_at) VALUES
        (@cat_mkt, N'Quảng cáo Digital (Ads)', N'Chạy Facebook Ads, Google Ads, Tiktok Ads...', 'target', 1, 1, GETDATE(), GETDATE()),
        (@cat_mkt, N'SEO & Tối ưu hóa', N'Tối ưu thứ hạng tìm kiếm Google, nghiên cứu từ khóa...', 'trending-up', 2, 1, GETDATE(), GETDATE()),
        (@cat_mkt, N'Social Media Marketing', N'Quản trị Fanpage, xây kênh Tiktok, Instagram...', 'thumbs-up', 3, 1, GETDATE(), GETDATE()),
        (@cat_mkt, N'Email Marketing', N'Thiết kế newsletter, cấu hình luồng email tự động...', 'mail', 4, 1, GETDATE(), GETDATE());
    END

    -- Sub-categories cho Viết lách & Dịch thuật
    IF @cat_write IS NOT NULL
    BEGIN
        INSERT INTO dbo.job_categories (parent_id, category_name, description, icon_url, display_order, is_active, created_at, updated_at) VALUES
        (@cat_write, N'Viết bài SEO & Blog', N'Viết bài chuẩn SEO, bài đăng blog, website...', 'edit', 1, 1, GETDATE(), GETDATE()),
        (@cat_write, N'Copywriting & PR', N'Viết bài PR, kịch bản bán hàng, landing page...', 'edit-2', 2, 1, GETDATE(), GETDATE()),
        (@cat_write, N'Dịch thuật', N'Dịch văn bản, dịch tài liệu chuyên ngành (Anh, Trung, Nhật...)', 'languages', 3, 1, GETDATE(), GETDATE()),
        (@cat_write, N'Biên tập & Chỉnh sửa', N'Đọc kiểm lỗi, chỉnh sửa nội dung văn bản...', 'file-text', 4, 1, GETDATE(), GETDATE());
    END

    -- Sub-categories cho Video, Ảnh & Âm thanh
    IF @cat_media IS NOT NULL
    BEGIN
        INSERT INTO dbo.job_categories (parent_id, category_name, description, icon_url, display_order, is_active, created_at, updated_at) VALUES
        (@cat_media, N'Chỉnh sửa Video', N'Edit video Tiktok, YouTube, video cưới, sự kiện...', 'film', 1, 1, GETDATE(), GETDATE()),
        (@cat_media, N'Chỉnh sửa Ảnh', N'Retouch ảnh cưới, ảnh thẻ, cắt nền (Photoshop)...', 'camera', 2, 1, GETDATE(), GETDATE()),
        (@cat_media, N'Thu âm & Lồng tiếng', N'Thu âm quảng cáo, lồng tiếng, đọc sách audio...', 'mic', 3, 1, GETDATE(), GETDATE()),
        (@cat_media, N'Hiệu ứng & Hoạt hình', N'Làm intro/outro, motion graphics, video hoạt hình 2D/3D...', 'video', 4, 1, GETDATE(), GETDATE());
    END

    -- Sub-categories cho Hành chính & Trợ lý ảo
    IF @cat_admin IS NOT NULL
    BEGIN
        INSERT INTO dbo.job_categories (parent_id, category_name, description, icon_url, display_order, is_active, created_at, updated_at) VALUES
        (@cat_admin, N'Nhập liệu (Data Entry)', N'Gõ văn bản, nhập liệu Excel, cào dữ liệu web...', 'keyboard', 1, 1, GETDATE(), GETDATE()),
        (@cat_admin, N'Trợ lý ảo (Virtual Assistant)', N'Sắp xếp lịch trình, đặt vé, gọi điện chăm sóc khách...', 'user', 2, 1, GETDATE(), GETDATE()),
        (@cat_admin, N'Chăm sóc khách hàng', N'Trả lời tin nhắn, chat support, trực tổng đài...', 'headphones', 3, 1, GETDATE(), GETDATE());
    END

    -- Sub-categories cho Kế toán & Tư vấn
    IF @cat_consult IS NOT NULL
    BEGIN
        INSERT INTO dbo.job_categories (parent_id, category_name, description, icon_url, display_order, is_active, created_at, updated_at) VALUES
        (@cat_consult, N'Tư vấn Luật', N'Soạn thảo hợp đồng, tư vấn pháp lý doanh nghiệp...', 'briefcase', 1, 1, GETDATE(), GETDATE()),
        (@cat_consult, N'Tư vấn Tài chính', N'Lập kế hoạch tài chính, gọi vốn, phân tích đầu tư...', 'pie-chart', 2, 1, GETDATE(), GETDATE()),
        (@cat_consult, N'Kế toán & Thuế', N'Báo cáo thuế, quyết toán thuế, sổ sách kế toán...', 'book', 3, 1, GETDATE(), GETDATE());
    END

    COMMIT TRANSACTION;
    PRINT 'Da chen du lieu mau cho Danh Muc Cong Viec (Job Categories) thanh cong!';
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
    PRINT 'Co loi xay ra trong qua trinh chen danh muc. Da rollback.';
    THROW;
END CATCH;
GO
