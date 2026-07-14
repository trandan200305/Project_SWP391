package com.cny.backend.admin.controller;

import com.cny.backend.admin.dto.WithdrawalDto;
import com.cny.backend.admin.entity.PaymentTransaction;
import com.cny.backend.admin.service.AdminService;
import com.cny.backend.admin.service.VNPayService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/finance")
@CrossOrigin(origins = "*")
public class FinanceStaffController {

    @Autowired
    private AdminService adminService;

    @Autowired
    private VNPayService vnpayService;

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
    
    @PostMapping("/vnpay-transactions/{id}/report-suspicious")
    public ResponseEntity<Map<String, Object>> reportSuspicious(
            @PathVariable("id") int transactionId,
            @RequestBody Map<String, String> payload,
            @RequestHeader(value = "X-Admin-Id", required = false, defaultValue = "1") int adminId) {
        
        // TODO: Implement suspicious reporting logic
        adminService.writeAuditLog(adminId, "REPORT_SUSPICIOUS_TRANSACTION", "FINANCE",
                "Báo cáo giao dịch bất thường VNPay ID: " + transactionId + ", Lý do: " + payload.get("reason"));

        return ResponseEntity.ok(Map.of("success", true, "message", "Đã đánh dấu giao dịch bất thường."));
    }
}
