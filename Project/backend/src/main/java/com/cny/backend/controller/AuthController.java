package com.cny.backend.controller;

import com.cny.backend.service.AuthService;
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

    // Lưu trữ tạm thời mã xác nhận và timestamp (dùng bộ nhớ tạm, không lưu DB)
    private final Map<String, String> verificationCodes = new ConcurrentHashMap<>();
    private final Map<String, Long> codeTimestamps = new ConcurrentHashMap<>();

    // ==========================================
    // ĐĂNG NHẬP (Hỗ trợ Google OAuth & Email)
    // ==========================================
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

    // ==========================================
    // ĐĂNG KÝ TÀI KHOẢN MỚI (Email/Password)
    // ==========================================
    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody Map<String, String> payload) {
        String email     = payload.get("email");
        String password  = payload.get("password");
        String name      = payload.get("name");
        String role      = payload.getOrDefault("requestedRole", "FREELANCER").toUpperCase();

        Map<String, Object> response = new HashMap<>();

        if (email == null || email.trim().isEmpty()) {
            response.put("success", false);
            response.put("message", "Email không được để trống!");
            return ResponseEntity.badRequest().body(response);
        }

        try {
            // Dùng lại AuthService.login() để tự động tạo tài khoản theo role
            // (AuthService tự INSERT nếu email chưa tồn tại trong bảng tương ứng)
            Map<String, String> loginPayload = new HashMap<>();
            loginPayload.put("email", email);
            loginPayload.put("name", name != null ? name : email.split("@")[0]);
            loginPayload.put("password", password);
            loginPayload.put("requestedRole", role);
            loginPayload.put("googleId", null); // Đăng ký bằng email nên không có googleId

            Map<String, Object> result = authService.login(loginPayload);
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

    // ==========================================
    // QUÊN MẬT KHẨU - Gửi mã OTP về Email
    // ==========================================
    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, Object>> forgotPassword(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        Map<String, Object> response = new HashMap<>();

        if (email == null || email.trim().isEmpty()) {
            response.put("success", false);
            response.put("message", "Email is required");
            return ResponseEntity.badRequest().body(response);
        }

        // Tạo mã OTP 6 chữ số ngẫu nhiên
        String code = String.format("%06d", (int)(Math.random() * 1000000));
        verificationCodes.put(email, code);
        codeTimestamps.put(email, System.currentTimeMillis());

        // Soạn và gửi email
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

    // ==========================================
    // XÁC NHẬN MÃ OTP
    // ==========================================
    @PostMapping("/verify-code")
    public ResponseEntity<Map<String, Object>> verifyCode(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String code = payload.get("code");
        Map<String, Object> response = new HashMap<>();

        // Kiểm tra mã đã hết hạn chưa (60 giây)
        Long timestamp = codeTimestamps.get(email);
        if (timestamp == null || System.currentTimeMillis() - timestamp > 60000) {
            response.put("success", false);
            response.put("message", "Mã xác nhận đã hết hạn (chỉ có hiệu lực trong 60 giây)!");
            return ResponseEntity.badRequest().body(response);
        }

        // Kiểm tra mã có đúng không
        String savedCode = verificationCodes.get(email);
        if (savedCode != null && savedCode.equals(code)) {
            // Xóa mã sau khi xác nhận thành công
            verificationCodes.remove(email);
            codeTimestamps.remove(email);
            response.put("success", true);
            response.put("message", "Xác nhận mã thành công!");
            return ResponseEntity.ok(response);
        } else {
            response.put("success", false);
            response.put("message", "Mã xác nhận không chính xác!");
            return ResponseEntity.badRequest().body(response);
        }
    }
}
