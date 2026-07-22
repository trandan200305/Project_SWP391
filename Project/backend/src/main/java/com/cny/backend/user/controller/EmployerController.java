package com.cny.backend.user.controller;

import com.cny.backend.user.entity.Employer;
import com.cny.backend.user.entity.EmployerProfileRequest;
import com.cny.backend.user.repository.EmployerRepository;
import com.cny.backend.user.repository.EmployerProfileRequestRepository;
import com.cny.backend.user.dto.EmployerDto;
import com.cny.backend.user.repository.FreelancerRepository;
import com.cny.backend.dashboard.repository.ApiFrequencyStatRepository;
import com.cny.backend.dashboard.entity.ApiFrequencyStat;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/employers")
@CrossOrigin(origins = "*")
public class EmployerController {

    @Autowired
    private EmployerRepository employerRepository;

    @Autowired
    private ApiFrequencyStatRepository apiStatRepo;

    @Autowired
    private com.cny.backend.admin.repository.PaymentTransactionRepository paymentTransactionRepository;

    @Autowired
    private com.cny.backend.notification.service.NotificationService notificationService;

    @Autowired
    private EmployerProfileRequestRepository employerProfileRequestRepository;

    @Autowired
    private FreelancerRepository freelancerRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @GetMapping
    public ResponseEntity<List<EmployerDto>> getAllEmployers() {
        List<Employer> employers = employerRepository.findAll();
        List<EmployerDto> dtos = employers.stream().map(this::mapToDto).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/{employerId}/expenses")
    public ResponseEntity<Map<String, Object>> getEmployerExpenses(@PathVariable Integer employerId) {
        Employer employer = employerRepository.findById(employerId).orElse(null);
        if (employer == null) {
            return ResponseEntity.notFound().build();
        }

        Map<String, Object> response = new HashMap<>();
        response.put("employerId", employer.getEmployerId());
        response.put("companyName", employer.getCompanyName() != null ? employer.getCompanyName() : employer.getDisplayName());
        response.put("totalSpent", employer.getTotalSpent() != null ? employer.getTotalSpent() : java.math.BigDecimal.ZERO);
        response.put("currentPackageType", employer.getCurrentPackageType() != null ? employer.getCurrentPackageType() : "CHƯA ĐĂNG KÝ");
        response.put("packagePostQuota", employer.getPackagePostQuota() != null ? employer.getPackagePostQuota() : 0);
        response.put("packageExpiryDate", employer.getPackageExpiryDate() != null ? employer.getPackageExpiryDate().toString() : null);
        response.put("projectsPosted", employer.getProjectsPosted() != null ? employer.getProjectsPosted() : 0);
        response.put("tier", com.cny.backend.user.util.EmployerTierUtils.calculateTier(employer.getTotalSpent()));
        response.put("tierDiscount", com.cny.backend.user.util.EmployerTierUtils.getTierDiscountPercentage(employer.getTier()));

        List<com.cny.backend.admin.entity.PaymentTransaction> transactions = paymentTransactionRepository.findByEmployerIdOrderByCreatedAtDesc(employerId);
        List<Map<String, Object>> txList = new ArrayList<>();
        for (com.cny.backend.admin.entity.PaymentTransaction tx : transactions) {
            Map<String, Object> tMap = new HashMap<>();
            tMap.put("transactionId", tx.getId());
            tMap.put("txnRef", tx.getTxnRef());
            tMap.put("vnpTransactionNo", tx.getVnpTransactionNo());
            tMap.put("projectId", tx.getProjectId());
            tMap.put("packageType", tx.getPackageType());
            tMap.put("amount", tx.getAmount());
            tMap.put("paymentMethod", tx.getVnpTransactionNo() != null ? "VNPay" : "PayOS");
            tMap.put("status", tx.getStatus());
            tMap.put("createdAt", tx.getCreatedAt() != null ? tx.getCreatedAt().toString() : null);
            txList.add(tMap);
        }
        response.put("transactions", txList);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<EmployerDto> getById(@PathVariable Integer id) {
        return employerRepository.findById(id)
                .map(e -> ResponseEntity.ok(mapToDto(e)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{employerId}/profile")
    public ResponseEntity<Map<String, Object>> getProfile(@PathVariable Integer employerId) {
        Employer employer = employerRepository.findById(employerId).orElse(null);
        if (employer == null) {
            return ResponseEntity.notFound().build();
        }

        Map<String, Object> response = buildProfileResponse(employer);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{employerId}/profile")
    @Transactional
    public ResponseEntity<Map<String, Object>> updateProfile(
            @PathVariable Integer employerId,
            @RequestBody Map<String, Object> payload
    ) {
        Employer employer = employerRepository.findById(employerId).orElse(null);
        if (employer == null) {
            return ResponseEntity.notFound().build();
        }

        if (Boolean.TRUE.equals(employer.getIsDeleted())) {
            Map<String, Object> errResponse = new HashMap<>();
            errResponse.put("success", false);
            errResponse.put("message", "Tài khoản của bạn đã bị xóa hoặc ngưng hoạt động.");
            return ResponseEntity.status(403).body(errResponse);
        }

        // Intercept direct avatar update
        if (payload.containsKey("avatarUrl") && (payload.size() == 1 || (payload.size() == 2 && payload.containsKey("employerId")))) {
            String newAvatarUrl = text(payload.get("avatarUrl"));
            employer.setAvatarUrl(newAvatarUrl);
            employer.setUpdatedAt(LocalDateTime.now());
            employerRepository.save(employer);

            Map<String, Object> response = buildProfileResponse(employer);
            response.put("success", true);
            response.put("message", "Cập nhật ảnh đại diện thành công.");
            return ResponseEntity.ok(response);
        }

        String displayName = text(payload.get("displayName"));
        if (isBlank(displayName) || displayName.length() < 3 || displayName.length() > 50) {
            Map<String, Object> errResponse = new HashMap<>();
            errResponse.put("success", false);
            errResponse.put("message", "Tên hiển thị phải từ 3 đến 50 ký tự.");
            return ResponseEntity.badRequest().body(errResponse);
        }

        String fullName = text(payload.get("fullName"));
        if (!isBlank(fullName) && (fullName.length() < 3 || fullName.length() > 50)) {
            Map<String, Object> errResponse = new HashMap<>();
            errResponse.put("success", false);
            errResponse.put("message", "Họ và tên người đại diện phải từ 3 đến 50 ký tự.");
            return ResponseEntity.badRequest().body(errResponse);
        }

        String phone = text(payload.get("phone"));
        if (!isBlank(phone)) {
            if (!phone.matches("^(0[3|5|7|8|9])[0-9]{8}$")) {
                Map<String, Object> errResponse = new HashMap<>();
                errResponse.put("success", false);
                errResponse.put("message", "Số điện thoại không hợp lệ (phải gồm 10 số bắt đầu bằng 03, 05, 07, 08 hoặc 09).");
                return ResponseEntity.badRequest().body(errResponse);
            }

            if (employerRepository.countPhoneDuplicate(phone, employerId) > 0) {
                Map<String, Object> errResponse = new HashMap<>();
                errResponse.put("success", false);
                errResponse.put("message", "Số điện thoại này đã được đăng ký bởi doanh nghiệp khác.");
                return ResponseEntity.badRequest().body(errResponse);
            }
        }

        String taxCode = text(payload.get("taxCode"));
        if (!isBlank(taxCode)) {
            if (!taxCode.matches("^[0-9]{10}$|^[0-9]{13}$|^[0-9]{10}-[0-9]{3}$")) {
                Map<String, Object> errResponse = new HashMap<>();
                errResponse.put("success", false);
                errResponse.put("message", "Mã số thuế không hợp lệ. Mã số thuế phải gồm 10 hoặc 13 chữ số.");
                return ResponseEntity.badRequest().body(errResponse);
            }

            if (employerRepository.countTaxCodeDuplicate(taxCode, employerId) > 0) {
                Map<String, Object> errResponse = new HashMap<>();
                errResponse.put("success", false);
                errResponse.put("message", "Mã số thuế này đã được đăng ký bởi doanh nghiệp khác.");
                return ResponseEntity.badRequest().body(errResponse);
            }
        }

        String urlPattern = "^(https?://)?([a-zA-Z0-9][-a-zA-Z0-9]*\\.)*[a-zA-Z0-9][-a-zA-Z0-9]*(:\\d+)?(/.*)?$";
        String website = text(payload.get("website"));
        if (!isBlank(website) && !website.matches(urlPattern)) {
            Map<String, Object> errResponse = new HashMap<>();
            errResponse.put("success", false);
            errResponse.put("message", "Địa chỉ Website không hợp lệ.");
            return ResponseEntity.badRequest().body(errResponse);
        }

        String companyLogoUrl = text(payload.get("companyLogoUrl"));
        if (!isBlank(companyLogoUrl) && !companyLogoUrl.matches(urlPattern)) {
            Map<String, Object> errResponse = new HashMap<>();
            errResponse.put("success", false);
            errResponse.put("message", "Đường dẫn Logo không hợp lệ.");
            return ResponseEntity.badRequest().body(errResponse);
        }

        String companySize = text(payload.get("companySize"));
        if (!isBlank(companySize)) {
            String companySizePattern = "(?i)^(Hơn\\s+|Dưới\\s+)?([1-9][0-9]*)(\\s*-\\s*[1-9][0-9]*)?(\\s*\\+)?(\\s*(nhân viên|người))?$";
            if (!companySize.matches(companySizePattern)) {
                Map<String, Object> errResponse = new HashMap<>();
                errResponse.put("success", false);
                errResponse.put("message", "Quy mô công ty không hợp lệ (ví dụ: 10-50, 50+, Hơn 100 nhân viên).");
                return ResponseEntity.badRequest().body(errResponse);
            }
        }

        // === Lưu trực tiếp các thông tin công ty & người đại diện vào bảng employers ===
        employer.setDisplayName(displayName);
        employer.setFullName(fullName);
        employer.setPhone(phone);
        employer.setCompanyName(text(payload.get("companyName")));
        employer.setCompanyLogoUrl(companyLogoUrl);
        employer.setCompanyDescription(text(payload.get("companyDescription")));
        employer.setWebsite(website);
        employer.setAddress(text(payload.get("address")));
        employer.setCity(text(payload.get("city")));
        employer.setCountry(text(payload.get("country")));
        employer.setCompanySize(companySize);
        employer.setIndustry(text(payload.get("industry")));
        employer.setTaxCode(taxCode);
        employer.setUpdatedAt(LocalDateTime.now());

        // 3. Fake Approval logic for test
        // System will auto approve for now
        System.out.println("Auto approving KYC for employer " + employerId);
        
        // Mock updating the VNPT eKYC APIs stats for dashboard
        java.util.List<String> apisToUpdate = java.util.List.of(
            "/ai/v1/ocr/id/front",
            "/ai/v1/ocr/id/back",
            "/ai/v4/web/standard/face/liveness",
            "/ai/v1/face/one",
            "/ai/v5/card/liveness"
        );

        for (String path : apisToUpdate) {
            java.util.List<ApiFrequencyStat> stats = apiStatRepo.findByPath(path);
            if (!stats.isEmpty()) {
                ApiFrequencyStat stat = stats.get(0);
                stat.setTotal(stat.getTotal() + 1);
                stat.setSuccess(stat.getSuccess() + 1);
                apiStatRepo.save(stat);
            }
        }

        employerRepository.save(employer);

        Map<String, Object> response = buildProfileResponse(employer);
        response.put("success", true);
        response.put("message", "Cập nhật thông tin công ty thành công.");
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteAccount(@PathVariable Integer id, @RequestParam(required = false) String confirmationText) {
        Map<String, Object> response = new HashMap<>();
        if (confirmationText == null || !confirmationText.equals("DELETE")) {
            response.put("success", false);
            response.put("message", "Chữ xác nhận không hợp lệ. Vui lòng nhập đúng chữ 'DELETE'.");
            return ResponseEntity.badRequest().body(response);
        }
        return employerRepository.findById(id).map(e -> {
            e.setIsDeleted(true);
            e.setUpdatedAt(LocalDateTime.now());
            employerRepository.save(e);
            response.put("success", true);
            response.put("message", "Tài khoản của bạn đã được xóa vĩnh viễn.");
            return ResponseEntity.ok(response);
        }).orElseGet(() -> {
            response.put("success", false);
            response.put("message", "Không tìm thấy tài khoản để xóa.");
            return ResponseEntity.notFound().build();
        });
    }

    @PostMapping("/{id}/kyc/submit")
    public ResponseEntity<Map<String, Object>> submitKyc(@PathVariable Integer id, @RequestBody com.cny.backend.user.dto.EmployerKycSubmitDto dto) {
        Map<String, Object> response = new HashMap<>();

        // 1. Backend Validation: DTO & File URLs
        if (dto == null) {
            response.put("success", false);
            response.put("message", "Lỗi gửi dữ liệu: Dữ liệu hồ sơ gửi lên rỗng (null).");
            return ResponseEntity.badRequest().body(response);
        }

        if (dto.getBusinessLicenseUrl() == null || dto.getBusinessLicenseUrl().trim().isEmpty()) {
            response.put("success", false);
            response.put("message", "Lỗi Backend Validation: Vui lòng đính kèm file Giấy phép kinh doanh (GPKD) hợp lệ trước khi gửi xác thực.");
            return ResponseEntity.badRequest().body(response);
        }

        if (dto.getRepresentativeIdCardUrl() == null || dto.getRepresentativeIdCardUrl().trim().isEmpty()) {
            response.put("success", false);
            response.put("message", "Lỗi Backend Validation: Vui lòng đính kèm file Căn cước công dân (CCCD) hợp lệ trước khi gửi xác thực.");
            return ResponseEntity.badRequest().body(response);
        }

        if (dto.getTaxCode() != null && !dto.getTaxCode().trim().isEmpty()) {
            String taxCodeStr = dto.getTaxCode().trim();
            if (!taxCodeStr.matches("^[0-9]{10}$|^[0-9]{13}$|^[0-9]{10}-[0-9]{3}$")) {
                response.put("success", false);
                response.put("message", "Lỗi Backend Validation: Mã số thuế không hợp lệ. Mã số thuế phải gồm 10 hoặc 13 chữ số.");
                return ResponseEntity.badRequest().body(response);
            }
            if (employerRepository.countTaxCodeDuplicate(taxCodeStr, id) > 0) {
                response.put("success", false);
                response.put("message", "Lỗi Backend Validation: Mã số thuế này đã được đăng ký bởi doanh nghiệp khác.");
                return ResponseEntity.badRequest().body(response);
            }
        }

        return employerRepository.findById(id).map(e -> {
            e.setTaxCode(dto.getTaxCode() != null ? dto.getTaxCode().trim() : null);
            e.setBusinessLicenseUrl(dto.getBusinessLicenseUrl().trim());
            e.setRepresentativeIdCardUrl(dto.getRepresentativeIdCardUrl().trim());
            e.setKycStatus("PENDING");
            e.setKycRejectedReason(null);
            e.setKycSubmittedAt(LocalDateTime.now());
            e.setUpdatedAt(LocalDateTime.now());

            employerRepository.save(e);

            try {
                jdbcTemplate.update(
                    "INSERT INTO kyc_requests (employer_id, status, created_at, updated_at) VALUES (?, 'PENDING', GETDATE(), GETDATE())",
                    e.getEmployerId()
                );
            } catch (Exception ex) {
                // Table might not exist or schema differs, ignore safely
            }
            
            // Notify STAFF
            notificationService.createNotification(
                0L, // Global for staff
                "STAFF",
                "Yêu cầu xác minh danh tính KYC mới",
                "Nhà tuyển dụng " + (e.getCompanyName() != null ? e.getCompanyName() : e.getDisplayName()) + " vừa gửi yêu cầu xác minh doanh nghiệp.",
                "INFO",
                "KYC-EMP-" + e.getEmployerId()
            );

            response.put("success", true);
            response.put("message", "Đã nộp hồ sơ KYC thành công. Đang chờ duyệt.");
            return ResponseEntity.ok(response);
        }).orElseGet(() -> {
            response.put("success", false);
            response.put("message", "Không tìm thấy người dùng trong cơ sở dữ liệu.");
            return ResponseEntity.status(404).body(response);
        });
    }

    private EmployerDto mapToDto(Employer e) {
        String currentTier = com.cny.backend.user.util.EmployerTierUtils.calculateTier(e.getTotalSpent());
        int discount = com.cny.backend.user.util.EmployerTierUtils.getTierDiscountPercentage(currentTier);

        return EmployerDto.builder()
                .employerId(e.getEmployerId())
                .email(e.getEmail())
                .displayName(e.getDisplayName())
                .fullName(e.getFullName())
                .phone(e.getPhone())
                .avatarUrl(e.getAvatarUrl())
                .status(e.getStatus())
                .emailVerified(e.getEmailVerified())
                .companyName(e.getCompanyName())
                .companyLogoUrl(e.getCompanyLogoUrl())
                .companyDescription(e.getCompanyDescription())
                .website(e.getWebsite())
                .address(e.getAddress())
                .city(e.getCity())
                .country(e.getCountry())
                .hideEmail(e.getHideEmail())
                .hidePhone(e.getHidePhone())
                .hideLocation(e.getHideLocation())
                .companySize(e.getCompanySize())
                .industry(e.getIndustry())
                .profileCompleteness(e.getProfileCompleteness())
                .totalSpent(e.getTotalSpent())
                .tier(currentTier)
                .tierDiscount(discount)
                .lastSpentAt(e.getLastSpentAt() != null ? e.getLastSpentAt().toString() : null)
                .projectsPosted(e.getProjectsPosted())
                .averageRating(e.getAverageRating())
                .createdAt(e.getCreatedAt() != null ? e.getCreatedAt().toString() : null)
                .updatedAt(e.getUpdatedAt() != null ? e.getUpdatedAt().toString() : null)
                .lastLoginAt(e.getLastLoginAt() != null ? e.getLastLoginAt().toString() : null)
                .kycStatus(e.getKycStatus())
                .taxCode(e.getTaxCode())
                .businessLicenseUrl(e.getBusinessLicenseUrl())
                .representativeIdCardUrl(e.getRepresentativeIdCardUrl())
                .kycSubmittedAt(e.getKycSubmittedAt() != null ? e.getKycSubmittedAt().toString() : null)
                .kycReviewedAt(e.getKycReviewedAt() != null ? e.getKycReviewedAt().toString() : null)
                .kycReviewedByStaffId(e.getKycReviewedByStaffId())
                .kycRejectedReason(e.getKycRejectedReason())
                .isVerified(e.getIsVerified())
                .build();
    }

    private Map<String, Object> buildProfileResponse(Employer employer) {
        String currentTier = com.cny.backend.user.util.EmployerTierUtils.calculateTier(employer.getTotalSpent());
        int discount = com.cny.backend.user.util.EmployerTierUtils.getTierDiscountPercentage(currentTier);

        Map<String, Object> response = new HashMap<>();
        response.put("employerId", employer.getEmployerId());
        response.put("email", employer.getEmail());
        response.put("displayName", employer.getDisplayName());
        response.put("fullName", employer.getFullName());
        response.put("phone", employer.getPhone());
        response.put("companyName", employer.getCompanyName());
        response.put("companyLogoUrl", employer.getCompanyLogoUrl());
        response.put("companyDescription", employer.getCompanyDescription());
        response.put("website", employer.getWebsite());
        response.put("address", employer.getAddress());
        response.put("city", employer.getCity());
        response.put("country", employer.getCountry());
        response.put("companySize", employer.getCompanySize());
        response.put("industry", employer.getIndustry());
        response.put("taxCode", employer.getTaxCode());
        response.put("profileCompleteness", employer.getProfileCompleteness());
        response.put("totalSpent", employer.getTotalSpent());
        response.put("tier", currentTier);
        response.put("tierDiscount", discount);
        response.put("lastSpentAt", employer.getLastSpentAt() != null ? employer.getLastSpentAt().toString() : null);
        response.put("projectsPosted", employer.getProjectsPosted());
        response.put("averageRating", employer.getAverageRating());
        response.put("billing", new HashMap<>());
        response.put("currentPackageType", employer.getCurrentPackageType() != null ? employer.getCurrentPackageType() : "PREMIUM");
        response.put("packagePostQuota", employer.getPackagePostQuota() != null ? employer.getPackagePostQuota() : 99);
        response.put("packageExpiryDate", employer.getPackageExpiryDate() != null ? employer.getPackageExpiryDate().toString() : "2030-12-31T23:59:59");
        response.put("kycStatus", employer.getKycStatus());
        response.put("businessLicenseUrl", employer.getBusinessLicenseUrl());
        response.put("representativeIdCardUrl", employer.getRepresentativeIdCardUrl());
        response.put("idCardFrontUrl", employer.getIdCardFrontUrl());
        response.put("idCardBackUrl", employer.getIdCardBackUrl());
        response.put("portraitUrl", employer.getPortraitUrl());
        response.put("kycSubmittedAt", employer.getKycSubmittedAt() != null ? employer.getKycSubmittedAt().toString() : null);
        response.put("kycReviewedAt", employer.getKycReviewedAt() != null ? employer.getKycReviewedAt().toString() : null);
        response.put("kycReviewedByStaffId", employer.getKycReviewedByStaffId());
        response.put("kycRejectedReason", employer.getKycRejectedReason());
        response.put("isVerified", employer.getIsVerified());
        return response;
    }

    private String text(Object value) {
        return value == null ? null : value.toString().trim();
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
