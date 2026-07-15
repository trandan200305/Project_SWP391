USE CNY;
GO

-- Xóa dữ liệu cũ nếu có
DELETE FROM project_skills WHERE project_id IN (6, 7, 8, 9);

-- Gán kỹ năng cho các dự án mẫu
INSERT INTO project_skills (project_id, skill_id) VALUES
(6, 3), -- Project 6 yêu cầu Figma (3)
(6, 4), -- Project 6 yêu cầu Photoshop (4)
(7, 4), -- Project 7 yêu cầu Photoshop (4)
(7, 5), -- Project 7 yêu cầu SEO (5)
(8, 5), -- Project 8 yêu cầu SEO (5)
(9, 0), -- Project 9 yêu cầu ReactJS (0)
(9, 6); -- Project 9 yêu cầu react (6)
GO
