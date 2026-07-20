package com.cny.backend.config;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class DatabaseMigrationRunner {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @PostConstruct
    public void runMigrations() {
        try {
            // Thêm cột source_email vào bảng admin_audit_logs nếu chưa có
            jdbcTemplate.execute("ALTER TABLE admin_audit_logs ADD source_email VARCHAR(255) NULL;");
            System.out.println("==================================================");
            System.out.println("SUCCESS: Đã tự động thêm cột 'source_email' vào Database!");
            System.out.println("==================================================");
        } catch (Exception e) {
            // Nếu cột đã tồn tại hoặc có lỗi khác thì bỏ qua
            System.out.println("==================================================");
            System.out.println("INFO: Cột 'source_email' đã tồn tại hoặc bỏ qua migration.");
            System.out.println("==================================================");
        }

        try {
            String defaultPassword = passwordEncoder.encode("123456");

            // Cập nhật lại toàn bộ mật khẩu của các tài khoản test về 123456 để đảm bảo khớp mã hóa BCrypt
            jdbcTemplate.update("UPDATE employers SET password_hash = ? WHERE email = 'employer@lancerpro.com'", defaultPassword);
            jdbcTemplate.update("UPDATE freelancers SET password_hash = ? WHERE email = 'freelancer@lancerpro.com'", defaultPassword);
            jdbcTemplate.update("UPDATE managers SET password_hash = ? WHERE email = 'manager@lancerpro.com' OR email LIKE 'manager.%'", defaultPassword);
            jdbcTemplate.update("UPDATE staff SET password_hash = ? WHERE email = 'staff@lancerpro.com' OR email LIKE 'staff%' OR email = 'staff@gmail.com'", defaultPassword);

            // Seed Employer
            int empCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM employers WHERE email = 'employer@lancerpro.com'", Integer.class);
            if (empCount == 0) {
                jdbcTemplate.update("INSERT INTO employers (email, google_id, password_hash, display_name, full_name, status, is_verified, is_deleted, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, GETDATE(), GETDATE())", 
                    "employer@lancerpro.com", "g_emp_test", defaultPassword, "Employer", "Test Employer", "ACTIVE", 1, 0);
            }

            // Seed Freelancer
            int freeCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM freelancers WHERE email = 'freelancer@lancerpro.com'", Integer.class);
            if (freeCount == 0) {
                jdbcTemplate.update("INSERT INTO freelancers (email, google_id, password_hash, display_name, full_name, status, is_verified, is_deleted, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, GETDATE(), GETDATE())",
                    "freelancer@lancerpro.com", "g_free_test", defaultPassword, "Freelancer", "Test Freelancer", "ACTIVE", 1, 0);
            }

            // Seed Manager
            int mgrCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM managers WHERE email = 'manager@lancerpro.com'", Integer.class);
            if (mgrCount == 0) {
                jdbcTemplate.update("INSERT INTO managers (email, password_hash, display_name, full_name, status, is_deleted, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, GETDATE(), GETDATE())",
                    "manager@lancerpro.com", defaultPassword, "Manager", "Test Manager", "ACTIVE", 0);
            }

            // Seed Staff
            int staffCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM staff WHERE email = 'staff@lancerpro.com'", Integer.class);
            if (staffCount == 0) {
                jdbcTemplate.update("INSERT INTO staff (email, password_hash, display_name, full_name, status, is_deleted, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, GETDATE(), GETDATE())",
                    "staff@lancerpro.com", defaultPassword, "Staff", "Test Staff", "ACTIVE", 0);
            }

            System.out.println("SUCCESS: Đã khởi tạo các tài khoản test thành công!");
        } catch (Exception e) {
            System.err.println("Lỗi khởi tạo tài khoản test: " + e.getMessage());
        }
    }
}
