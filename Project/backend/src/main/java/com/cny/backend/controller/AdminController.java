package com.cny.backend.controller;

import com.cny.backend.service.AdminService;
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

    // 1. GET /api/admin/stats - Overview Dashboard metrics with date filters
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats(@RequestParam(value = "period", defaultValue = "30days") String period) {
        return ResponseEntity.ok(adminService.getStats(period));
    }

    // 2. GET /api/admin/charts/user-growth - Real DB-driven user registration trends
    @GetMapping("/charts/user-growth")
    public ResponseEntity<List<Map<String, Object>>> getUserGrowthTrend() {
        return ResponseEntity.ok(adminService.getUserGrowthTrend());
    }

    // 3. GET /api/admin/charts/revenue - Real quarterly/monthly revenue distribution
    @GetMapping("/charts/revenue")
    public ResponseEntity<List<Map<String, Object>>> getRevenueTrend() {
        return ResponseEntity.ok(adminService.getRevenueTrend());
    }

    // 4. GET /api/admin/fee-config - Fetch current platform fee config
    @GetMapping("/fee-config")
    public ResponseEntity<Map<String, Object>> getFeeConfig() {
        return ResponseEntity.ok(adminService.getFeeConfig());
    }

    // 5. POST /api/admin/fee-config - Dynamically update platform fee config
    @PostMapping("/fee-config")
    public ResponseEntity<Map<String, Object>> updateFeeConfig(
            @RequestParam("fee") double fee,
            @RequestHeader(value = "X-Admin-Id", required = false, defaultValue = "1") int adminId) {
        return ResponseEntity.ok(adminService.updateFeeConfig(fee, adminId));
    }

    @GetMapping("/users")
    public ResponseEntity<List<Map<String, Object>>> getUsers() {
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
    public ResponseEntity<List<Map<String, Object>>> getPendingProjects() {
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

    // 10. GET /api/admin/withdrawals - Financial Processing
    @GetMapping("/withdrawals")
    public ResponseEntity<List<Map<String, Object>>> getWithdrawals() {
        return ResponseEntity.ok(adminService.getWithdrawals());
    }

    // 11. PUT /api/admin/withdrawals/{id}/process - Process Withdrawal Request
    @PutMapping("/withdrawals/{id}/process")
    public ResponseEntity<Map<String, Object>> processWithdrawal(
            @PathVariable("id") int id,
            @RequestParam("status") String status,
            @RequestHeader(value = "X-Admin-Id", required = false, defaultValue = "1") int adminId) {
        return ResponseEntity.ok(adminService.processWithdrawal(id, status, adminId));
    }

    // 12. GET /api/admin/audit-logs - System Audit Logs
    @GetMapping("/audit-logs")
    public ResponseEntity<List<Map<String, Object>>> getAuditLogs() {
        return ResponseEntity.ok(adminService.getAuditLogs());
    }

    @GetMapping("/job-categories")
    public ResponseEntity<List<Map<String, Object>>> getJobCategories() {
        return ResponseEntity.ok(adminService.getJobCategories());
    }

    // 14. GET /api/admin/kyc-requests - KYC Approval (UC-31)
    @GetMapping("/kyc-requests")
    public ResponseEntity<List<Map<String, Object>>> getKycRequests() {
        return ResponseEntity.ok(adminService.getKycRequests());
    }

    // 15. GET /api/admin/disputes - Dispute Resolution (UC-32)
    @GetMapping("/disputes")
    public ResponseEntity<List<Map<String, Object>>> getDisputes() {
        return ResponseEntity.ok(adminService.getDisputes());
    }

    // 16. GET /api/admin/reports - Report Management (UC-34)
    @GetMapping("/reports")
    public ResponseEntity<List<Map<String, Object>>> getReports() {
        return ResponseEntity.ok(adminService.getReports());
    }

    // 17. GET /api/admin/articles - CMS Articles (UC-40)
    @GetMapping("/articles")
    public ResponseEntity<List<Map<String, Object>>> getArticles() {
        return ResponseEntity.ok(adminService.getArticles());
    }

    // 18. GET /api/admin/tickets - Support Tickets (UC-41)
    @GetMapping("/tickets")
    public ResponseEntity<List<Map<String, Object>>> getTickets() {
        return ResponseEntity.ok(adminService.getTickets());
    }

    // 19. GET /api/admin/seo-configs - SEO Configuration (UC-42)
    @GetMapping("/seo-configs")
    public ResponseEntity<List<Map<String, Object>>> getSeoConfigs() {
        return ResponseEntity.ok(adminService.getSeoConfigs());
    }
}
