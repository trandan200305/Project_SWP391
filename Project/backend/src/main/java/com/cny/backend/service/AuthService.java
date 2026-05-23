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

        // Lấy thông tin chi tiết được truyền thêm từ trang đăng ký thủ công
        String displayName = payload.getOrDefault("displayName", name);
        String fullName = payload.getOrDefault("fullName", name);
        String phone = payload.get("phone");
        String password = payload.get("password");
        String passwordHash = (password != null && !password.trim().isEmpty()) ? password : "OAUTH_GOOGLE_LOGGED";

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

        // Ký hiệu loại hình đăng nhập
        boolean isOAuthLogin = "OAUTH_GOOGLE_LOGGED".equals(passwordHash);

        // Kiểm tra xem email này đã tồn tại ở vai trò nào khác chưa
        Integer emailInAdmins = countBy("admins", "email", email);
        Integer emailInEmployers = countBy("employers", "email", email);
        Integer emailInFreelancers = countBy("freelancers", "email", email);

        int totalRoles = (emailInAdmins != null ? emailInAdmins : 0) +
                         (emailInEmployers != null ? emailInEmployers : 0) +
                         (emailInFreelancers != null ? emailInFreelancers : 0);

        int userId = -1;
        String assignedRole = requestedRole;
        String userStatus = "ACTIVE";
        boolean hasMessengerPin = false;

        if ("ADMIN".equals(assignedRole)) {
            // Nếu đã thuộc role khác, cấm
            if (totalRoles > 0 && emailInAdmins == 0) {
                response.put("success", false);
                response.put("message", "Email này đã được đăng ký dưới vai trò khác. Vui lòng đăng nhập đúng vai trò!");
                return response;
            }

            List<Map<String, Object>> existingAdmins = jdbcTemplate.queryForList(
                "SELECT * FROM admins WHERE email = ?", email
            );

            if (existingAdmins.isEmpty()) {
                if (!isOAuthLogin && !"true".equals(payload.get("isRegistration"))) {
                    response.put("success", false);
                    response.put("message", "Tài khoản không tồn tại!");
                    return response;
                }
                // Đăng ký Admin lần đầu qua Google hoặc đăng ký thủ công
                jdbcTemplate.update(
                    "INSERT INTO admins (email, password_hash, display_name, full_name, phone, avatar_url, status, email_verified, google_id, admin_level, created_at, updated_at, is_deleted) " +
                    "VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', 1, ?, 'SUPER_ADMIN', GETDATE(), GETDATE(), 0)",
                    email, passwordHash, displayName, fullName, phone, avatar, googleId
                );
                userId = jdbcTemplate.queryForObject("SELECT IDENT_CURRENT('admins')", Integer.class);
            } else {
                Map<String, Object> dbAdmin = existingAdmins.get(0);
                // Xác thực mật khẩu
                if (!isOAuthLogin) {
                    String dbPasswordHash = (String) dbAdmin.get("password_hash");
                    if (dbPasswordHash == null || !dbPasswordHash.equals(passwordHash)) {
                        response.put("success", false);
                        response.put("message", "Sai mật khẩu!");
                        return response;
                    }
                }

                userId = (Integer) dbAdmin.get("admin_id");
                userStatus = (String) dbAdmin.get("status");
                
                if (googleId != null && dbAdmin.get("google_id") == null) {
                    jdbcTemplate.update("UPDATE admins SET google_id = ?, avatar_url = ? WHERE admin_id = ?", googleId, avatar, userId);
                }
                
                String dbPin = (String) dbAdmin.get("messenger_pin");
                if (dbPin != null && !dbPin.trim().isEmpty()) {
                    hasMessengerPin = true;
                }
            }
        } 
        else if ("EMPLOYER".equals(assignedRole) || "CLIENT".equals(assignedRole)) {
            // Nếu đã thuộc role khác, cấm
            if (totalRoles > 0 && emailInEmployers == 0) {
                response.put("success", false);
                response.put("message", "Email này đã được đăng ký dưới vai trò Freelancer. Vui lòng đăng nhập đúng vai trò!");
                return response;
            }

            List<Map<String, Object>> existingEmployers = jdbcTemplate.queryForList(
                "SELECT * FROM employers WHERE email = ?", email
            );

            if (existingEmployers.isEmpty()) {
                if (!isOAuthLogin && !"true".equals(payload.get("isRegistration"))) {
                    response.put("success", false);
                    response.put("message", "Tài khoản không tồn tại!");
                    return response;
                }
                // Đăng ký Employer lần đầu
                jdbcTemplate.update(
                    "INSERT INTO employers (email, password_hash, display_name, full_name, phone, avatar_url, status, email_verified, google_id, created_at, updated_at, profile_completeness, total_spent, projects_posted, average_rating, is_deleted) " +
                    "VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', 1, ?, GETDATE(), GETDATE(), 100, 0, 0, 5.0, 0)",
                    email, passwordHash, displayName, fullName, phone, avatar, googleId
                );
                userId = jdbcTemplate.queryForObject("SELECT IDENT_CURRENT('employers')", Integer.class);
            } else {
                Map<String, Object> dbEmployer = existingEmployers.get(0);
                // Xác thực mật khẩu
                if (!isOAuthLogin) {
                    String dbPasswordHash = (String) dbEmployer.get("password_hash");
                    if (dbPasswordHash == null || !dbPasswordHash.equals(passwordHash)) {
                        response.put("success", false);
                        response.put("message", "Sai mật khẩu!");
                        return response;
                    }
                }

                userId = (Integer) dbEmployer.get("employer_id");
                userStatus = (String) dbEmployer.get("status");
                
                if (googleId != null && dbEmployer.get("google_id") == null) {
                    jdbcTemplate.update("UPDATE employers SET google_id = ?, avatar_url = ? WHERE employer_id = ?", googleId, avatar, userId);
                }
                
                String dbPin = (String) dbEmployer.get("messenger_pin");
                if (dbPin != null && !dbPin.trim().isEmpty()) {
                    hasMessengerPin = true;
                }
            }
        } 
        else {
            // Nếu đã thuộc role khác, cấm
            if (totalRoles > 0 && emailInFreelancers == 0) {
                response.put("success", false);
                response.put("message", "Email này đã được đăng ký dưới vai trò Employer. Vui lòng đăng nhập đúng vai trò!");
                return response;
            }

            List<Map<String, Object>> existingFreelancers = jdbcTemplate.queryForList(
                "SELECT * FROM freelancers WHERE email = ?", email
            );

            if (existingFreelancers.isEmpty()) {
                if (!isOAuthLogin && !"true".equals(payload.get("isRegistration"))) {
                    response.put("success", false);
                    response.put("message", "Tài khoản không tồn tại!");
                    return response;
                }
                // Đăng ký Freelancer lần đầu
                jdbcTemplate.update(
                    "INSERT INTO freelancers (email, password_hash, display_name, full_name, phone, avatar_url, status, email_verified, google_id, created_at, updated_at, profile_completeness, total_earnings, projects_completed, average_rating, is_available, is_deleted) " +
                    "VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', 1, ?, GETDATE(), GETDATE(), 95, 0, 0, 5.0, 1, 0)",
                    email, passwordHash, displayName, fullName, phone, avatar, googleId
                );
                userId = jdbcTemplate.queryForObject("SELECT IDENT_CURRENT('freelancers')", Integer.class);
            } else {
                Map<String, Object> dbFreelancer = existingFreelancers.get(0);
                // Xác thực mật khẩu
                if (!isOAuthLogin) {
                    String dbPasswordHash = (String) dbFreelancer.get("password_hash");
                    if (dbPasswordHash == null || !dbPasswordHash.equals(passwordHash)) {
                        response.put("success", false);
                        response.put("message", "Sai mật khẩu!");
                        return response;
                    }
                }

                userId = (Integer) dbFreelancer.get("freelancer_id");
                userStatus = (String) dbFreelancer.get("status");
                
                if (googleId != null && dbFreelancer.get("google_id") == null) {
                    jdbcTemplate.update("UPDATE freelancers SET google_id = ?, avatar_url = ? WHERE freelancer_id = ?", googleId, avatar, userId);
                }
                
                String dbPin = (String) dbFreelancer.get("messenger_pin");
                if (dbPin != null && !dbPin.trim().isEmpty()) {
                    hasMessengerPin = true;
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
        
        Map<String, Object> userObj = new HashMap<>();
        userObj.put("id", userId);
        userObj.put("email", email);
        userObj.put("name", name);
        userObj.put("role", assignedRole);
        userObj.put("avatar", avatar != null ? avatar : "https://ui-avatars.com/api/?name=" + name);
        userObj.put("hasMessengerPin", hasMessengerPin);
        
        response.put("user", userObj);
        return response;
    }

    /**
     * Kiểm tra xem một giá trị có đã tồn tại trong cột nhất định của bảng chỉ định hay chưa.
     * Được dùng để validate trùng lặp email / phone / display_name khi đăng ký.
     */
    public Integer countBy(String table, String column, String value) {
        String sql = "SELECT COUNT(*) FROM " + table + " WHERE " + column + " = ?";
        return jdbcTemplate.queryForObject(sql, Integer.class, value);
    }

    public boolean setMessengerPin(Integer userId, String role, String pin) {
        String table = getTableNameByRole(role);
        String idCol = getIdColumnByRole(role);
        if (table == null) return false;
        
        int rows = jdbcTemplate.update("UPDATE " + table + " SET messenger_pin = ? WHERE " + idCol + " = ?", pin, userId);
        return rows > 0;
    }

    public boolean verifyMessengerPin(Integer userId, String role, String pin) {
        String table = getTableNameByRole(role);
        String idCol = getIdColumnByRole(role);
        if (table == null) return false;
        
        List<String> pins = jdbcTemplate.queryForList("SELECT messenger_pin FROM " + table + " WHERE " + idCol + " = ?", String.class, userId);
        if (pins.isEmpty() || pins.get(0) == null) return false;
        return pins.get(0).equals(pin);
    }

    @Transactional
    public String resetAndEmailMessengerPin(Integer userId, String role, org.springframework.mail.javamail.JavaMailSender mailSender) {
        String table = getTableNameByRole(role);
        String idCol = getIdColumnByRole(role);
        if (table == null) return null;
        
        List<String> emails = jdbcTemplate.queryForList("SELECT email FROM " + table + " WHERE " + idCol + " = ?", String.class, userId);
        if (emails.isEmpty()) return null;
        String email = emails.get(0);
        
        String newPin = String.format("%04d", (int)(Math.random() * 10000));
        
        jdbcTemplate.update("UPDATE " + table + " SET messenger_pin = ? WHERE " + idCol + " = ?", newPin, userId);
        
        try {
            org.springframework.mail.SimpleMailMessage message = new org.springframework.mail.SimpleMailMessage();
            message.setTo(email);
            message.setSubject("[LancerPro] Cap lai ma PIN bao mat tin nhan");
            message.setText("Chào bạn,\n\n"
                + "Bạn vừa yêu cầu lấy lại mã PIN bảo mật cho đoạn chat Messenger tại LancerPro.\n\n"
                + "Mã PIN mới của bạn là: " + newPin + "\n\n"
                + "Vui lòng đăng nhập và sử dụng mã này để truy cập tin nhắn của bạn.\n\n"
                + "Trân trọng,\n"
                + "Đội ngũ LancerPro");
            mailSender.send(message);
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
        
        return email;
    }
    
    private String getTableNameByRole(String role) {
        if ("ADMIN".equalsIgnoreCase(role)) return "admins";
        if ("EMPLOYER".equalsIgnoreCase(role) || "CLIENT".equalsIgnoreCase(role)) return "employers";
        if ("FREELANCER".equalsIgnoreCase(role)) return "freelancers";
        return null;
    }
    
    private String getIdColumnByRole(String role) {
        if ("ADMIN".equalsIgnoreCase(role)) return "admin_id";
        if ("EMPLOYER".equalsIgnoreCase(role) || "CLIENT".equalsIgnoreCase(role)) return "employer_id";
        if ("FREELANCER".equalsIgnoreCase(role)) return "freelancer_id";
        return null;
    }
}
