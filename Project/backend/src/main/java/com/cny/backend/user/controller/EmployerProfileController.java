package com.cny.backend.user.controller;

import com.cny.backend.user.entity.Employer;
import com.cny.backend.user.entity.EmployerProfileRequest;
import com.cny.backend.user.repository.EmployerRepository;
import com.cny.backend.user.repository.EmployerProfileRequestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/employers")
@CrossOrigin(origins = "*")
public class EmployerProfileController {

    @Autowired
    private EmployerRepository employerRepository;

    @Autowired
    private EmployerProfileRequestRepository employerProfileRequestRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

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

    private void upsertDefaultBankAccount(Integer employerId, Map<String, Object> billing) {
        if (billing == null || billing.isEmpty()) {
            return;
        }

        String bankName = text(billing.get("bankName"));
        String accountNumber = text(billing.get("accountNumber"));
        String accountHolder = text(billing.get("accountHolder"));
        String branch = text(billing.get("branch"));

        if (isBlank(bankName) && isBlank(accountNumber) && isBlank(accountHolder) && isBlank(branch)) {
            return;
        }

        Integer existingId = jdbcTemplate.query(
                "SELECT TOP 1 bank_account_id FROM bank_accounts WHERE employer_id = ? ORDER BY is_default DESC, created_at DESC",
                rs -> rs.next() ? rs.getInt("bank_account_id") : null,
                employerId
        );

        if (existingId == null) {
            jdbcTemplate.update(
                    "INSERT INTO bank_accounts (employer_id, bank_name, account_number, account_holder, branch, is_default) VALUES (?, ?, ?, ?, ?, 1)",
                    employerId,
                    defaultText(bankName, "Chưa cập nhật"),
                    defaultText(accountNumber, "Chưa cập nhật"),
                    defaultText(accountHolder, "Chưa cập nhật"),
                    branch
            );
        } else {
            jdbcTemplate.update(
                    "UPDATE bank_accounts SET bank_name = ?, account_number = ?, account_holder = ?, branch = ?, is_default = 1 WHERE bank_account_id = ?",
                    defaultText(bankName, "Chưa cập nhật"),
                    defaultText(accountNumber, "Chưa cập nhật"),
                    defaultText(accountHolder, "Chưa cập nhật"),
                    branch,
                    existingId
            );
        }
    }

    private int calculateCompleteness(Employer employer) {
        String[] fields = {
                employer.getDisplayName(),
                employer.getFullName(),
                employer.getPhone(),
                employer.getCompanyName(),
                employer.getCompanyDescription(),
                employer.getWebsite(),
                employer.getAddress(),
                employer.getCity(),
                employer.getCountry(),
                employer.getCompanySize(),
                employer.getIndustry()
        };
        int filled = 0;
        for (String field : fields) {
            if (!isBlank(field)) {
                filled++;
            }
        }
        return Math.round((filled * 100f) / fields.length);
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

    private String defaultText(String value, String fallback) {
        return isBlank(value) ? fallback : value;
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
