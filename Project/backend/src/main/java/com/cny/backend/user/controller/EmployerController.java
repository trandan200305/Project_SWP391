package com.cny.backend.user.controller;

import com.cny.backend.user.entity.Employer;
import com.cny.backend.user.entity.EmployerProfileRequest;
import com.cny.backend.user.repository.EmployerRepository;
import com.cny.backend.user.repository.EmployerProfileRequestRepository;
import com.cny.backend.user.dto.EmployerDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
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
    private EmployerProfileRequestRepository employerProfileRequestRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @GetMapping
    public ResponseEntity<List<EmployerDto>> getAllEmployers() {
        List<Employer> employers = employerRepository.findAll();
        List<EmployerDto> dtos = employers.stream().map(this::mapToDto).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/{id}")
    public ResponseEntity<EmployerDto> getById(@PathVariable Integer id) {
        return employerRepository.findById(id)
                .map(e -> ResponseEntity.ok(mapToDto(e)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{employerId}/profile")
    public ResponseEntity<Map<String, Object>> getProfile(@PathVariable Integer employerId) {
        return employerRepository.findById(employerId)
                .map(employer -> ResponseEntity.ok(buildProfileResponse(employer)))
                .orElseGet(() -> ResponseEntity.notFound().build());
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

        Map<String, Object> billing = asMap(payload.get("billing"));

        
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
        }

        String urlPattern = "^(https?://)?([\\da-z.-]+)\\.([a-z.]{2,6})([/\\w .-]*)*\\/?$";
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

        String bankName = text(billing.get("bankName"));
        String accountNumber = text(billing.get("accountNumber"));
        String accountHolder = text(billing.get("accountHolder"));

        if (!isBlank(bankName) || !isBlank(accountNumber) || !isBlank(accountHolder)) {
            if (isBlank(bankName) || isBlank(accountNumber) || isBlank(accountHolder)) {
                Map<String, Object> errResponse = new HashMap<>();
                errResponse.put("success", false);
                errResponse.put("message", "Nếu cập nhật thông tin thanh toán, vui lòng điền đầy đủ: Ngân hàng, Số tài khoản và Chủ tài khoản.");
                return ResponseEntity.badRequest().body(errResponse);
            }
            if (!accountNumber.matches("^[0-9]+$")) {
                Map<String, Object> errResponse = new HashMap<>();
                errResponse.put("success", false);
                errResponse.put("message", "Số tài khoản ngân hàng chỉ được phép chứa các chữ số.");
                return ResponseEntity.badRequest().body(errResponse);
            }
        }

        EmployerProfileRequest req = EmployerProfileRequest.builder()
                .employer(employer)
                .displayName(text(payload.get("displayName")))
                .fullName(text(payload.get("fullName")))
                .phone(text(payload.get("phone")))
                .companyName(text(payload.get("companyName")))
                .companyLogoUrl(text(payload.get("companyLogoUrl")))
                .companyDescription(text(payload.get("companyDescription")))
                .website(text(payload.get("website")))
                .address(text(payload.get("address")))
                .city(text(payload.get("city")))
                .country(text(payload.get("country")))
                .companySize(text(payload.get("companySize")))
                .industry(text(payload.get("industry")))
                .bankName(text(billing.get("bankName")))
                .accountNumber(text(billing.get("accountNumber")))
                .accountHolder(text(billing.get("accountHolder")))
                .branch(text(billing.get("branch")))
                .status("PENDING")
                .build();

        employerProfileRequestRepository.save(req);

        Map<String, Object> response = buildProfileResponse(employer);
        response.put("success", true);
        response.put("message", "Yêu cầu thay đổi thông tin của bạn đã được gửi tới Admin để phê duyệt.");
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
        return employerRepository.findById(id).map(e -> {
            e.setTaxCode(dto.getTaxCode());
            e.setBusinessLicenseUrl(dto.getBusinessLicenseUrl());
            e.setRepresentativeIdCardUrl(dto.getRepresentativeIdCardUrl());
            e.setKycStatus("PENDING");
            e.setKycSubmittedAt(LocalDateTime.now());
            e.setUpdatedAt(LocalDateTime.now());
            
            employerRepository.save(e);
            response.put("success", true);
            response.put("message", "Đã nộp hồ sơ KYC thành công. Đang chờ duyệt.");
            return ResponseEntity.ok(response);
        }).orElseGet(() -> {
            response.put("success", false);
            response.put("message", "Không tìm thấy người dùng.");
            return ResponseEntity.notFound().build();
        });
    }

    private EmployerDto mapToDto(Employer e) {
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
        response.put("profileCompleteness", employer.getProfileCompleteness());
        response.put("totalSpent", employer.getTotalSpent());
        response.put("projectsPosted", employer.getProjectsPosted());
        response.put("averageRating", employer.getAverageRating());
        response.put("billing", findDefaultBankAccount(employer.getEmployerId()));
        response.put("kycStatus", employer.getKycStatus());
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

    private Map<String, Object> findDefaultBankAccount(Integer employerId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT TOP 1 bank_account_id, bank_name, account_number, account_holder, branch, is_default " +
                        "FROM bank_accounts WHERE employer_id = ? ORDER BY is_default DESC, created_at DESC",
                employerId
        );
        if (rows.isEmpty()) {
            return new HashMap<>();
        }
        return rows.get(0);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> asMap(Object value) {
        if (value instanceof Map<?, ?>) {
            return (Map<String, Object>) value;
        }
        return new HashMap<>();
    }

    private String text(Object value) {
        return value == null ? null : value.toString().trim();
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
