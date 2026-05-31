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

    // Lưu trữ tạm thời các email đã xác thực OTP thành công để cho phép đặt lại mật khẩu
    private final Map<String, Boolean> verifiedForReset = new ConcurrentHashMap<>();


    // Lưu trữ tạm thời danh sách các user sử dụng mã PIN tạm thời của hệ thống cấp
    private final Map<String, Boolean> tempPinUsers = new ConcurrentHashMap<>();

    // ==========================================
    // ĐĂNG NHẬP (Hỗ trợ Google OAuth & Email)
    // ==========================================
    // API: POST /api/auth/login
    // Nhận request đăng nhập (cả Mật khẩu và Google) từ Client.
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> payload) {
        // Đẩy toàn bộ dữ liệu (email, password, googleId, role...) xuống AuthService xử lý.
        Map<String, Object> response = authService.login(payload);
        
        // Kiểm tra kết quả trả về từ Service
        if (response.containsKey("success") && !(Boolean) response.get("success")) {
            // Nếu tài khoản bị khóa (BANNED/LOCKED) -> Trả về mã lỗi 403 (Forbidden)
            if (response.containsKey("accountStatus")) {
                return ResponseEntity.status(403).body(response);
            }
            // Lỗi bình thường (Sai mật khẩu, tài khoản không tồn tại) -> Trả về mã lỗi 400 (Bad Request)
            return ResponseEntity.badRequest().body(response);
        }
        // Thành công -> Trả về mã 200 OK kèm thông tin User
        return ResponseEntity.ok(response);
    }

    // ==========================================
    // ĐĂNG KÝ TÀI KHOẢN MỚI (Email/Password)
    // ==========================================
    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody Map<String, String> payload) {
        String email       = payload.get("email");
        String password    = payload.get("password");
        String fullName    = payload.get("name");
        String displayName = payload.get("displayName");
        String phone       = payload.get("phone");
        String role        = payload.getOrDefault("requestedRole", "FREELANCER").toUpperCase();

        Map<String, Object> response = new HashMap<>();

        // 1. Validate bắt buộc
        if (email == null || email.trim().isEmpty()) {
            response.put("success", false);
            response.put("message", "Email không được để trống!");
            return ResponseEntity.badRequest().body(response);
        }

        // 2. Kiểm tra trùng lặp (Validate dưới Database)
        try {
            String table        = role.equals("EMPLOYER") ? "employers" : "freelancers";
            String idColumn     = role.equals("EMPLOYER") ? "employer_id"  : "freelancer_id";

            // KIỂM TRA 1: Email đã tồn tại ở BẤT KỲ bảng nào chưa (Admin, Employer, Freelancer)
            // Luật hệ thống: 1 Email chỉ được chọn 1 vai trò duy nhất suốt đời.
            Integer emailInEmployers = authService.countBy("employers", "email", email);
            Integer emailInFreelancers = authService.countBy("freelancers", "email", email);
            Integer emailInAdmins = authService.countBy("admins", "email", email);
            
            if ((emailInEmployers != null && emailInEmployers > 0) || 
                (emailInFreelancers != null && emailInFreelancers > 0) ||
                (emailInAdmins != null && emailInAdmins > 0)) {
                response.put("success", false);
                response.put("field",   "email"); // Trả về biến "field" để báo cho Frontend biết chính xác ô input nào bị lỗi
                response.put("message", "Email này đã được đăng ký trên hệ thống. Vui lòng dùng email khác hoặc đăng nhập đúng vai trò!");
                return ResponseEntity.badRequest().body(response);
            }

            // KIỂM TRA 2: Số điện thoại đã được dùng chưa (Chỉ check trong bảng của Role đang đăng ký)
            if (phone != null && !phone.trim().isEmpty()) {
                Integer phoneCount = authService.countBy(table, "phone", phone);
                if (phoneCount != null && phoneCount > 0) {
                    response.put("success", false);
                    response.put("field",   "phone"); // Báo lỗi ô input Số điện thoại
                    response.put("message", "Số điện thoại này đã được sử dụng. Vui lòng nhập số khác!");
                    return ResponseEntity.badRequest().body(response);
                }
            }

            // KIỂM TRA 3: Tên hiển thị (Nickname) có bị trùng không
            if (displayName != null && !displayName.trim().isEmpty()) {
                Integer displayNameCount = authService.countBy(table, "display_name", displayName);
                if (displayNameCount != null && displayNameCount > 0) {
                    response.put("success", false);
                    response.put("field",   "displayName"); // Báo lỗi ô input Tên hiển thị
                    response.put("message", "Tên hiển thị này đã được người khác sử dụng. Vui lòng chọn tên khác!");
                    return ResponseEntity.badRequest().body(response);
                }
            }

            // 3. Nếu vượt qua mọi bài kiểm tra ở trên -> Tiến hành lưu tài khoản.
            // THỦ THUẬT: Đóng gói lại dữ liệu và ném cho hàm `login` của AuthService xử lý.
            Map<String, String> registerPayload = new HashMap<>();
            registerPayload.put("email",         email);
            registerPayload.put("name",          fullName != null ? fullName : email.split("@")[0]); // Nếu ko có tên, lấy phần trước @ của email
            registerPayload.put("fullName",      fullName != null ? fullName : email.split("@")[0]);
            registerPayload.put("displayName",   displayName != null ? displayName : (fullName != null ? fullName : email.split("@")[0]));
            registerPayload.put("phone",         phone);
            registerPayload.put("password",      password);
            registerPayload.put("requestedRole", role);
            registerPayload.put("googleId",      null);
            registerPayload.put("isRegistration", "true"); // Quan trọng: Đánh dấu cờ này = true để báo cho hàm login biết đây là "Đăng ký mới" chứ ko phải "Đăng nhập".

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

        // BƯỚC 1: Kiểm tra mã OTP đã hết hạn chưa (Chỉ cho sống tối đa 60 giây)
        Long timestamp = codeTimestamps.get(email);
        // System.currentTimeMillis() lấy thời gian hiện tại trừ đi thời gian lúc cấp OTP. Nếu lớn hơn 60000 mili-giây (60 giây) thì báo hết hạn.
        if (timestamp == null || System.currentTimeMillis() - timestamp > 60000) {
            response.put("success", false);
            response.put("message", "Mã xác nhận đã hết hạn (chỉ có hiệu lực trong 60 giây)!");
            return ResponseEntity.badRequest().body(response);
        }

        // BƯỚC 2: Kiểm tra nội dung mã OTP có khớp với mã hệ thống đã sinh ra không
        String savedCode = verificationCodes.get(email);
        if (savedCode != null && savedCode.equals(code)) {
            // NẾU ĐÚNG: BẮT BUỘC phải xóa mã đi ngay lập tức. Điều này ngăn chặn hacker sử dụng lại mã OTP này nhiều lần (Replay Attack).
            verificationCodes.remove(email);
            codeTimestamps.remove(email);
            verifiedForReset.put(email, true); // Cho phép đặt lại mật khẩu
            response.put("success", true);
            response.put("message", "Xác nhận mã thành công! Vui lòng nhập mật khẩu mới.");
            return ResponseEntity.ok(response);
        } else {
            response.put("success", false);
            response.put("message", "Mã xác nhận không chính xác!");
            return ResponseEntity.badRequest().body(response);
        }
    }

    // ==========================================
    // ĐẶT LẠI MẬT KHẨU MỚI (Sau khi xác nhận OTP thành công)
    // ==========================================
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

        // Kiểm tra xem email này đã xác thực OTP thành công chưa
        if (!verifiedForReset.getOrDefault(email, false)) {
            response.put("success", false);
            response.put("message", "Vui lòng xác thực OTP trước khi đặt lại mật khẩu!");
            return ResponseEntity.badRequest().body(response);
        }

        // Đổi mật khẩu
        boolean success = authService.resetPassword(email, newPassword);
        if (success) {
            verifiedForReset.remove(email); // Xóa quyền sau khi đổi thành công
            response.put("success", true);
            response.put("message", "Đổi mật khẩu thành công! Bạn có thể đăng nhập ngay.");
            return ResponseEntity.ok(response);
        } else {
            response.put("success", false);
            response.put("message", "Tài khoản không tồn tại hoặc có lỗi xảy ra!");
            return ResponseEntity.badRequest().body(response);
        }
    }


    // ==========================================
    // MESSENGER PIN (Bảo mật 2 lớp cho Tin nhắn)
    // ==========================================
    
    // API: POST /api/auth/set-messenger-pin
    // Người dùng thiết lập mã PIN 4 số lần đầu hoặc đổi mã PIN mới
    @PostMapping("/set-messenger-pin")
    public ResponseEntity<Map<String, Object>> setMessengerPin(@RequestBody Map<String, Object> payload) {
        Integer userId = (Integer) payload.get("userId");
        String role = (String) payload.get("role");
        String pin = (String) payload.get("pin");
        
        Map<String, Object> response = new HashMap<>();
        // Validate: Mã PIN bắt buộc phải đủ 4 ký tự (ví dụ: "1234")
        if (userId == null || role == null || pin == null || pin.length() != 4) {
            response.put("success", false);
            response.put("message", "Dữ liệu không hợp lệ.");
            return ResponseEntity.badRequest().body(response);
        }
        
        boolean success = authService.setMessengerPin(userId, role, pin);
        if (success) {
            // Nếu set thành công, xóa user này khỏi danh sách "đang dùng PIN tạm" (nếu có)
            tempPinUsers.remove(role.toUpperCase() + ":" + userId);
        }
        response.put("success", success);
        response.put("message", success ? "Cài đặt mã PIN thành công." : "Có lỗi xảy ra.");
        return ResponseEntity.ok(response);
    }

    // API: POST /api/auth/verify-messenger-pin
    // Mỗi khi người dùng bấm vào biểu tượng Chat, Frontend sẽ gọi API này để hỏi xem PIN nhập vào có đúng không
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
        
        // Gọi xuống DB so sánh PIN đã băm/lưu
        boolean isValid = authService.verifyMessengerPin(userId, role, pin);
        response.put("success", isValid);
        response.put("message", isValid ? "Mã PIN chính xác." : "Mã PIN không khớp.");
        
        if (!isValid) {
            return ResponseEntity.badRequest().body(response);
        }
        
        // Logic phụ: Kiểm tra xem mã PIN này có phải là mã tạm thời (do hệ thống tự cấp qua email lúc quên PIN) hay không.
        // Nếu đúng là mã tạm, báo cho Frontend biết (isTemporary = true) để Frontend ép người dùng phải tạo mã PIN mới ngay lập tức.
        String key = role.toUpperCase() + ":" + userId;
        if (tempPinUsers.getOrDefault(key, false)) {
            response.put("isTemporary", true);
        }
        
        return ResponseEntity.ok(response);
    }

    // API: POST /api/auth/forgot-messenger-pin
    // Khách hàng quên PIN chat, yêu cầu gửi 1 mã PIN ngẫu nhiên về email
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
        
        String resetEmail = authService.resetAndEmailMessengerPin(userId, role, mailSender);
        if (resetEmail != null) {
            // Đánh dấu user này đang sử dụng mã PIN tạm thời của hệ thống
            tempPinUsers.put(role.toUpperCase() + ":" + userId, true);
            response.put("success", true);
            response.put("message", "Mã PIN mới đã được gửi về email: " + resetEmail);
        } else {
            response.put("success", false);
            response.put("message", "Không thể gửi email đặt lại mã PIN.");
        }
        return ResponseEntity.ok(response);
    }
}
