package com.cny.backend.auth.service;

import com.cny.backend.auth.entity.*;
import com.cny.backend.admin.entity.*;
import com.cny.backend.project.entity.*;
import com.cny.backend.user.entity.*;
import com.cny.backend.auth.repository.*;
import com.cny.backend.admin.repository.*;
import com.cny.backend.project.repository.*;
import com.cny.backend.user.repository.*;
import com.cny.backend.admin.dto.*;
import com.cny.backend.chat.dto.*;
import com.cny.backend.project.dto.*;
import com.cny.backend.user.dto.*;
import com.cny.backend.auth.service.*;
import com.cny.backend.admin.service.*;
import com.cny.backend.chat.service.*;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;

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

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private com.cny.backend.admin.repository.ManagerRepository managerRepository;

    @Autowired
    private com.cny.backend.admin.repository.StaffRepository staffRepository;

    @Autowired
    private StaffInvitationRepository staffInvitationRepository;
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
        Optional<com.cny.backend.admin.entity.Manager> existingManager = managerRepository.findByEmail(email);
        Optional<com.cny.backend.admin.entity.Staff> existingStaff = staffRepository.findByEmail(email);
        if (isSpecialAdmin || existingAdmin.isPresent()) {
            requestedRole = "ADMIN";
        } else if (existingManager.isPresent()) {
            requestedRole = "MANAGER";
        } else if (existingStaff.isPresent()) {
            requestedRole = "STAFF";
        } else {
            if (requestedRole == null || requestedRole.trim().isEmpty()) {
                if (existingEmployer.isPresent()) {
                    requestedRole = "EMPLOYER";
                } else {
                    requestedRole = "FREELANCER";
                }
            } else {
                requestedRole = requestedRole.toUpperCase();
            }
        }

        boolean isOAuthLogin = "OAUTH_GOOGLE_LOGGED".equals(passwordHash);

        int emailInAdmins = countBy("admins", "email", email);
        int emailInEmployers = countBy("employers", "email", email);
        int emailInFreelancers = countBy("freelancers", "email", email);
        int emailInManagers = countBy("managers", "email", email);
        int emailInStaff = countBy("staff", "email", email);

        int totalRoles = emailInAdmins + emailInEmployers + emailInFreelancers + emailInManagers + emailInStaff;

        int userId = -1;
        String assignedRole = requestedRole;
        String userStatus = "ACTIVE";
        boolean hasMessengerPin = false;

        if ("ADMIN".equals(assignedRole)) {
            if (totalRoles > 0 && emailInAdmins == 0) {
                response.put("success", false);
                response.put("message",
                        "Email này đã được đăng ký dưới vai trò khác. Vui lòng đăng nhập đúng vai trò!");
                return response;
            }

            // LOGIN FOR ADMIN
            if (existingAdmin.isEmpty()) {
                response.put("success", false);
                response.put("message", "Tài khoản Admin không tồn tại!");
                return response;
            }

            Admin dbAdmin = existingAdmin.get();
            if (!isOAuthLogin) {
                if (dbAdmin.getPasswordHash() == null
                        || !passwordEncoder.matches(passwordHash, dbAdmin.getPasswordHash())) {
                    response.put("success", false);
                    response.put("message", "Sai mật khẩu!");
                    return response;
                }
            }

            userId = dbAdmin.getAdminId();
            userStatus = dbAdmin.getStatus();

            String dbPin = dbAdmin.getMessengerPin();
            if (dbPin != null && !dbPin.trim().isEmpty()) {
                hasMessengerPin = true;
            }
        } else if ("EMPLOYER".equals(assignedRole) || "CLIENT".equals(assignedRole)) {
            if (totalRoles > 0 && emailInEmployers == 0) {
                response.put("success", false);
                response.put("message",
                        "Email này đã được đăng ký dưới vai trò Freelancer. Vui lòng đăng nhập đúng vai trò!");
                return response;
            }

            // REGISTER FOR EMPLOYER
            if (existingEmployer.isEmpty()) {
                if (!isOAuthLogin && !"true".equals(payload.get("isRegistration"))) {
                    response.put("success", false);
                    response.put("message", "Tài khoản không tồn tại!");
                    return response;
                }
                Employer employer = Employer.builder()
                        .email(email)
                        .passwordHash(isOAuthLogin ? "OAUTH_GOOGLE_LOGGED" : passwordEncoder.encode(passwordHash))
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
                //LOGIN FOR EMPLOYER
                Employer dbEmployer = existingEmployer.get();
                if (!isOAuthLogin) {
                    if (dbEmployer.getPasswordHash() == null
                            || !passwordEncoder.matches(passwordHash, dbEmployer.getPasswordHash())) {
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
        else if ("MANAGER".equals(assignedRole)) {
            if (totalRoles > 0 && emailInManagers == 0) {
                response.put("success", false);
                response.put("message", "Email này đã được đăng ký dưới vai trò khác. Vui lòng đăng nhập đúng vai trò!");
                return response;
            }

            if (existingManager.isEmpty()) {
                response.put("success", false);
                response.put("message", "Tài khoản không tồn tại!");
                return response;
            } else {
                com.cny.backend.admin.entity.Manager dbManager = existingManager.get();
                if (!isOAuthLogin) {
                    if (dbManager.getPasswordHash() == null || !dbManager.getPasswordHash().equals(passwordHash)) {
                        response.put("success", false);
                        response.put("message", "Sai mật khẩu!");
                        return response;
                    }
                }

                userId = dbManager.getManagerId();
                userStatus = dbManager.getStatus();
                
                boolean updated = false;
                String dbPin = dbManager.getMessengerPin();
                if (dbPin != null && !dbPin.trim().isEmpty()) {
                    hasMessengerPin = true;
                }
                
                if (updated) {
                    managerRepository.save(dbManager);
                }
            }
        }
        else if ("STAFF".equals(assignedRole)) {
            if (totalRoles > 0 && emailInStaff == 0) {
                response.put("success", false);
                response.put("message", "Email này đã được đăng ký dưới vai trò khác. Vui lòng đăng nhập đúng vai trò!");
                return response;
            }

            if (existingStaff.isEmpty()) {
                response.put("success", false);
                response.put("message", "Tài khoản không tồn tại!");
                return response;
            } else {
                com.cny.backend.admin.entity.Staff dbStaff = existingStaff.get();
                if (!isOAuthLogin) {
                    if (dbStaff.getPasswordHash() == null || !dbStaff.getPasswordHash().equals(passwordHash)) {
                        response.put("success", false);
                        response.put("message", "Sai mật khẩu!");
                        return response;
                    }
                }

                userId = dbStaff.getStaffId();
                userStatus = dbStaff.getStatus();
                
                boolean updated = false;
                String dbPin = dbStaff.getMessengerPin();
                if (dbPin != null && !dbPin.trim().isEmpty()) {
                    hasMessengerPin = true;
                }
                
                if (updated) {
                    staffRepository.save(dbStaff);
                }
            }
        }
        else {
            if (totalRoles > 0 && emailInFreelancers == 0) {
                response.put("success", false);
                response.put("message", "Email này đã được đăng ký dưới vai trò khác. Vui lòng đăng nhập đúng vai trò!");
                return response;
            }

            //REGISTER FOR FREELANCER
            if (existingFreelancer.isEmpty()) {
                if (!isOAuthLogin && !"true".equals(payload.get("isRegistration"))) {
                    response.put("success", false);
                    response.put("message", "Tài khoản không tồn tại!");
                    return response;
                }

                Freelancer freelancer = Freelancer.builder()
                        .email(email)
                        .passwordHash(isOAuthLogin ? "OAUTH_GOOGLE_LOGGED" : passwordEncoder.encode(passwordHash))
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
                //LOGIN FOR FREELANCER
                Freelancer dbFreelancer = existingFreelancer.get();

                if (!isOAuthLogin) {
                    if (dbFreelancer.getPasswordHash() == null
                            || !passwordEncoder.matches(passwordHash, dbFreelancer.getPasswordHash())) {
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

        // RECORD LOGIN HISTORY AND UPDATE LAST LOGIN TIME
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
        } else if ("MANAGER".equals(assignedRole)) {
            com.cny.backend.admin.entity.Manager m = managerRepository.findById(userId).orElse(null);
            if (m != null) {
                m.setLastLoginAt(LocalDateTime.now());
                managerRepository.save(m);
            }
            history.setManagerId(userId);
        } else if ("STAFF".equals(assignedRole)) {
            com.cny.backend.admin.entity.Staff s = staffRepository.findById(userId).orElse(null);
            if (s != null) {
                s.setLastLoginAt(LocalDateTime.now());
                staffRepository.save(s);
            }
            history.setStaffId(userId);
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

        // CHECK USER ACCOUNT STATUS (LOCKED/BANNED)
        if ("LOCKED".equals(userStatus) || "BANNED".equals(userStatus)) {
            String notifMessage = "LOCKED".equals(userStatus)
                    ? "Tài khoản của bạn đã bị tạm khóa. Liên hệ support@vlance.vn để được hỗ trợ."
                    : "Tài khoản của bạn đã bị cấm vĩnh viễn do vi phạm chính sách.";

            response.put("success", false);
            response.put("accountStatus", userStatus);
            response.put("message", notifMessage);
            return response;
        }

        // PREPARE SUCCESSFUL LOGIN RESPONSE FOR FRONTEND
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

    // check login status by role
    public Integer countBy(String table, String column, String value) {
        if ("admins".equalsIgnoreCase(table)) {
            if ("email".equalsIgnoreCase(column)) return (int) adminRepository.countByEmail(value);
            if ("phone".equalsIgnoreCase(column)) return (int) adminRepository.countByPhone(value);
            if ("display_name".equalsIgnoreCase(column)) return (int) adminRepository.countByDisplayName(value);
        } else if ("managers".equalsIgnoreCase(table)) {
            if ("email".equalsIgnoreCase(column)) return (int) managerRepository.countByEmail(value);
            if ("phone".equalsIgnoreCase(column)) return (int) managerRepository.countByPhone(value);
            if ("display_name".equalsIgnoreCase(column)) return (int) managerRepository.countByDisplayName(value);
        } else if ("staff".equalsIgnoreCase(table)) {
            if ("email".equalsIgnoreCase(column)) return (int) staffRepository.countByEmail(value);
            if ("phone".equalsIgnoreCase(column)) return (int) staffRepository.countByPhone(value);
            if ("display_name".equalsIgnoreCase(column)) return (int) staffRepository.countByDisplayName(value);
        } else if ("employers".equalsIgnoreCase(table)) {
            if ("email".equalsIgnoreCase(column)) return (int) employerRepository.countByEmail(value);
            if ("phone".equalsIgnoreCase(column)) return (int) employerRepository.countByPhone(value);
            if ("display_name".equalsIgnoreCase(column)) return (int) employerRepository.countByDisplayName(value);
        } else if ("freelancers".equalsIgnoreCase(table)) {
            if ("email".equalsIgnoreCase(column)) return (int) freelancerRepository.countByEmail(value);
            if ("phone".equalsIgnoreCase(column)) return (int) freelancerRepository.countByPhone(value);
            if ("display_name".equalsIgnoreCase(column)) return (int) freelancerRepository.countByDisplayName(value);
        }
        return 0;
    }

    // set messenger pin
    public boolean setMessengerPin(Integer userId, String role, String pin) {
        if ("ADMIN".equalsIgnoreCase(role)) {
            return adminRepository.findById(userId).map(u -> {
                u.setMessengerPin(pin);
                adminRepository.save(u);
                return true;
            }).orElse(false);
        } else if ("MANAGER".equalsIgnoreCase(role)) {
            return managerRepository.findById(userId).map(u -> {
                u.setMessengerPin(pin);
                managerRepository.save(u);
                return true;
            }).orElse(false);
        } else if ("STAFF".equalsIgnoreCase(role)) {
            return staffRepository.findById(userId).map(u -> {
                u.setMessengerPin(pin);
                staffRepository.save(u);
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

    // verify messenger pin
    public boolean verifyMessengerPin(Integer userId, String role, String pin) {
        if ("ADMIN".equalsIgnoreCase(role)) {
            return adminRepository.findById(userId)
                    .map(Admin::getMessengerPin)
                    .map(p -> p.equals(pin))
                    .orElse(false);
        } else if ("MANAGER".equalsIgnoreCase(role)) {
            return managerRepository.findById(userId)
                    .map(com.cny.backend.admin.entity.Manager::getMessengerPin)
                    .map(p -> p.equals(pin))
                    .orElse(false);
        } else if ("STAFF".equalsIgnoreCase(role)) {
            return staffRepository.findById(userId)
                    .map(com.cny.backend.admin.entity.Staff::getMessengerPin)
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

    // reset and email messenger pin
    @Transactional
    public String resetAndEmailMessengerPin(Integer userId, String role,
            org.springframework.mail.javamail.JavaMailSender mailSender) {
        String email = null;
        String newPin = String.format("%04d", (int) (Math.random() * 10000));

        if ("ADMIN".equalsIgnoreCase(role)) {
            Optional<Admin> opt = adminRepository.findById(userId);
            if (opt.isPresent()) {
                Admin a = opt.get();
                email = a.getEmail();
                a.setMessengerPin(newPin);
                adminRepository.save(a);
            }
        } else if ("MANAGER".equalsIgnoreCase(role)) {
            Optional<com.cny.backend.admin.entity.Manager> opt = managerRepository.findById(userId);
            if (opt.isPresent()) {
                com.cny.backend.admin.entity.Manager m = opt.get();
                email = m.getEmail();
                m.setMessengerPin(newPin);
                managerRepository.save(m);
            }
        } else if ("STAFF".equalsIgnoreCase(role)) {
            Optional<com.cny.backend.admin.entity.Staff> opt = staffRepository.findById(userId);
            if (opt.isPresent()) {
                com.cny.backend.admin.entity.Staff s = opt.get();
                email = s.getEmail();
                s.setMessengerPin(newPin);
                staffRepository.save(s);
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

        if (email == null)
            return null;

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
            throw new RuntimeException("Gửi email đặt lại mã PIN thất bại. Vui lòng thử lại sau!");
        }

        return email;
    }

    // reset password
    @Transactional
    public boolean resetPassword(String email, String newPassword) {
        boolean updated = false;

        Optional<Admin> a = adminRepository.findByEmail(email);
        if (a.isPresent()) {
            a.get().setPasswordHash(passwordEncoder.encode(newPassword));
            adminRepository.save(a.get());
            updated = true;
        }

        Optional<Employer> e = employerRepository.findByEmail(email);
        if (e.isPresent()) {
            e.get().setPasswordHash(passwordEncoder.encode(newPassword));
            employerRepository.save(e.get());
            updated = true;
        }

        Optional<Freelancer> f = freelancerRepository.findByEmail(email);
        if (f.isPresent()) {
            f.get().setPasswordHash(passwordEncoder.encode(newPassword));
            freelancerRepository.save(f.get());
            updated = true;
        }

        return updated;
    }

    public Map<String, Object> verifyInvitationToken(String token) {
        Map<String, Object> response = new HashMap<>();
        Optional<StaffInvitation> opt = staffInvitationRepository.findByToken(token);
        if (opt.isEmpty()) {
            response.put("success", false);
            response.put("message", "Liên kết mời không hợp lệ hoặc đã hết hạn!");
            return response;
        }
        StaffInvitation invitation = opt.get();
        if (!"PENDING".equals(invitation.getStatus())) {
            response.put("success", false);
            response.put("message", "Lời mời này đã được sử dụng hoặc đã hết hạn!");
            return response;
        }
        if (invitation.getExpiresAt().isBefore(LocalDateTime.now())) {
            invitation.setStatus("EXPIRED");
            staffInvitationRepository.save(invitation);
            response.put("success", false);
            response.put("message", "Liên kết mời đã hết hạn (chỉ có hiệu lực trong 24 giờ)!");
            return response;
        }
        response.put("success", true);
        response.put("email", invitation.getEmail());
        response.put("role", invitation.getRole());
        return response;
    }

    @Transactional
    public Map<String, Object> acceptInvitation(Map<String, String> payload) {
        Map<String, Object> response = new HashMap<>();
        String token = payload.get("token");
        String fullName = payload.get("fullName");
        String phone = payload.get("phone");
        String password = payload.get("password");
        String displayName = payload.get("displayName");

        if (token == null || token.trim().isEmpty()) {
            response.put("success", false);
            response.put("message", "Token không được để trống!");
            return response;
        }
        if (password == null || password.trim().isEmpty()) {
            response.put("success", false);
            response.put("message", "Mật khẩu không được để trống!");
            return response;
        }

        Optional<StaffInvitation> opt = staffInvitationRepository.findByToken(token);
        if (opt.isEmpty()) {
            response.put("success", false);
            response.put("message", "Liên kết mời không hợp lệ!");
            return response;
        }
        StaffInvitation invitation = opt.get();
        if (!"PENDING".equals(invitation.getStatus())) {
            response.put("success", false);
            response.put("message", "Lời mời đã được sử dụng hoặc hết hạn!");
            return response;
        }
        if (invitation.getExpiresAt().isBefore(LocalDateTime.now())) {
            invitation.setStatus("EXPIRED");
            staffInvitationRepository.save(invitation);
            response.put("success", false);
            response.put("message", "Liên kết mời đã hết hạn!");
            return response;
        }

        String email = invitation.getEmail();
        String role = invitation.getRole();

        // Complete Onboarding based on role
        if ("MANAGER".equals(role)) {
            Optional<com.cny.backend.admin.entity.Manager> mgrOpt = managerRepository.findByEmail(email);
            if (mgrOpt.isPresent()) {
                com.cny.backend.admin.entity.Manager mgr = mgrOpt.get();
                mgr.setPasswordHash(password); // Save plain text password as per project design
                mgr.setFullName(fullName);
                mgr.setPhone(phone);
                mgr.setDisplayName(displayName != null && !displayName.trim().isEmpty() ? displayName : (fullName != null ? fullName : email.split("@")[0]));
                mgr.setStatus("ACTIVE");
                mgr.setUpdatedAt(LocalDateTime.now());
                managerRepository.save(mgr);
            } else {
                response.put("success", false);
                response.put("message", "Không tìm thấy tài khoản Manager tương ứng!");
                return response;
            }
        } else {
            Optional<com.cny.backend.admin.entity.Staff> stfOpt = staffRepository.findByEmail(email);
            if (stfOpt.isPresent()) {
                com.cny.backend.admin.entity.Staff stf = stfOpt.get();
                stf.setPasswordHash(password);
                stf.setFullName(fullName);
                stf.setPhone(phone);
                stf.setDisplayName(displayName != null && !displayName.trim().isEmpty() ? displayName : (fullName != null ? fullName : email.split("@")[0]));
                stf.setStatus("ACTIVE");
                stf.setUpdatedAt(LocalDateTime.now());
                staffRepository.save(stf);
            } else {
                response.put("success", false);
                response.put("message", "Không tìm thấy tài khoản Staff tương ứng!");
                return response;
            }
        }

        // Update invitation status
        invitation.setStatus("ACCEPTED");
        invitation.setUpdatedAt(LocalDateTime.now());
        staffInvitationRepository.save(invitation);

        response.put("success", true);
        response.put("message", "Thiết lập tài khoản thành công! Bạn hiện đã có thể đăng nhập vào hệ thống.");
        return response;
    }
}
