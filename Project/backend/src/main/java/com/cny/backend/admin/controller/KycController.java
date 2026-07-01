package com.cny.backend.admin.controller;

import com.cny.backend.admin.dto.KycRequestDto;
import com.cny.backend.admin.service.AdminService;
import com.cny.backend.user.entity.EmployerProfileRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/kyc")
@CrossOrigin(origins = "*")
public class KycController {

    @Autowired
    private AdminService adminService;

    @GetMapping("/requests")
    public ResponseEntity<List<KycRequestDto>> getKycRequests() {
        return ResponseEntity.ok(adminService.getKycRequests());
    }

    @PutMapping("/requests/{id}/moderate")
    public ResponseEntity<Map<String, Object>> moderateKycRequest(
            @PathVariable("id") int id,
            @RequestParam("approve") boolean approve,
            @RequestParam("role") String role,
            @RequestHeader(value = "X-Admin-Id", required = false, defaultValue = "1") int adminId) {
        return ResponseEntity.ok(adminService.moderateKycRequest(id, approve, role, adminId));
    }

    @PostMapping("/requests/{id}/require-more-info")
    public ResponseEntity<Map<String, Object>> requireMoreInfo(
            @PathVariable("id") int id,
            @RequestParam("role") String role,
            @RequestBody Map<String, String> payload,
            @RequestHeader(value = "X-Admin-Id", required = false, defaultValue = "1") int adminId) {
        return ResponseEntity.ok(adminService.requireMoreInfoKycRequest(id, role, payload.get("reason"), adminId));
    }

    @GetMapping("/profile-requests")
    public ResponseEntity<List<EmployerProfileRequest>> getProfileRequests() {
        return ResponseEntity.ok(adminService.getPendingProfileRequests());
    }

    @PutMapping("/profile-requests/{id}/moderate")
    public ResponseEntity<Map<String, Object>> moderateProfileRequest(
            @PathVariable("id") int id,
            @RequestParam("approve") boolean approve,
            @RequestParam(value = "reason", required = false) String reason,
            @RequestHeader(value = "X-Admin-Id", required = false, defaultValue = "1") int adminId) {
        return ResponseEntity.ok(adminService.moderateProfileRequest(id, approve, reason, adminId));
    }
}
