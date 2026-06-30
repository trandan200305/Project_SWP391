USE CNY;
GO

BEGIN TRY
    BEGIN TRANSACTION;

    IF NOT EXISTS (SELECT 1 FROM departments WHERE code = 'FIN')
        INSERT INTO departments (code, name, description, max_managers, created_at, updated_at)
        VALUES ('FIN', N'Phòng Tài chính (Finance)', N'Quản lý rút tiền, hoàn tiền, escrow, giao dịch | Liên kết với: DIS, MOD', 5, GETDATE(), GETDATE());

    IF NOT EXISTS (SELECT 1 FROM departments WHERE code = 'MOD')
        INSERT INTO departments (code, name, description, max_managers, created_at, updated_at)
        VALUES ('MOD', N'Phòng Kiểm duyệt (Moderation)', N'Duyệt dự án, kiểm duyệt nội dung, KYC | Liên kết với: FIN, CS', 5, GETDATE(), GETDATE());

    IF NOT EXISTS (SELECT 1 FROM departments WHERE code = 'DIS')
        INSERT INTO departments (code, name, description, max_managers, created_at, updated_at)
        VALUES ('DIS', N'Phòng Tranh chấp (Dispute Resolution)', N'Xử lý tranh chấp, phân xử hợp đồng | Liên kết với: FIN, MOD', 5, GETDATE(), GETDATE());

    IF NOT EXISTS (SELECT 1 FROM departments WHERE code = 'CS')
        INSERT INTO departments (code, name, description, max_managers, created_at, updated_at)
        VALUES ('CS', N'Phòng Hỗ trợ (Customer Support)', N'Support tickets, hỗ trợ người dùng | Liên kết với: MOD, IT', 5, GETDATE(), GETDATE());

    IF NOT EXISTS (SELECT 1 FROM departments WHERE code = 'IT')
        INSERT INTO departments (code, name, description, max_managers, created_at, updated_at)
        VALUES ('IT', N'Phòng Kỹ thuật (IT & Development)', N'Bảo trì hệ thống, cấu hình, SEO, CMS | Liên kết với: CS, MOD', 5, GETDATE(), GETDATE());

    UPDATE departments
    SET name = CASE code
            WHEN 'FIN' THEN N'Phòng Tài chính (Finance)'
            WHEN 'MOD' THEN N'Phòng Kiểm duyệt (Moderation)'
            WHEN 'DIS' THEN N'Phòng Tranh chấp (Dispute Resolution)'
            WHEN 'CS' THEN N'Phòng Hỗ trợ (Customer Support)'
            WHEN 'IT' THEN N'Phòng Kỹ thuật (IT & Development)'
        END,
        description = CASE code
            WHEN 'FIN' THEN N'Quản lý rút tiền, hoàn tiền, escrow, giao dịch | Liên kết với: DIS, MOD'
            WHEN 'MOD' THEN N'Duyệt dự án, kiểm duyệt nội dung, KYC | Liên kết với: FIN, CS'
            WHEN 'DIS' THEN N'Xử lý tranh chấp, phân xử hợp đồng | Liên kết với: FIN, MOD'
            WHEN 'CS' THEN N'Support tickets, hỗ trợ người dùng | Liên kết với: MOD, IT'
            WHEN 'IT' THEN N'Bảo trì hệ thống, cấu hình, SEO, CMS | Liên kết với: CS, MOD'
        END,
        updated_at = GETDATE()
    WHERE code IN ('FIN', 'MOD', 'DIS', 'CS', 'IT');

    DECLARE @CS INT = (SELECT department_id FROM departments WHERE code = 'CS');
    DECLARE @MOD INT = (SELECT department_id FROM departments WHERE code = 'MOD');

    UPDATE m
    SET department_id = CASE d.code WHEN 'AUD' THEN @MOD ELSE @CS END,
        department = CASE d.code
            WHEN 'AUD' THEN (SELECT name FROM departments WHERE code = 'MOD')
            ELSE (SELECT name FROM departments WHERE code = 'CS')
        END,
        updated_at = GETDATE()
    FROM managers m
    JOIN departments d ON m.department_id = d.department_id
    WHERE d.code IN ('AUD', 'MKT', 'GEN');

    UPDATE s
    SET department_id = CASE d.code WHEN 'AUD' THEN @MOD ELSE @CS END,
        updated_at = GETDATE()
    FROM staff s
    JOIN departments d ON s.department_id = d.department_id
    WHERE d.code IN ('AUD', 'MKT', 'GEN');

    UPDATE ds
    SET department_id = CASE d.code WHEN 'AUD' THEN @MOD ELSE @CS END
    FROM department_sessions ds
    JOIN departments d ON ds.department_id = d.department_id
    WHERE d.code IN ('AUD', 'MKT', 'GEN');

    UPDATE dal
    SET department_id = CASE d.code WHEN 'AUD' THEN @MOD ELSE @CS END
    FROM department_activity_logs dal
    JOIN departments d ON dal.department_id = d.department_id
    WHERE d.code IN ('AUD', 'MKT', 'GEN');

    UPDATE h
    SET from_department_id = CASE d.code WHEN 'AUD' THEN @MOD ELSE @CS END
    FROM department_transfer_history h
    JOIN departments d ON h.from_department_id = d.department_id
    WHERE d.code IN ('AUD', 'MKT', 'GEN');

    UPDATE h
    SET to_department_id = CASE d.code WHEN 'AUD' THEN @MOD ELSE @CS END
    FROM department_transfer_history h
    JOIN departments d ON h.to_department_id = d.department_id
    WHERE d.code IN ('AUD', 'MKT', 'GEN');

    UPDATE department_task_signoffs
    SET department_code = CASE department_code
        WHEN 'AUD' THEN 'MOD'
        WHEN 'MKT' THEN 'CS'
        WHEN 'GEN' THEN 'CS'
        ELSE department_code
    END
    WHERE department_code IN ('AUD', 'MKT', 'GEN');

    UPDATE department_verification_tasks
    SET required_departments = REPLACE(REPLACE(REPLACE(required_departments, 'AUD', 'MOD'), 'MKT', 'CS'), 'GEN', 'CS')
    WHERE required_departments LIKE '%AUD%'
       OR required_departments LIKE '%MKT%'
       OR required_departments LIKE '%GEN%';

    UPDATE department_verification_tasks
    SET required_departments = REPLACE(REPLACE(REPLACE(required_departments, 'MOD,MOD', 'MOD'), 'CS,CS', 'CS'), 'MOD,FIN', 'FIN,MOD')
    WHERE required_departments LIKE '%MOD,MOD%'
       OR required_departments LIKE '%CS,CS%'
       OR required_departments LIKE '%MOD,FIN%';

    DELETE FROM departments
    WHERE code IN ('AUD', 'MKT', 'GEN');

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;

    THROW;
END CATCH;
GO

SELECT department_id, code, name
FROM departments
ORDER BY department_id;
GO
