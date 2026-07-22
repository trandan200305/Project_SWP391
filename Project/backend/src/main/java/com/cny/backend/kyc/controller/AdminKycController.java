package com.cny.backend.kyc.controller;

import com.cny.backend.admin.entity.SystemSetting;
import com.cny.backend.admin.repository.SystemSettingRepository;
import com.cny.backend.kyc.dto.KycReviewDto;
import com.cny.backend.kyc.dto.KycSubmissionDto;
import com.cny.backend.kyc.entity.UserKycVerification;
import com.cny.backend.dashboard.repository.ApiFrequencyStatRepository;
import com.cny.backend.dashboard.entity.ApiFrequencyStat;
import com.cny.backend.kyc.service.AdminKycService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/kyc")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AdminKycController {

    private final AdminKycService kycService;
    private final ApiFrequencyStatRepository apiStatRepo;
    private final SystemSettingRepository systemSettingRepo;

    @GetMapping
    public ResponseEntity<List<UserKycVerification>> getAllSubmissions(@RequestParam(required = false) String status) {
        return ResponseEntity.ok(kycService.getAllSubmissions(status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserKycVerification> getSubmissionById(@PathVariable Long id) {
        return ResponseEntity.ok(kycService.getSubmissionById(id));
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getKycStatistics() {
        return ResponseEntity.ok(kycService.getKycStatistics());
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<UserKycVerification> approveKyc(
            @PathVariable Long id,
            @RequestBody(required = false) KycReviewDto reviewDto) {
        return ResponseEntity.ok(kycService.approveKyc(id, reviewDto));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<UserKycVerification> rejectKyc(
            @PathVariable Long id,
            @RequestBody(required = false) KycReviewDto reviewDto) {
        return ResponseEntity.ok(kycService.rejectKyc(id, reviewDto));
    }

    @PostMapping("/submit")
    public ResponseEntity<UserKycVerification> submitKycResult(@RequestBody KycSubmissionDto dto) {
        System.out.println("=== submitKycResult triggered ===");
        if (dto.getIdNumber() == null || dto.getIdNumber().trim().isEmpty()) {
            dto.setIdNumber("000000000000");
        }
        if (dto.getFullName() == null || dto.getFullName().trim().isEmpty()) {
            dto.setFullName("Unknown User");
        }
        if (dto.getGender() == null) dto.setGender("Nam");
        if (dto.getDateOfBirth() == null) dto.setDateOfBirth("01/01/2000");
        if (dto.getAddress() == null) dto.setAddress("Unknown Address");
        
        UserKycVerification result = kycService.submitKycResult(dto);
        System.out.println("Result generated: " + result);
        
        // Mock updating the VNPT eKYC APIs stats for dashboard
        List<String> apisToUpdate = List.of(
            "/ai/v1/ocr/id/front",
            "/ai/v1/ocr/id/back",
            "/ai/v4/web/standard/face/liveness",
            "/ai/v1/face/one",
            "/ai/v5/card/liveness"
        );

        for (String path : apisToUpdate) {
            List<ApiFrequencyStat> stats = apiStatRepo.findByPath(path);
            System.out.println("Updating path: " + path + ", found records: " + stats.size());
            if (!stats.isEmpty()) {
                ApiFrequencyStat stat = stats.get(0);
                stat.setTotal(stat.getTotal() + 1);
                stat.setSuccess(stat.getSuccess() + 1);
                apiStatRepo.save(stat);
                System.out.println("Saved updated stat for " + path);
            }
        }
        
        System.out.println("=== submitKycResult finished ===");
        return ResponseEntity.ok(result);
    }

    @GetMapping("/quota")
    public ResponseEntity<Map<String, Object>> getQuota() {
        SystemSetting quotaSetting = systemSettingRepo.findById("VNPT_EKYC_QUOTA").orElse(
            SystemSetting.builder().key("VNPT_EKYC_QUOTA").value("50000").build()
        );
        return ResponseEntity.ok(Map.of("quota", Integer.parseInt(quotaSetting.getValue())));
    }

    @PostMapping("/quota")
    public ResponseEntity<Map<String, Object>> updateQuota(@RequestBody Map<String, Integer> body) {
        if (!body.containsKey("quota")) {
            return ResponseEntity.badRequest().build();
        }
        SystemSetting quotaSetting = systemSettingRepo.findById("VNPT_EKYC_QUOTA").orElse(
            SystemSetting.builder().key("VNPT_EKYC_QUOTA").build()
        );
        quotaSetting.setValue(String.valueOf(body.get("quota")));
        systemSettingRepo.save(quotaSetting);
        return ResponseEntity.ok(Map.of("quota", Integer.parseInt(quotaSetting.getValue())));
    }
}
