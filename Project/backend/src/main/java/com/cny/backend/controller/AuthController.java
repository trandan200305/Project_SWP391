package com.cny.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String name = payload.get("name");
        String googleId = payload.get("googleId");
        String avatar = payload.get("avatar");
        String requestedRole = payload.get("requestedRole"); // FREELANCER or EMPLOYER
        
        Map<String, Object> response = new HashMap<>();

        if (email == null || email.trim().isEmpty()) {
            response.put("success", false);
            response.put("message", "Email is required");
            return ResponseEntity.badRequest().body(response);
        }

        try {
            // Danh sách các Email được thiết lập làm quyền Admin tối cao (có thể lấy từ config/db)
            boolean isSpecialAdmin = "admin@lancerpro.com".equalsIgnoreCase(email) || 
                                     "illyasviel1252004@gmail.com".equalsIgnoreCase(email);
                                     
            if (isSpecialAdmin) {
                requestedRole = "ADMIN";
            } else if (requestedRole == null) {
                requestedRole = "FREELANCER";
            } else {
                requestedRole = requestedRole.toUpperCase();
            }

            // 1. Kiểm tra User đã tồn tại chưa
            List<Map<String, Object>> existingUsers = jdbcTemplate.queryForList(
                "SELECT * FROM users WHERE email = ?", email
            );

            int userId;
            String assignedRole = requestedRole;

            if (existingUsers.isEmpty()) {
                // TẠO MỚI USER (Lần đầu đăng nhập)
                String pwdHash = "OAUTH_GOOGLE_LOGGED"; 
                jdbcTemplate.update(
                    "INSERT INTO users (email, password_hash, display_name, full_name, avatar_url, status, email_verified, google_id, created_at, updated_at) " +
                    "VALUES (?, ?, ?, ?, ?, 'ACTIVE', 1, ?, GETDATE(), GETDATE())",
                    email, pwdHash, name, name, avatar, googleId
                );
                
                // Lấy ID vừa tạo
                userId = jdbcTemplate.queryForObject("SELECT IDENT_CURRENT('users')", Integer.class);

                // Gán Role vào bảng user_roles
                ensureRoleExists(assignedRole);
                int roleId = jdbcTemplate.queryForObject("SELECT role_id FROM roles WHERE role_name = ?", Integer.class, assignedRole);
                
                jdbcTemplate.update(
                    "INSERT INTO user_roles (user_id, role_id, assigned_at) VALUES (?, ?, GETDATE())",
                    userId, roleId
                );

                // Đảm bảo không bị thiếu sót thông tin: Tự động khởi tạo Profile tương ứng trong Database
                if ("FREELANCER".equals(assignedRole)) {
                    jdbcTemplate.update(
                        "INSERT INTO freelancer_profiles (user_id, created_at, updated_at) VALUES (?, GETDATE(), GETDATE())",
                        userId
                    );
                } else if ("EMPLOYER".equals(assignedRole) || "CLIENT".equals(assignedRole)) {
                    jdbcTemplate.update(
                        "INSERT INTO client_profiles (user_id, created_at, updated_at) VALUES (?, GETDATE(), GETDATE())",
                        userId
                    );
                }
            } else {
                // USER ĐÃ TỒN TẠI (Đăng nhập các lần tiếp theo)
                Map<String, Object> dbUser = existingUsers.get(0);
                userId = (Integer) dbUser.get("user_id");

                // Cập nhật lại thông tin google_id và avatar nếu chưa có (Trường hợp đăng nhập thường rồi đổi sang Google)
                if (googleId != null && dbUser.get("google_id") == null) {
                    jdbcTemplate.update("UPDATE users SET google_id = ?, avatar_url = ? WHERE user_id = ?", googleId, avatar, userId);
                }

                // Chặn việc chọn sai Role: Lấy chính xác Role đang lưu trong DB, bỏ qua Role người dùng chọn trên giao diện
                List<Map<String, Object>> userRoles = jdbcTemplate.queryForList(
                    "SELECT r.role_name FROM user_roles ur JOIN roles r ON ur.role_id = r.role_id WHERE ur.user_id = ?",
                    userId
                );

                if (!userRoles.isEmpty()) {
                    boolean hasAdmin = userRoles.stream().anyMatch(r -> "ADMIN".equals(r.get("role_name")));
                    if (hasAdmin) {
                        assignedRole = "ADMIN";
                    } else {
                        assignedRole = (String) userRoles.get(0).get("role_name");
                    }
                } else {
                    // Fallback an toàn nếu lỗi mất dữ liệu role
                    ensureRoleExists(assignedRole);
                    int roleId = jdbcTemplate.queryForObject("SELECT role_id FROM roles WHERE role_name = ?", Integer.class, assignedRole);
                    jdbcTemplate.update("INSERT INTO user_roles (user_id, role_id, assigned_at) VALUES (?, ?, GETDATE())", userId, roleId);
                }
            }

            // Cập nhật log đăng nhập
            jdbcTemplate.update("INSERT INTO login_history (user_id, login_at, success) VALUES (?, GETDATE(), 1)", userId);
            
            // Cập nhật thời điểm đăng nhập cuối cùng
            jdbcTemplate.update("UPDATE users SET last_login_at = GETDATE() WHERE user_id = ?", userId);

            // Trả về dữ liệu chuẩn để Frontend sử dụng
            response.put("success", true);
            response.put("user", Map.of(
                "id", userId,
                "email", email,
                "name", name,
                "role", assignedRole,
                "avatar", avatar != null ? avatar : "https://ui-avatars.com/api/?name=" + name
            ));
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Database error: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    private void ensureRoleExists(String roleName) {
        List<Map<String, Object>> roles = jdbcTemplate.queryForList("SELECT * FROM roles WHERE role_name = ?", roleName);
        if (roles.isEmpty()) {
            jdbcTemplate.update("INSERT INTO roles (role_name, description, is_active, created_at) VALUES (?, ?, 1, GETDATE())", 
                                roleName, "System generated role: " + roleName);
        }
    }
}
