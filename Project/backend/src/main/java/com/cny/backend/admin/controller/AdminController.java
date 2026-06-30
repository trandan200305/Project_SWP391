package com.cny.backend.admin.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.DeleteMapping;

import com.cny.backend.admin.dto.AdminAuditLogDto;
import com.cny.backend.admin.dto.AdminDto;
import com.cny.backend.admin.dto.AdminStatsDto;
import com.cny.backend.admin.dto.DisputeDto;
import com.cny.backend.admin.dto.KycRequestDto;
import com.cny.backend.admin.dto.ManagerCreateDto;
import com.cny.backend.admin.dto.ManagerDto;
import com.cny.backend.admin.dto.PendingProjectDto;
import com.cny.backend.admin.dto.PlatformFeeDto;
import com.cny.backend.admin.dto.ReportDto;
import com.cny.backend.admin.dto.RevenueTrendDto;
import com.cny.backend.admin.dto.SeoConfigDto;
import com.cny.backend.admin.dto.StaffCreateDto;
import com.cny.backend.admin.dto.StaffDto;
import com.cny.backend.admin.dto.SupportTicketDto;
import com.cny.backend.admin.dto.UserGrowthTrendDto;
import com.cny.backend.admin.dto.WarningTemplateDto;
import com.cny.backend.admin.dto.WithdrawalDto;
import com.cny.backend.admin.entity.Admin;
import com.cny.backend.admin.entity.PaymentTransaction;
import com.cny.backend.admin.entity.VnpayConfig;
import com.cny.backend.admin.repository.AdminRepository;
import com.cny.backend.admin.service.AdminService;
import com.cny.backend.admin.service.VNPayService;
import com.cny.backend.project.dto.ArticleDto;
import com.cny.backend.project.dto.JobCategoryDto;
import com.cny.backend.user.entity.EmployerProfileRequest;

@RestController
@RequestMapping("/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    @Autowired
    private AdminService adminService;

    @Autowired
    private VNPayService vnpayService;

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
    public ResponseEntity<Object> getUsers(
            @RequestParam(value = "page", required = false, defaultValue = "1") Integer page,
            //@RequestParam(value = "size", required = false) Integer size
            @RequestParam(value = "size", required = false, defaultValue = "2") Integer size,
            @RequestParam(value = "role", defaultValue = "ALL") String role,
            @RequestParam(value = "search", defaultValue = "") String search,
            @RequestParam(value = "status", defaultValue = "ALL") String status,
            @RequestParam(value = "timeFilter", defaultValue = "ALL") String timeFilter,
            @RequestParam(value = "timeStart", required = false) String timeStart,
            @RequestParam(value = "timeEnd", required = false) String timeEnd,
            @RequestParam(value = "filterEmployer", defaultValue = "true") boolean filterEmployer,
            @RequestParam(value = "filterManager", defaultValue = "true") boolean filterManager,
            @RequestParam(value = "filterStaff", defaultValue = "true") boolean filterStaff,
            @RequestParam(value = "activeOnlineChecked", defaultValue = "true") boolean activeOnlineChecked,
            @RequestParam(value = "activeOfflineChecked", defaultValue = "true") boolean activeOfflineChecked
    ) {
        if (page != null && size != null) {
            return ResponseEntity.ok(adminService.getUsersPaginated(
                    page, size, role, search, status, timeFilter, timeStart, timeEnd,
                    filterEmployer, filterManager, filterStaff, activeOnlineChecked, activeOfflineChecked
            ));
        }
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

    @GetMapping("/gigs/pending")
    public ResponseEntity<List<com.cny.backend.admin.dto.PendingGigDto>> getPendingGigs() {
        return ResponseEntity.ok(adminService.getPendingGigs());
    }

    @PutMapping("/gigs/{id}/moderate")
    public ResponseEntity<Map<String, Object>> moderateGig(
            @PathVariable("id") int id,
            @RequestParam("approve") boolean approve,
            @RequestParam(value = "reason", required = false) String reason,
            @RequestHeader(value = "X-Admin-Id", required = false, defaultValue = "1") int adminId) {
        return ResponseEntity.ok(adminService.moderateGig(id, approve, reason, adminId));
    }

    @GetMapping("/withdrawals")
    public ResponseEntity<List<WithdrawalDto>> getWithdrawals() {
        return ResponseEntity.ok(adminService.getWithdrawals());
    }

    @PutMapping("/withdrawals/{id}/process")
    public ResponseEntity<Map<String, Object>> processWithdrawal(
            @PathVariable("id") int id,
            @RequestParam("status") String status,
            @RequestParam(value = "reason", required = false) String reason,
            @RequestHeader(value = "X-Admin-Id", required = false, defaultValue = "1") int adminId) {
        return ResponseEntity.ok(adminService.processWithdrawal(id, status, reason, adminId));
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

    @GetMapping("/profile-requests")
    public ResponseEntity<List<com.cny.backend.user.entity.EmployerProfileRequest>> getProfileRequests() {
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

    @PostMapping("/vnpay-transactions/{id}/query")
    public ResponseEntity<Map<String, Object>> queryVnpayTransaction(
            @PathVariable("id") int transactionId,
            @RequestHeader(value = "X-Admin-Id", required = false, defaultValue = "1") int adminId,
            jakarta.servlet.http.HttpServletRequest request) {
        
        String ipAddress = request.getHeader("X-Forwarded-For");
        if (ipAddress == null) {
            ipAddress = request.getRemoteAddr();
        }
        
        Map<String, Object> response = vnpayService.queryTransactionStatus(transactionId, ipAddress);
        adminService.writeAuditLog(adminId, "QUERY_VNPAY_TRANSACTION", "FINANCE", 
            "Truy vấn giao dịch VNPay ID: " + transactionId + ", kết quả: " + response.get("message"));
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/vnpay-transactions/{id}/refund")
    public ResponseEntity<Map<String, Object>> refundVnpayTransaction(
            @PathVariable("id") int transactionId,
            @RequestBody Map<String, Object> payload,
            @RequestHeader(value = "X-Admin-Id", required = false, defaultValue = "1") int adminId,
            jakarta.servlet.http.HttpServletRequest request) {
        
        java.math.BigDecimal amount = null;
        if (payload.get("amount") != null) {
            amount = new java.math.BigDecimal(payload.get("amount").toString());
        }
        String reason = (String) payload.get("reason");
        String createBy = "admin_" + adminId;
        
        String ipAddress = request.getHeader("X-Forwarded-For");
        if (ipAddress == null) {
            ipAddress = request.getRemoteAddr();
        }

        Map<String, Object> response = vnpayService.refundTransaction(transactionId, amount, reason, createBy, ipAddress);
        adminService.writeAuditLog(adminId, "REFUND_VNPAY_TRANSACTION", "FINANCE", 
            "Hoàn tiền giao dịch VNPay ID: " + transactionId + ", Lý do: " + reason + ", kết quả: " + response.get("message"));
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/payment/lookup-account")
    public ResponseEntity<Map<String, Object>> lookupBankAccount(
            @RequestBody Map<String, Object> body) {
        String bankCode = (String) body.get("bankCode");
        String accountNumber = (String) body.get("accountNumber");

        if (bankCode == null || bankCode.isBlank() || accountNumber == null || accountNumber.isBlank()) {
            Map<String, Object> err = new java.util.HashMap<>();
            err.put("success", false);
            err.put("message", "Thiếu mã ngân hàng hoặc số tài khoản");
            return ResponseEntity.badRequest().body(err);
        }

        Map<String, Object> result = vnpayService.lookupBankAccount(bankCode.trim(), accountNumber.trim());
        return ResponseEntity.ok(result);
    }
}
