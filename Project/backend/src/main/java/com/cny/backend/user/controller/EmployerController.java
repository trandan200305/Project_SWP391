package com.cny.backend.user.controller;

import com.cny.backend.user.entity.Employer;
import com.cny.backend.user.entity.EmployerProfileRequest;
import com.cny.backend.user.repository.EmployerRepository;
import com.cny.backend.user.repository.EmployerProfileRequestRepository;
import com.cny.backend.user.dto.EmployerDto;
import com.cny.backend.user.repository.FreelancerRepository;
import com.cny.backend.project.repository.ProjectRepository;
import com.cny.backend.project.repository.ContractRepository;
import com.cny.backend.admin.repository.DisputeRepository;
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
    private com.cny.backend.notification.service.NotificationService notificationService;

    @Autowired
    private EmployerProfileRequestRepository employerProfileRequestRepository;

    @Autowired
    private FreelancerRepository freelancerRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private ContractRepository contractRepository;

    @Autowired
    private DisputeRepository disputeRepository;

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
        Employer employer = employerRepository.findById(employerId).orElse(null);
        if (employer == null) {
            return ResponseEntity.notFound().build();
        }

        Map<String, Object> response = buildProfileResponse(employer);

        // Fetch latest pending request to overlay pending changes
        List<EmployerProfileRequest> requests = employerProfileRequestRepository.findByEmployerEmployerIdOrderByCreatedAtDesc(employerId);
        if (!requests.isEmpty()) {
            EmployerProfileRequest latest = requests.get(0);
            if ("PENDING".equals(latest.getStatus())) {
                response.put("hasPendingRequest", true);
                if (latest.getDisplayName() != null) response.put("displayName", latest.getDisplayName());
                if (latest.getFullName() != null) response.put("fullName", latest.getFullName());
                if (latest.getPhone() != null) response.put("phone", latest.getPhone());
                if (latest.getCompanyName() != null) response.put("companyName", latest.getCompanyName());
                if (latest.getCompanyLogoUrl() != null) response.put("companyLogoUrl", latest.getCompanyLogoUrl());
                if (latest.getCompanyDescription() != null) response.put("companyDescription", latest.getCompanyDescription());
                if (latest.getWebsite() != null) response.put("website", latest.getWebsite());
                if (latest.getAddress() != null) response.put("address", latest.getAddress());
                if (latest.getCity() != null) response.put("city", latest.getCity());
                if (latest.getCountry() != null) response.put("country", latest.getCountry());
                if (latest.getCompanySize() != null) response.put("companySize", latest.getCompanySize());
                if (latest.getIndustry() != null) response.put("industry", latest.getIndustry());
                if (latest.getTaxCode() != null) response.put("taxCode", latest.getTaxCode());

                Map<String, Object> billing = new HashMap<>();
                billing.put("bank_name", latest.getBankName() != null ? latest.getBankName() : "");
                billing.put("account_number", latest.getAccountNumber() != null ? latest.getAccountNumber() : "");
                billing.put("account_holder", latest.getAccountHolder() != null ? latest.getAccountHolder() : "");
                billing.put("branch", latest.getBranch() != null ? latest.getBranch() : "");
                response.put("billing", billing);
            }
        }

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

        if (payload.containsKey("email")) {
            String email = text(payload.get("email"));
            if (!isBlank(email) && !email.equals(employer.getEmail())) {
                if (employerRepository.countByEmail(email) > 0 ||
                        freelancerRepository.countByEmail(email) > 0) {
                    Map<String, Object> errResponse = new HashMap<>();
                    errResponse.put("success", false);
                    errResponse.put("message", "Email này đã được sử dụng trên hệ thống. Vui lòng nhập email khác!");
                    return ResponseEntity.badRequest().body(errResponse);
                }
                employer.setEmail(email);
            }
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

        String bankName = text(billing.get("bankName"));
        String accountNumber = text(billing.get("accountNumber"));
        String accountHolder = text(billing.get("accountHolder"));
        String branch = text(billing.get("branch"));

        if (!isBlank(bankName) || !isBlank(accountNumber) || !isBlank(accountHolder) || !isBlank(branch)) {
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
            if (accountNumber.length() > 30) {
                Map<String, Object> errResponse = new HashMap<>();
                errResponse.put("success", false);
                errResponse.put("message", "Số tài khoản ngân hàng tối đa 30 ký tự.");
                return ResponseEntity.badRequest().body(errResponse);
            }
            if (!accountHolder.matches("^[\\p{L} ]+$")) {
                Map<String, Object> errResponse = new HashMap<>();
                errResponse.put("success", false);
                errResponse.put("message", "Tên chủ tài khoản chỉ được phép chứa các chữ cái và khoảng trắng.");
                return ResponseEntity.badRequest().body(errResponse);
            }
            if (accountHolder.length() > 150) {
                Map<String, Object> errResponse = new HashMap<>();
                errResponse.put("success", false);
                errResponse.put("message", "Tên chủ tài khoản tối đa 150 ký tự.");
                return ResponseEntity.badRequest().body(errResponse);
            }
            if (branch != null && branch.length() > 100) {
                Map<String, Object> errResponse = new HashMap<>();
                errResponse.put("success", false);
                errResponse.put("message", "Chi nhánh ngân hàng tối đa 100 ký tự.");
                return ResponseEntity.badRequest().body(errResponse);
            }
        }

        List<EmployerProfileRequest> requests = employerProfileRequestRepository.findByEmployerEmployerIdOrderByCreatedAtDesc(employerId);
        EmployerProfileRequest req;
        if (!requests.isEmpty() && "PENDING".equals(requests.get(0).getStatus())) {
            req = requests.get(0);
            req.setDisplayName(text(payload.get("displayName")));
            req.setFullName(text(payload.get("fullName")));
            req.setPhone(text(payload.get("phone")));
            req.setCompanyName(text(payload.get("companyName")));
            req.setCompanyLogoUrl(text(payload.get("companyLogoUrl")));
            req.setCompanyDescription(text(payload.get("companyDescription")));
            req.setWebsite(text(payload.get("website")));
            req.setAddress(text(payload.get("address")));
            req.setCity(text(payload.get("city")));
            req.setCountry(text(payload.get("country")));
            req.setCompanySize(text(payload.get("companySize")));
            req.setIndustry(text(payload.get("industry")));
            req.setTaxCode(taxCode);
            req.setBankName(text(billing.get("bankName")));
            req.setAccountNumber(text(billing.get("accountNumber")));
            req.setAccountHolder(text(billing.get("accountHolder")));
            req.setBranch(text(billing.get("branch")));
            req.setUpdatedAt(LocalDateTime.now());
        } else {
            req = EmployerProfileRequest.builder()
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
                    .taxCode(taxCode)
                    .bankName(text(billing.get("bankName")))
                    .accountNumber(text(billing.get("accountNumber")))
                    .accountHolder(text(billing.get("accountHolder")))
                    .branch(text(billing.get("branch")))
                    .status("PENDING")
                    .build();
        }

        EmployerProfileRequest savedReq = employerProfileRequestRepository.save(req);

        // Notify MANAGER
        try {
            String empName = savedReq.getCompanyName() != null ? savedReq.getCompanyName() : savedReq.getDisplayName();
            if (empName == null) {
                empName = employer.getCompanyName() != null ? employer.getCompanyName() : employer.getDisplayName();
            }
            notificationService.createNotification(
                0L,
                "MANAGER",
                "Yêu cầu cập nhật hồ sơ doanh nghiệp",
                "Nhà tuyển dụng " + empName + " vừa gửi yêu cầu cập nhật hồ sơ.",
                "PROFILE_REQUEST",
                savedReq.getRequestId().toString()
            );
        } catch (Exception ex) {
            System.err.println("Failed to send notification to manager: " + ex.getMessage());
        }

        Map<String, Object> response = buildProfileResponse(employer);
        response.put("success", true);
        response.put("message", "Yêu cầu thay đổi thông tin của bạn đã được gửi tới Manager để phê duyệt.");
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
            int activeProjects = projectRepository.countActiveProjectsByEmployerId(id);
            if (activeProjects > 0) {
                response.put("success", false);
                response.put("message", "Không thể xóa tài khoản vì bạn đang có " + activeProjects + " dự án đang mở hoặc chờ duyệt.");
                return ResponseEntity.badRequest().body(response);
            }

            int activeContracts = contractRepository.countActiveContractsByEmployerId(id);
            if (activeContracts > 0) {
                response.put("success", false);
                response.put("message", "Không thể xóa tài khoản vì bạn đang có " + activeContracts + " dự án/hợp đồng đang thực hiện với Freelancer.");
                return ResponseEntity.badRequest().body(response);
            }

            int activeDisputes = disputeRepository.countActiveDisputesByEmployerId(id);
            if (activeDisputes > 0) {
                response.put("success", false);
                response.put("message", "Không thể xóa tài khoản vì bạn đang có " + activeDisputes + " tranh chấp/khiếu nại đang mở.");
                return ResponseEntity.badRequest().body(response);
            }

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
        response.put("taxCode", employer.getTaxCode());
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
