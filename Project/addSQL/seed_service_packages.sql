-- SQL Script to seed default service packages for Employer
-- Table: service_package_configs

INSERT INTO service_package_configs (package_type, price, post_limit, duration_days, updated_at) 
VALUES 
('REGULAR', 150000, 10, 20, GETDATE()),
('MEDIUM', 300000, 20, 10, GETDATE()),
('PREMIUM', 500000, 50, 30, GETDATE());
