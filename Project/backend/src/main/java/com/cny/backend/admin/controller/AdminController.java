package com.cny.backend.admin.controller;

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
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    @Autowired
    private AdminService adminService;

    @GetMapping("/stats")
    public ResponseEntity<AdminStatsDto> getStats(@RequestParam(value = "period", defaultValue = "30days") String period) {
        return ResponseEntity.ok(adminService.getStats(period));
    }

    @GetMapping("/charts/user-growth")
    public ResponseEntity<List<UserGrowthTrendDto>> getUserGrowthTrend() {
        return ResponseEntity.ok(adminService.getUserGrowthTrend());
    }

    @GetMapping("/charts/revenue")
    public ResponseEntity<List<RevenueTrendDto>> getRevenueTrend() {
        return ResponseEntity.ok(adminService.getRevenueTrend());
    }

    @GetMapping("/fee-config")
    public ResponseEntity<PlatformFeeDto> getFeeConfig() {
        return ResponseEntity.ok(adminService.getFeeConfig());
    }

    @PostMapping("/fee-config")
    public ResponseEntity<PlatformFeeDto> updateFeeConfig(
            @RequestParam("fee") double fee,
            @RequestHeader(value = "X-Admin-Id", required = false, defaultValue = "1") int adminId) {
        return ResponseEntity.ok(adminService.updateFeeConfig(fee, adminId));
    }

    @GetMapping("/users")
    public ResponseEntity<List<AdminUserDto>> getUsers() {
        return ResponseEntity.ok(adminService.getUsers());
    }

    @PutMapping("/users/{id}/status")
    public ResponseEntity<Map<String, Object>> updateUserStatus(
            @PathVariable("id") int id,
            @RequestParam("role") String role,
            @RequestParam("status") String status,
            @RequestParam(value = "reason", required = false) String reason,
            @RequestHeader(value = "X-Admin-Id", required = false, defaultValue = "1") int adminId) {
        Map<String, Object> response = adminService.updateUserStatus(id, role, status, reason, adminId);
        if (response.containsKey("success") && !(Boolean) response.get("success") && response.get("message").toString().contains("bảo vệ")) {
            return ResponseEntity.status(403).body(response);
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping("/projects/pending")
    public ResponseEntity<List<PendingProjectDto>> getPendingProjects() {
        return ResponseEntity.ok(adminService.getPendingProjects());
    }

    @PutMapping("/projects/{id}/moderate")
    public ResponseEntity<Map<String, Object>> moderateProject(
            @PathVariable("id") int id,
            @RequestParam("approve") boolean approve,
            @RequestParam(value = "reason", required = false) String reason,
            @RequestHeader(value = "X-Admin-Id", required = false, defaultValue = "1") int adminId) {
        return ResponseEntity.ok(adminService.moderateProject(id, approve, reason, adminId));
    }

    @GetMapping("/withdrawals")
    public ResponseEntity<List<WithdrawalDto>> getWithdrawals() {
        return ResponseEntity.ok(adminService.getWithdrawals());
    }

    @PutMapping("/withdrawals/{id}/process")
    public ResponseEntity<Map<String, Object>> processWithdrawal(
            @PathVariable("id") int id,
            @RequestParam("status") String status,
            @RequestHeader(value = "X-Admin-Id", required = false, defaultValue = "1") int adminId) {
        return ResponseEntity.ok(adminService.processWithdrawal(id, status, adminId));
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<List<AdminAuditLogDto>> getAuditLogs() {
        return ResponseEntity.ok(adminService.getAuditLogs());
    }

    @GetMapping("/job-categories")
    public ResponseEntity<List<JobCategoryDto>> getJobCategories() {
        return ResponseEntity.ok(adminService.getJobCategories());
    }

    @GetMapping("/kyc-requests")
    public ResponseEntity<List<KycRequestDto>> getKycRequests() {
        return ResponseEntity.ok(adminService.getKycRequests());
    }

    @GetMapping("/disputes")
    public ResponseEntity<List<DisputeDto>> getDisputes() {
        return ResponseEntity.ok(adminService.getDisputes());
    }

    @PutMapping("/disputes/{id}/resolve")
    public ResponseEntity<Map<String, Object>> resolveDispute(
            @PathVariable("id") int id,
            @RequestParam("status") String status,
            @RequestParam(value = "note", required = false) String note,
            @RequestHeader(value = "X-Admin-Id", required = false, defaultValue = "1") int adminId) {
        return ResponseEntity.ok(adminService.resolveDispute(id, status, note, adminId));
    }

    @GetMapping("/reports")
    public ResponseEntity<List<ReportDto>> getReports() {
        return ResponseEntity.ok(adminService.getReports());
    }

    @PutMapping("/reports/{id}/resolve")
    public ResponseEntity<Map<String, Object>> resolveReport(
            @PathVariable("id") int id,
            @RequestParam("status") String status,
            @RequestHeader(value = "X-Admin-Id", required = false, defaultValue = "1") int adminId) {
        return ResponseEntity.ok(adminService.resolveReport(id, status, adminId));
    }

    @GetMapping("/warning-templates")
    public ResponseEntity<List<WarningTemplateDto>> getWarningTemplates() {
        return ResponseEntity.ok(adminService.getWarningTemplates());
    }

    @GetMapping("/articles")
    public ResponseEntity<List<ArticleDto>> getArticles() {
        return ResponseEntity.ok(adminService.getArticles());
    }

    @GetMapping("/tickets")
    public ResponseEntity<List<SupportTicketDto>> getTickets() {
        return ResponseEntity.ok(adminService.getTickets());
    }

    @GetMapping("/seo-configs")
    public ResponseEntity<List<SeoConfigDto>> getSeoConfigs() {
        return ResponseEntity.ok(adminService.getSeoConfigs());
    }

    @PostMapping("/managers")
    public ResponseEntity<Map<String, Object>> createManager(
            @RequestBody ManagerCreateDto dto,
            @RequestHeader(value = "X-Admin-Id", required = false, defaultValue = "1") int adminId) {
        return ResponseEntity.ok(adminService.createManager(dto, adminId));
    }

    @GetMapping("/managers")
    public ResponseEntity<List<ManagerDto>> getAllManagers() {
        return ResponseEntity.ok(adminService.getAllManagers());
    }

    @PostMapping("/staff")
    public ResponseEntity<Map<String, Object>> createStaff(
            @RequestBody StaffCreateDto dto,
            @RequestHeader(value = "X-Admin-Id", required = false, defaultValue = "1") int adminId) {
        return ResponseEntity.ok(adminService.createStaff(dto, adminId));
    }

    @GetMapping("/staff")
    public ResponseEntity<List<StaffDto>> getAllStaff() {
        return ResponseEntity.ok(adminService.getAllStaff());
    }

    @PostMapping("/invite")
    public ResponseEntity<Map<String, Object>> inviteStaffOrManager(
            @RequestBody Map<String, Object> payload,
            @RequestHeader(value = "X-Admin-Id", required = false, defaultValue = "1") int adminId) {
        return ResponseEntity.ok(adminService.inviteStaffOrManager(payload, adminId));
    }

    @Autowired
    private AdminRepository adminRepository;

    @GetMapping("/{id}")
    public ResponseEntity<AdminDto> getById(@PathVariable Integer id) {
        return adminRepository.findById(id).map(a -> ResponseEntity.ok(mapToDto(a))).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/users/{role}/{id}/credentials")
    public ResponseEntity<Map<String, Object>> getUserCredentials(
            @PathVariable("role") String role,
            @PathVariable("id") int id) {
        return ResponseEntity.ok(adminService.getUserCredentials(role, id));
    }

    @PostMapping("/users/{role}/{id}/regenerate-password")
    public ResponseEntity<Map<String, Object>> regenerateUserPassword(
            @PathVariable("role") String role,
            @PathVariable("id") int id) {
        return ResponseEntity.ok(adminService.regenerateUserPassword(role, id));
    }

    @GetMapping("/verification-tasks")
    public ResponseEntity<List<Map<String, Object>>> getVerificationTasks() {
        return ResponseEntity.ok(adminService.getVerificationTasks());
    }

    @PostMapping("/verification-tasks")
    public ResponseEntity<Map<String, Object>> createVerificationTask(@RequestBody Map<String, Object> payload) {
        return ResponseEntity.ok(adminService.createVerificationTask(payload));
    }

    @PostMapping("/verification-tasks/{id}/claim")
    public ResponseEntity<Map<String, Object>> claimVerificationTask(
            @PathVariable("id") int id,
            @RequestHeader(value = "X-Verifier-Email", required = false, defaultValue = "admin@lancerpro.com") String verifierEmail) {
        return ResponseEntity.ok(adminService.claimVerificationTask(id, verifierEmail));
    }

    @PostMapping("/verification-tasks/{id}/escalate")
    public ResponseEntity<Map<String, Object>> escalateVerificationTask(
            @PathVariable("id") int id,
            @RequestBody Map<String, Object> payload,
            @RequestHeader(value = "X-Verifier-Email", required = false, defaultValue = "admin@lancerpro.com") String verifierEmail) {
        return ResponseEntity.ok(adminService.escalateVerificationTask(id, payload, verifierEmail));
    }

    @PostMapping("/verification-tasks/{id}/signoff")
    public ResponseEntity<Map<String, Object>> submitTaskSignoff(
            @PathVariable("id") int id,
            @RequestBody Map<String, Object> payload,
            @RequestHeader(value = "X-Verifier-Email", required = false, defaultValue = "admin@lancerpro.com") String verifierEmail) {
        return ResponseEntity.ok(adminService.submitTaskSignoff(id, payload, verifierEmail));
    }

    @PutMapping("/{id}/profile")
    public ResponseEntity<AdminDto> updateProfile(@PathVariable Integer id, @RequestBody AdminDto updated) {
        return adminRepository.findById(id).map(a -> {
            if(updated.getDisplayName() != null) a.setDisplayName(updated.getDisplayName());
            if(updated.getFullName() != null) a.setFullName(updated.getFullName());
            if(updated.getPhone() != null) a.setPhone(updated.getPhone());
            if(updated.getAvatarUrl() != null) a.setAvatarUrl(updated.getAvatarUrl());
            a.setUpdatedAt(java.time.LocalDateTime.now());
            Admin saved = adminRepository.save(a);
            return ResponseEntity.ok(mapToDto(saved));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteAccount(@PathVariable Integer id, @RequestParam(required = false) String confirmationText) {
        Map<String, Object> response = new java.util.HashMap<>();
        if (confirmationText == null || !confirmationText.equals("DELETE")) {
            response.put("success", false);
            response.put("message", "Chữ xác nhận không hợp lệ. Vui lòng nhập đúng chữ 'DELETE'.");
            return ResponseEntity.badRequest().body(response);
        }
        return adminRepository.findById(id).map(a -> {
            a.setIsDeleted(true);
            a.setUpdatedAt(java.time.LocalDateTime.now());
            adminRepository.save(a);
            response.put("success", true);
            response.put("message", "Tài khoản của bạn đã được xóa vĩnh viễn.");
            return ResponseEntity.ok(response);
        }).orElseGet(() -> {
            response.put("success", false);
            response.put("message", "Không tìm thấy tài khoản để xóa.");
            return ResponseEntity.notFound().build();
        });
    }

    private AdminDto mapToDto(Admin a) {
        return AdminDto.builder()
                .adminId(a.getAdminId())
                .email(a.getEmail())
                .displayName(a.getDisplayName())
                .fullName(a.getFullName())
                .phone(a.getPhone())
                .avatarUrl(a.getAvatarUrl())
                .status(a.getStatus())
                .emailVerified(a.getEmailVerified())
                .adminLevel(a.getAdminLevel())
                .createdAt(a.getCreatedAt() != null ? a.getCreatedAt().toString() : null)
                .updatedAt(a.getUpdatedAt() != null ? a.getUpdatedAt().toString() : null)
                .build();
    }

    @PutMapping("/kyc-requests/{id}/moderate")
    public ResponseEntity<Map<String, Object>> moderateKycRequest(
            @PathVariable("id") int id,
            @RequestParam("approve") boolean approve,
            @RequestParam("role") String role,
            @RequestHeader(value = "X-Admin-Id", required = false, defaultValue = "1") int adminId) {
        return ResponseEntity.ok(adminService.moderateKycRequest(id, approve, role, adminId));
    }

    @GetMapping("/vnpay-config")
    public ResponseEntity<VnpayConfig> getVnpayConfig() {
        return ResponseEntity.ok(adminService.getVnpayConfig());
    }

    @PostMapping("/vnpay-config")
    public ResponseEntity<VnpayConfig> saveVnpayConfig(
            @RequestBody VnpayConfig config,
            @RequestHeader(value = "X-Admin-Id", required = false, defaultValue = "1") int adminId) {
        return ResponseEntity.ok(adminService.saveVnpayConfig(config, adminId));
    }

    @GetMapping("/vnpay-transactions")
    public ResponseEntity<List<PaymentTransaction>> getVnpayTransactions() {
        return ResponseEntity.ok(adminService.getVnpayTransactions());
    }

    @PostMapping("/vnpay-transactions/{id}/reconcile")
    public ResponseEntity<Map<String, Object>> reconcileVnpayTransaction(
            @PathVariable("id") int id,
            @RequestHeader(value = "X-Admin-Id", required = false, defaultValue = "1") int adminId) {
        return ResponseEntity.ok(adminService.reconcileVnpayTransaction(id, adminId));
    }
}
