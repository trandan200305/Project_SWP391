package com.cny.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AuthService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Transactional
    public Map<String, Object> login(Map<String, String> payload) {
        String email = payload.get("email");
        String name = payload.get("name");
        String googleId = payload.get("googleId");
        String avatar = payload.get("avatar");
        String requestedRole = payload.get("requestedRole"); // FREELANCER or EMPLOYER

        Map<String, Object> response = new HashMap<>();

        if (email == null || email.trim().isEmpty()) {
            response.put("success", false);
            response.put("message", "Email is required");
            return response;
        }

        if (googleId == null || googleId.trim().isEmpty()) {
            googleId = "EMAIL_" + email;
        }

        // Danh sách các Email được thiết lập làm quyền Admin tối cao
        boolean isSpecialAdmin = "admin@lancerpro.com".equalsIgnoreCase(email) || 
                                 "illyasviel1252004@gmail.com".equalsIgnoreCase(email);
                                 
        if (isSpecialAdmin) {
            requestedRole = "ADMIN";
        } else if (requestedRole == null) {
            requestedRole = "FREELANCER";
        } else {
            requestedRole = requestedRole.toUpperCase();
        }

        int userId = -1;
        String assignedRole = requestedRole;
        String userStatus = "ACTIVE";

        if ("ADMIN".equals(assignedRole)) {
            // 1. Phân quyền ADMIN: Tra cứu trực tiếp trong bảng admins
            List<Map<String, Object>> existingAdmins = jdbcTemplate.queryForList(
                "SELECT * FROM admins WHERE email = ?", email
            );

            if (existingAdmins.isEmpty()) {
                // Đăng ký Admin lần đầu
                jdbcTemplate.update(
                    "INSERT INTO admins (email, password_hash, display_name, full_name, avatar_url, status, email_verified, google_id, admin_level, created_at, updated_at, is_deleted) " +
                    "VALUES (?, ?, ?, ?, ?, 'ACTIVE', 1, ?, 'SUPER_ADMIN', GETDATE(), GETDATE(), 0)",
                    email, "OAUTH_GOOGLE_LOGGED", name, name, avatar, googleId
                );
                userId = jdbcTemplate.queryForObject("SELECT IDENT_CURRENT('admins')", Integer.class);
            } else {
                Map<String, Object> dbAdmin = existingAdmins.get(0);
                userId = (Integer) dbAdmin.get("admin_id");
                userStatus = (String) dbAdmin.get("status");
                
                if (googleId != null && dbAdmin.get("google_id") == null) {
                    jdbcTemplate.update("UPDATE admins SET google_id = ?, avatar_url = ? WHERE admin_id = ?", googleId, avatar, userId);
                }
            }
        } 
        else if ("EMPLOYER".equals(assignedRole) || "CLIENT".equals(assignedRole)) {
            // 2. Phân quyền EMPLOYER: Tra cứu trực tiếp trong bảng employers
            List<Map<String, Object>> existingEmployers = jdbcTemplate.queryForList(
                "SELECT * FROM employers WHERE email = ?", email
            );

            if (existingEmployers.isEmpty()) {
                // Đăng ký Employer lần đầu
                jdbcTemplate.update(
                    "INSERT INTO employers (email, password_hash, display_name, full_name, avatar_url, status, email_verified, google_id, created_at, updated_at, profile_completeness, total_spent, projects_posted, average_rating, is_deleted) " +
                    "VALUES (?, ?, ?, ?, ?, 'ACTIVE', 1, ?, GETDATE(), GETDATE(), 100, 0, 0, 5.0, 0)",
                    email, "OAUTH_GOOGLE_LOGGED", name, name, avatar, googleId
                );
                userId = jdbcTemplate.queryForObject("SELECT IDENT_CURRENT('employers')", Integer.class);
            } else {
                Map<String, Object> dbEmployer = existingEmployers.get(0);
                userId = (Integer) dbEmployer.get("employer_id");
                userStatus = (String) dbEmployer.get("status");
                
                if (googleId != null && dbEmployer.get("google_id") == null) {
                    jdbcTemplate.update("UPDATE employers SET google_id = ?, avatar_url = ? WHERE employer_id = ?", googleId, avatar, userId);
                }
            }
        } 
        else {
            // 3. Phân quyền FREELANCER: Tra cứu trực tiếp trong bảng freelancers
            List<Map<String, Object>> existingFreelancers = jdbcTemplate.queryForList(
                "SELECT * FROM freelancers WHERE email = ?", email
            );

            if (existingFreelancers.isEmpty()) {
                // Đăng ký Freelancer lần đầu
                jdbcTemplate.update(
                    "INSERT INTO freelancers (email, password_hash, display_name, full_name, avatar_url, status, email_verified, google_id, created_at, updated_at, profile_completeness, total_earnings, projects_completed, average_rating, is_available, is_deleted) " +
                    "VALUES (?, ?, ?, ?, ?, 'ACTIVE', 1, ?, GETDATE(), GETDATE(), 95, 0, 0, 5.0, 1, 0)",
                    email, "OAUTH_GOOGLE_LOGGED", name, name, avatar, googleId
                );
                userId = jdbcTemplate.queryForObject("SELECT IDENT_CURRENT('freelancers')", Integer.class);
            } else {
                Map<String, Object> dbFreelancer = existingFreelancers.get(0);
                userId = (Integer) dbFreelancer.get("freelancer_id");
                userStatus = (String) dbFreelancer.get("status");
                
                if (googleId != null && dbFreelancer.get("google_id") == null) {
                    jdbcTemplate.update("UPDATE freelancers SET google_id = ?, avatar_url = ? WHERE freelancer_id = ?", googleId, avatar, userId);
                }
            }
        }

        // CHẶN ĐĂNG NHẬP NẾU TÀI KHOẢN BỊ KHÓA/BANNED
        if ("LOCKED".equals(userStatus) || "BANNED".equals(userStatus)) {
            String notifMessage = "LOCKED".equals(userStatus) 
                ? "Tài khoản của bạn đã bị tạm khóa. Liên hệ support@vlance.vn để được hỗ trợ."
                : "Tài khoản của bạn đã bị cấm vĩnh viễn do vi phạm chính sách.";

            response.put("success", false);
            response.put("accountStatus", userStatus);
            response.put("message", notifMessage);
            return response;
        }

        // Cập nhật lịch sử đăng nhập & thời điểm đăng nhập cuối cùng vào bảng chuyên biệt
        if ("ADMIN".equals(assignedRole)) {
            jdbcTemplate.update("INSERT INTO login_history (admin_id, login_at, success) VALUES (?, GETDATE(), 1)", userId);
            jdbcTemplate.update("UPDATE admins SET last_login_at = GETDATE() WHERE admin_id = ?", userId);
        } else if ("EMPLOYER".equals(assignedRole) || "CLIENT".equals(assignedRole)) {
            jdbcTemplate.update("INSERT INTO login_history (employer_id, login_at, success) VALUES (?, GETDATE(), 1)", userId);
            jdbcTemplate.update("UPDATE employers SET last_login_at = GETDATE() WHERE employer_id = ?", userId);
        } else {
            jdbcTemplate.update("INSERT INTO login_history (freelancer_id, login_at, success) VALUES (?, GETDATE(), 1)", userId);
            jdbcTemplate.update("UPDATE freelancers SET last_login_at = GETDATE() WHERE freelancer_id = ?", userId);
        }

        response.put("success", true);
        response.put("user", Map.of(
            "id", userId,
            "email", email,
            "name", name,
            "role", assignedRole,
            "avatar", avatar != null ? avatar : "https://ui-avatars.com/api/?name=" + name
        ));
        return response;
    }
}
