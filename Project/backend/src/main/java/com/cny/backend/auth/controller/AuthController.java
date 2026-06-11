package com.cny.backend.auth.controller;

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
import org.springframework.http.ResponseEntity;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired
    private JavaMailSender mailSender;

    
    private final Map<String, String> verificationCodes = new ConcurrentHashMap<>();

    private final Map<String, Long> codeTimestamps = new ConcurrentHashMap<>();

    private final Map<String, Boolean> verifiedForReset = new ConcurrentHashMap<>();
    private final Map<String, Boolean> tempPinUsers = new ConcurrentHashMap<>();
    
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> payload) {
        Map<String, Object> response = authService.login(payload);

        if (response.containsKey("success") && !(Boolean) response.get("success")) {
            if (response.containsKey("accountStatus")) {
                return ResponseEntity.status(403).body(response);
            }
            return ResponseEntity.badRequest().body(response);
        }
        return ResponseEntity.ok(response);
    }

    
    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String password = payload.get("password");
        String fullName = payload.get("name");
        String displayName = payload.get("displayName");
        String phone = payload.get("phone");
        String role = payload.getOrDefault("requestedRole", "FREELANCER").toUpperCase();

        Map<String, Object> response = new HashMap<>();

        
        if (email == null || email.trim().isEmpty()) {
            response.put("success", false);
            response.put("message", "Email không được để trống!");
            return ResponseEntity.badRequest().body(response);
        }

        
        try {
            
            String table = role.equals("EMPLOYER") ? "employers" : "freelancers";
            String idColumn = role.equals("EMPLOYER") ? "employer_id" : "freelancer_id";

            
            Integer emailInEmployers = authService.countBy("employers", "email", email);
            Integer emailInFreelancers = authService.countBy("freelancers", "email", email);
            Integer emailInAdmins = authService.countBy("admins", "email", email);

            if ((emailInEmployers != null && emailInEmployers > 0) ||
                    (emailInFreelancers != null && emailInFreelancers > 0) ||
                    (emailInAdmins != null && emailInAdmins > 0)) {
                response.put("success", false);
                response.put("field", "email");
                response.put("message",
                        "Email này đã được đăng ký trên hệ thống. Vui lòng dùng email khác hoặc đăng nhập đúng vai trò!");
                return ResponseEntity.badRequest().body(response);
            }

            
            if (phone != null && !phone.trim().isEmpty()) {
                Integer phoneCount = authService.countBy(table, "phone", phone);
                if (phoneCount != null && phoneCount > 0) {
                    response.put("success", false);
                    response.put("field", "phone");
                    response.put("message", "Số điện thoại này đã được sử dụng. Vui lòng nhập số khác!");
                    return ResponseEntity.badRequest().body(response);
                }
            }

            
            if (displayName != null && !displayName.trim().isEmpty()) {
                Integer displayNameCount = authService.countBy(table, "display_name", displayName);
                if (displayNameCount != null && displayNameCount > 0) {
                    response.put("success", false);
                    response.put("field", "displayName");
                    response.put("message", "Tên hiển thị này đã được người khác sử dụng. Vui lòng chọn tên khác!");
                    return ResponseEntity.badRequest().body(response);
                }
            }

            
            Map<String, String> registerPayload = new HashMap<>();
            registerPayload.put("email", email);
            registerPayload.put("name", fullName != null ? fullName : email.split("@")[0]);
            registerPayload.put("fullName", fullName != null ? fullName : email.split("@")[0]);
            registerPayload.put("displayName",
            displayName != null ? displayName : (fullName != null ? fullName : email.split("@")[0]));
            registerPayload.put("phone", phone);
            registerPayload.put("password", password);
            registerPayload.put("requestedRole", role);
            registerPayload.put("googleId", null);
            registerPayload.put("isRegistration", "true");

            Map<String, Object> result = authService.login(registerPayload);
            if ((Boolean) result.getOrDefault("success", false)) {
                response.put("success", true);
                response.put("message", "Đăng ký thành công! Bạn có thể đăng nhập ngay.");
            } else {
                response.put("success", false);
                response.put("message", result.getOrDefault("message", "Đăng ký thất bại!"));
            }
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Lỗi server: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    
    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, Object>> forgotPassword(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        Map<String, Object> response = new HashMap<>();

        if (email == null || email.trim().isEmpty()) {
            response.put("success", false);
            response.put("message", "Email is required");
            return ResponseEntity.badRequest().body(response);
        }

        String code = String.format("%06d", (int) (Math.random() * 1000000));
        verificationCodes.put(email, code);
        codeTimestamps.put(email, System.currentTimeMillis());
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("[LancerPro] Mã xác nhận đặt lại mật khẩu");

        String emailContent = "Chào bạn,\n\n"
                + "Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản tại LancerPro.\n\n"
                + "Mã xác nhận của bạn là: " + code + "\n\n"
                + "Mã này có hiệu lực trong vòng 60 giây. Nếu bạn không yêu cầu hành động này, vui lòng bỏ qua email này.\n\n"
                + "Trân trọng,\n"
                + "Đội ngũ LancerPro";

        message.setText(emailContent);
        mailSender.send(message);

        response.put("success", true);
        response.put("message", "Mã xác nhận đã được gửi về email của bạn!");
        return ResponseEntity.ok(response);
    }

    
    @PostMapping("/verify-code")
    public ResponseEntity<Map<String, Object>> verifyCode(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String code = payload.get("code");
        Map<String, Object> response = new HashMap<>();

        
        Long timestamp = codeTimestamps.get(email);
        if (timestamp == null || System.currentTimeMillis() - timestamp > 60000) {
            response.put("success", false);
            response.put("message", "Mã xác nhận đã hết hạn (chỉ có hiệu lực trong 60 giây)!");
            return ResponseEntity.badRequest().body(response);
        }

        String savedCode = verificationCodes.get(email);
        if (savedCode != null && savedCode.equals(code)) {
            verificationCodes.remove(email);
            codeTimestamps.remove(email);
            verifiedForReset.put(email, true);
            response.put("success", true);
            response.put("message", "Xác nhận mã thành công! Vui lòng nhập mật khẩu mới.");
            return ResponseEntity.ok(response);
        } else {
            response.put("success", false);
            response.put("message", "Mã xác nhận không chính xác!");
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, Object>> resetPassword(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String newPassword = payload.get("newPassword");
        Map<String, Object> response = new HashMap<>();

        if (email == null || newPassword == null || newPassword.trim().isEmpty()) {
            response.put("success", false);
            response.put("message", "Dữ liệu không hợp lệ!");
            return ResponseEntity.badRequest().body(response);
        }

        if (!verifiedForReset.getOrDefault(email, false)) {
            response.put("success", false);
            response.put("message", "Vui lòng xác thực OTP trước khi đặt lại mật khẩu!");
            return ResponseEntity.badRequest().body(response);
        }

        boolean success = authService.resetPassword(email, newPassword);
        if (success) {
            verifiedForReset.remove(email);
            response.put("success", true);
            response.put("message", "Đổi mật khẩu thành công! Bạn có thể đăng nhập ngay.");
            return ResponseEntity.ok(response);
        } else {
            response.put("success", false);
            response.put("message", "Tài khoản không tồn tại hoặc có lỗi xảy ra!");
            return ResponseEntity.badRequest().body(response);
        }
    }
    @PostMapping("/set-messenger-pin")
    public ResponseEntity<Map<String, Object>> setMessengerPin(@RequestBody Map<String, Object> payload) {
        Integer userId = (Integer) payload.get("userId");
        String role = (String) payload.get("role");
        String pin = (String) payload.get("pin");

        Map<String, Object> response = new HashMap<>();
        if (userId == null || role == null || pin == null || pin.length() != 4) {
            response.put("success", false);
            response.put("message", "Dữ liệu không hợp lệ.");
            return ResponseEntity.badRequest().body(response);
        }

        boolean success = authService.setMessengerPin(userId, role, pin);
        if (success) {
            tempPinUsers.remove(role.toUpperCase() + ":" + userId);
        }
        response.put("success", success);
        response.put("message", success ? "Cài đặt mã PIN thành công." : "Có lỗi xảy ra.");
        return ResponseEntity.ok(response);
    }

    // API: POST /api/auth/verify-messenger-pin
    @PostMapping("/verify-messenger-pin")
    public ResponseEntity<Map<String, Object>> verifyMessengerPin(@RequestBody Map<String, Object> payload) {
        Integer userId = (Integer) payload.get("userId");
        String role = (String) payload.get("role");
        String pin = (String) payload.get("pin");

        Map<String, Object> response = new HashMap<>();
        if (userId == null || role == null || pin == null) {
            response.put("success", false);
            response.put("message", "Dữ liệu không hợp lệ.");
            return ResponseEntity.badRequest().body(response);
        }

        boolean isValid = authService.verifyMessengerPin(userId, role, pin);
        response.put("success", isValid);
        response.put("message", isValid ? "Mã PIN chính xác." : "Mã PIN không khớp.");

        if (!isValid) {
            return ResponseEntity.badRequest().body(response);
        }

        String key = role.toUpperCase() + ":" + userId;
        if (tempPinUsers.getOrDefault(key, false)) {
            response.put("isTemporary", true);
        }

        return ResponseEntity.ok(response);
    }

    // API: POST /api/auth/forgot-messenger-pin
    @PostMapping("/forgot-messenger-pin")
    public ResponseEntity<Map<String, Object>> forgotMessengerPin(@RequestBody Map<String, Object> payload) {
        Integer userId = (Integer) payload.get("userId");
        String role = (String) payload.get("role");

        Map<String, Object> response = new HashMap<>();
        if (userId == null || role == null) {
            response.put("success", false);
            response.put("message", "Dữ liệu không hợp lệ.");
            return ResponseEntity.badRequest().body(response);
        }

        try {
            String resetEmail = authService.resetAndEmailMessengerPin(userId, role, mailSender);
            if (resetEmail != null) {
                tempPinUsers.put(role.toUpperCase() + ":" + userId, true);
                response.put("success", true);
                response.put("message", "Mã PIN mới đã được gửi về email: " + resetEmail);
            } else {
                response.put("success", false);
                response.put("message", "Không thể gửi email đặt lại mã PIN.");
            }
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/invitation/verify")
    public ResponseEntity<Map<String, Object>> verifyInvitation(@RequestParam("token") String token) {
        return ResponseEntity.ok(authService.verifyInvitationToken(token));
    }

    @PostMapping("/invitation/send-code")
    public ResponseEntity<Map<String, Object>> sendInvitationCode(@RequestBody(required = false) Map<String, String> body, 
                                                                  @RequestParam(value = "token", required = false) String paramToken) {
        String token = paramToken;
        if (token == null && body != null) {
            token = body.get("token");
        }
        return ResponseEntity.ok(authService.sendInvitationVerificationCode(token));
    }

    @PostMapping("/invitation/accept")
    public ResponseEntity<Map<String, Object>> acceptInvitation(@RequestBody Map<String, String> payload) {
        return ResponseEntity.ok(authService.acceptInvitation(payload));
    }
}
