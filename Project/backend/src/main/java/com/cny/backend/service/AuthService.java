package com.cny.backend.service;

import com.cny.backend.entity.Admin;
import com.cny.backend.entity.Employer;
import com.cny.backend.entity.Freelancer;
import com.cny.backend.entity.LoginHistory;
import com.cny.backend.repository.AdminRepository;
import com.cny.backend.repository.EmployerRepository;
import com.cny.backend.repository.FreelancerRepository;
import com.cny.backend.repository.LoginHistoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class AuthService {

    @Autowired
    private AdminRepository adminRepository;

    @Autowired
    private EmployerRepository employerRepository;

    @Autowired
    private FreelancerRepository freelancerRepository;

    @Autowired
    private LoginHistoryRepository loginHistoryRepository;

    @Transactional 
    public Map<String, Object> login(Map<String, String> payload) {
        String email = payload.get("email");
        String name = payload.get("name");
        String googleId = payload.get("googleId");
        String avatar = payload.get("avatar");
        String requestedRole = payload.get("requestedRole"); 

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

        boolean isSpecialAdmin = "admin@lancerpro.com".equalsIgnoreCase(email);
                                 
        Optional<Admin> existingAdmin = adminRepository.findByEmail(email);
        Optional<Employer> existingEmployer = employerRepository.findByEmail(email);
        Optional<Freelancer> existingFreelancer = freelancerRepository.findByEmail(email);
                                 
        if (isSpecialAdmin || existingAdmin.isPresent()) {
            requestedRole = "ADMIN";
        } else if (existingEmployer.isPresent()) {
            requestedRole = "EMPLOYER";
        } else if (existingFreelancer.isPresent()) {
            requestedRole = "FREELANCER";
        } else if (requestedRole == null) {
            requestedRole = "FREELANCER"; 
        } else {
            requestedRole = requestedRole.toUpperCase(); 
        }

        boolean isOAuthLogin = "OAUTH_GOOGLE_LOGGED".equals(passwordHash);

        int emailInAdmins = countBy("admins", "email", email);
        int emailInEmployers = countBy("employers", "email", email);
        int emailInFreelancers = countBy("freelancers", "email", email);

        int totalRoles = emailInAdmins + emailInEmployers + emailInFreelancers;

        int userId = -1;
        String assignedRole = requestedRole;
        String userStatus = "ACTIVE";
        boolean hasMessengerPin = false;

        if ("ADMIN".equals(assignedRole)) {
            if (totalRoles > 0 && emailInAdmins == 0) {
                response.put("success", false);
                response.put("message", "Email này đã được đăng ký dưới vai trò khác. Vui lòng đăng nhập đúng vai trò!");
                return response;
            }

            if (existingAdmin.isEmpty()) {
                if (!isOAuthLogin && !"true".equals(payload.get("isRegistration"))) {
                    response.put("success", false);
                    response.put("message", "Tài khoản không tồn tại!");
                    return response;
                }
                Admin admin = Admin.builder()
                        .email(email)
                        .passwordHash(passwordHash)
                        .displayName(displayName)
                        .fullName(fullName)
                        .phone(phone)
                        .avatarUrl(avatar)
                        .status("ACTIVE")
                        .emailVerified(true)
                        .googleId(googleId)
                        .adminLevel("SUPER_ADMIN")
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .isDeleted(false)
                        .build();
                admin = adminRepository.save(admin);
                userId = admin.getAdminId();
            } else {
                Admin dbAdmin = existingAdmin.get();
                if (!isOAuthLogin) {
                    if (dbAdmin.getPasswordHash() == null || !dbAdmin.getPasswordHash().equals(passwordHash)) {
                        response.put("success", false);
                        response.put("message", "Sai mật khẩu!");
                        return response;
                    }
                }

                userId = dbAdmin.getAdminId();
                userStatus = dbAdmin.getStatus();
                
                boolean updated = false;
                if (googleId != null && dbAdmin.getGoogleId() == null) {
                    dbAdmin.setGoogleId(googleId);
                    dbAdmin.setAvatarUrl(avatar);
                    updated = true;
                }
                
                String dbPin = dbAdmin.getMessengerPin();
                if (dbPin != null && !dbPin.trim().isEmpty()) {
                    hasMessengerPin = true;
                }
                
                if (updated) {
                    adminRepository.save(dbAdmin);
                }
            }
        } 
        else if ("EMPLOYER".equals(assignedRole) || "CLIENT".equals(assignedRole)) {
            if (totalRoles > 0 && emailInEmployers == 0) {
                response.put("success", false);
                response.put("message", "Email này đã được đăng ký dưới vai trò Freelancer. Vui lòng đăng nhập đúng vai trò!");
                return response;
            }

            if (existingEmployer.isEmpty()) {
                if (!isOAuthLogin && !"true".equals(payload.get("isRegistration"))) {
                    response.put("success", false);
                    response.put("message", "Tài khoản không tồn tại!");
                    return response;
                }
                Employer employer = Employer.builder()
                        .email(email)
                        .passwordHash(passwordHash)
                        .displayName(displayName)
                        .fullName(fullName)
                        .phone(phone)
                        .avatarUrl(avatar)
                        .status("ACTIVE")
                        .emailVerified(true)
                        .googleId(googleId)
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .profileCompleteness(100)
                        .totalSpent(java.math.BigDecimal.ZERO)
                        .projectsPosted(0)
                        .averageRating(new java.math.BigDecimal("5.0"))
                        .isDeleted(false)
                        .build();
                employer = employerRepository.save(employer);
                userId = employer.getEmployerId();
            } else {
                Employer dbEmployer = existingEmployer.get();
                if (!isOAuthLogin) {
                    if (dbEmployer.getPasswordHash() == null || !dbEmployer.getPasswordHash().equals(passwordHash)) {
                        response.put("success", false);
                        response.put("message", "Sai mật khẩu!");
                        return response;
                    }
                }

                userId = dbEmployer.getEmployerId();
                userStatus = dbEmployer.getStatus();
                
                boolean updated = false;
                if (googleId != null && dbEmployer.getGoogleId() == null) {
                    dbEmployer.setGoogleId(googleId);
                    dbEmployer.setAvatarUrl(avatar);
                    updated = true;
                }
                
                String dbPin = dbEmployer.getMessengerPin();
                if (dbPin != null && !dbPin.trim().isEmpty()) {
                    hasMessengerPin = true;
                }
                
                if (updated) {
                    employerRepository.save(dbEmployer);
                }
            }
        } 
        else {
            if (totalRoles > 0 && emailInFreelancers == 0) {
                response.put("success", false);
                response.put("message", "Email này đã được đăng ký dưới vai trò Employer. Vui lòng đăng nhập đúng vai trò!");
                return response;
            }

            if (existingFreelancer.isEmpty()) {
                if (!isOAuthLogin && !"true".equals(payload.get("isRegistration"))) {
                    response.put("success", false);
                    response.put("message", "Tài khoản không tồn tại!");
                    return response;
                }
                
                Freelancer freelancer = Freelancer.builder() 
                        .email(email)
                        .passwordHash(passwordHash) 
                        .displayName(displayName)
                        .fullName(fullName)
                        .phone(phone)
                        .avatarUrl(avatar)
                        .status("ACTIVE")
                        .emailVerified(true) 
                        .googleId(googleId)
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .profileCompleteness(95) 
                        .totalEarnings(java.math.BigDecimal.ZERO)
                        .projectsCompleted(0)
                        .averageRating(new java.math.BigDecimal("5.0"))
                        .isAvailable(true)
                        .isDeleted(false)
                        .build();
                freelancer = freelancerRepository.save(freelancer); 
                userId = freelancer.getProfileId(); 
            } else {
                Freelancer dbFreelancer = existingFreelancer.get();
                
                if (!isOAuthLogin) {
                    if (dbFreelancer.getPasswordHash() == null || !dbFreelancer.getPasswordHash().equals(passwordHash)) {
                        response.put("success", false);
                        response.put("message", "Sai mật khẩu!");
                        return response;
                    }
                }

                userId = dbFreelancer.getProfileId();
                userStatus = dbFreelancer.getStatus();
                
                boolean updated = false;
                if (googleId != null && dbFreelancer.getGoogleId() == null) {
                    dbFreelancer.setGoogleId(googleId);
                    dbFreelancer.setAvatarUrl(avatar);
                    updated = true;
                }
                
                String dbPin = dbFreelancer.getMessengerPin();
                if (dbPin != null && !dbPin.trim().isEmpty()) {
                    hasMessengerPin = true;
                }
                
                if (updated) {
                    freelancerRepository.save(dbFreelancer);
                }
            }
        }

        LoginHistory history = LoginHistory.builder()
                .loginAt(LocalDateTime.now())
                .success(true)
                .build();

        if ("ADMIN".equals(assignedRole)) {
            Admin a = adminRepository.findById(userId).orElse(null);
            if (a != null) {
                a.setLastLoginAt(LocalDateTime.now());
                adminRepository.save(a);
            }
            history.setAdminId(userId);
        } else if ("EMPLOYER".equals(assignedRole) || "CLIENT".equals(assignedRole)) {
            Employer e = employerRepository.findById(userId).orElse(null);
            if (e != null) {
                e.setLastLoginAt(LocalDateTime.now());
                employerRepository.save(e);
            }
            history.setEmployerId(userId);
        } else {
            Freelancer f = freelancerRepository.findById(userId).orElse(null);
            if (f != null) {
                f.setLastLoginAt(LocalDateTime.now());
                freelancerRepository.save(f);
            }
            history.setFreelancerId(userId);
        }
        
        loginHistoryRepository.save(history);

        if ("LOCKED".equals(userStatus) || "BANNED".equals(userStatus)) {
            String notifMessage = "LOCKED".equals(userStatus) 
                ? "Tài khoản của bạn đã bị tạm khóa. Liên hệ support@vlance.vn để được hỗ trợ."
                : "Tài khoản của bạn đã bị cấm vĩnh viễn do vi phạm chính sách.";

            response.put("success", false);
            response.put("accountStatus", userStatus);
            response.put("message", notifMessage);
            return response;
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

    public Integer countBy(String table, String column, String value) {
        if ("admins".equalsIgnoreCase(table)) {
            if ("email".equalsIgnoreCase(column)) return adminRepository.countByEmail(value);
            if ("phone".equalsIgnoreCase(column)) return adminRepository.countByPhone(value);
            if ("display_name".equalsIgnoreCase(column)) return adminRepository.countByDisplayName(value);
        } else if ("employers".equalsIgnoreCase(table)) {
            if ("email".equalsIgnoreCase(column)) return employerRepository.countByEmail(value);
            if ("phone".equalsIgnoreCase(column)) return employerRepository.countByPhone(value);
            if ("display_name".equalsIgnoreCase(column)) return employerRepository.countByDisplayName(value);
        } else if ("freelancers".equalsIgnoreCase(table)) {
            if ("email".equalsIgnoreCase(column)) return freelancerRepository.countByEmail(value);
            if ("phone".equalsIgnoreCase(column)) return freelancerRepository.countByPhone(value);
            if ("display_name".equalsIgnoreCase(column)) return freelancerRepository.countByDisplayName(value);
        }
        return 0;
    }


    public boolean setMessengerPin(Integer userId, String role, String pin) {
        if ("ADMIN".equalsIgnoreCase(role)) {
            return adminRepository.findById(userId).map(u -> {
                u.setMessengerPin(pin); 
                adminRepository.save(u); 
                return true;
            }).orElse(false);
        } else if ("EMPLOYER".equalsIgnoreCase(role) || "CLIENT".equalsIgnoreCase(role)) {
            return employerRepository.findById(userId).map(u -> {
                u.setMessengerPin(pin);
                employerRepository.save(u);
                return true;
            }).orElse(false);
        } else if ("FREELANCER".equalsIgnoreCase(role)) {
            return freelancerRepository.findById(userId).map(u -> {
                u.setMessengerPin(pin);
                freelancerRepository.save(u);
                return true;
            }).orElse(false);
        }
        return false;
    }

    public boolean verifyMessengerPin(Integer userId, String role, String pin) {
        if ("ADMIN".equalsIgnoreCase(role)) {
            return adminRepository.findById(userId)
                    .map(Admin::getMessengerPin)
                    .map(p -> p.equals(pin))
                    .orElse(false);
        } else if ("EMPLOYER".equalsIgnoreCase(role) || "CLIENT".equalsIgnoreCase(role)) {
            return employerRepository.findById(userId)
                    .map(Employer::getMessengerPin)
                    .map(p -> p.equals(pin))
                    .orElse(false);
        } else if ("FREELANCER".equalsIgnoreCase(role)) {
            return freelancerRepository.findById(userId)
                    .map(Freelancer::getMessengerPin)
                    .map(p -> p.equals(pin))
                    .orElse(false);
        }
        return false;
    }

    @Transactional
    public String resetAndEmailMessengerPin(Integer userId, String role, org.springframework.mail.javamail.JavaMailSender mailSender) {
        String email = null;
        String newPin = String.format("%04d", (int)(Math.random() * 10000));
        
        if ("ADMIN".equalsIgnoreCase(role)) {
            Optional<Admin> opt = adminRepository.findById(userId);
            if (opt.isPresent()) {
                Admin a = opt.get();
                email = a.getEmail();
                a.setMessengerPin(newPin);
                adminRepository.save(a);
            }
        } else if ("EMPLOYER".equalsIgnoreCase(role) || "CLIENT".equalsIgnoreCase(role)) {
            Optional<Employer> opt = employerRepository.findById(userId);
            if (opt.isPresent()) {
                Employer e = opt.get();
                email = e.getEmail();
                e.setMessengerPin(newPin);
                employerRepository.save(e);
            }
        } else if ("FREELANCER".equalsIgnoreCase(role)) {
            Optional<Freelancer> opt = freelancerRepository.findById(userId);
            if (opt.isPresent()) {
                Freelancer f = opt.get();
                email = f.getEmail();
                f.setMessengerPin(newPin);
                freelancerRepository.save(f);
            }
        }
        
        if (email == null) return null;
        
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

    @Transactional
    public boolean resetPassword(String email, String newPassword) {
        boolean updated = false;

        Optional<Admin> a = adminRepository.findByEmail(email);
        if (a.isPresent()) {
            a.get().setPasswordHash(newPassword);
            adminRepository.save(a.get());
            updated = true;
        }

        Optional<Employer> e = employerRepository.findByEmail(email);
        if (e.isPresent()) {
            e.get().setPasswordHash(newPassword);
            employerRepository.save(e.get());
            updated = true;
        }

        Optional<Freelancer> f = freelancerRepository.findByEmail(email);
        if (f.isPresent()) {
            f.get().setPasswordHash(newPassword);
            freelancerRepository.save(f.get());
            updated = true;
        }

        return updated;
    }
}
