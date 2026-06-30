package com.cny.backend.admin.controller;

import com.cny.backend.admin.entity.PaymentTransaction;
import com.cny.backend.admin.repository.PaymentTransactionRepository;
import com.cny.backend.project.entity.Project;
import com.cny.backend.project.repository.ProjectRepository;
import com.cny.backend.project.service.ProjectService;
import com.cny.backend.admin.service.AdminService;
import com.cny.backend.admin.repository.DashboardRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import vn.payos.PayOS;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkRequest;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkResponse;
import vn.payos.model.v2.paymentRequests.PaymentLinkItem;
import vn.payos.model.v2.paymentRequests.PaymentLink;
import vn.payos.model.webhooks.WebhookData;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/payment/payos")
@CrossOrigin(origins = "*")
@Transactional
public class PayOSController {

    @Autowired
    private PayOS payOS;

    @Autowired
    private PaymentTransactionRepository transactionRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private ProjectService projectService;

    @Autowired
    private DashboardRepository dashboardRepository;

    @Autowired
    private AdminService adminService;

    @PostMapping("/create-url")
    public ResponseEntity<?> createPaymentUrl(@RequestParam Integer projectId, HttpServletRequest request) {
        try {
            Project project = projectRepository.findById(projectId)
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy Dự án với ID: " + projectId));

            double feePercent = adminService.getFeeConfig().getFee();
            BigDecimal budget = project.getBudgetFixed();
            if (budget == null) {
                if (project.getBudgetMin() != null && project.getBudgetMax() != null) {
                    budget = project.getBudgetMin().add(project.getBudgetMax()).divide(new BigDecimal("2"));
                } else {
                    budget = new BigDecimal("500000"); // fallback 500k VND
                }
            }
            BigDecimal feeAmount = budget.multiply(BigDecimal.valueOf(feePercent)).divide(BigDecimal.valueOf(100));
            if (feeAmount.compareTo(new BigDecimal("50000")) < 0) {
                feeAmount = new BigDecimal("50000");
            }

            // Tạo orderCode: format UserID + HHmmss (Phải đảm bảo là một số nguyên theo chuẩn PayOS)
            String timeStamp = java.time.LocalTime.now().format(DateTimeFormatter.ofPattern("HHmmss"));
            String orderCodeStr = project.getClient().getEmployerId() + timeStamp;
            long orderCode = Long.parseLong(orderCodeStr); // Ví dụ: 102143022
            String txnRef = String.valueOf(orderCode);

            PaymentTransaction txn = PaymentTransaction.builder()
                    .txnRef(txnRef)
                    .employerId(project.getClient().getEmployerId())
                    .projectId(projectId)
                    .amount(feeAmount)
                    .status("PENDING")
                    .build();

            transactionRepository.save(txn);

            // Thời gian hết hạn: hiện tại + 30 phút. (PayOS SDK 2.0.1 dùng Unix timestamp tính bằng giây)
            long expiredAt = LocalDateTime.now().plusMinutes(30).toEpochSecond(ZoneOffset.ofHours(7));
            
            // Tên item giới hạn, PayOS ko cho tên quá dài
            PaymentLinkItem item = PaymentLinkItem.builder()
                .name("Phi dang tin ID " + projectId)
                .quantity(1)
                .price(feeAmount.longValue())
                .build();

            String returnUrl = "http://localhost:8080/api/payment/payos/return";
            String cancelUrl = "http://localhost:8080/api/payment/payos/return";

            CreatePaymentLinkRequest paymentData = CreatePaymentLinkRequest.builder()
                    .orderCode(orderCode)
                    .amount(feeAmount.longValue())
                    .description("Thanh toan ID " + projectId) // Description tối đa 25 ký tự!
                    .returnUrl(returnUrl)
                    .cancelUrl(cancelUrl)
                    .item(item)
                    .expiredAt(expiredAt)
                    .build();

            CreatePaymentLinkResponse data = payOS.paymentRequests().create(paymentData);

            Map<String, String> response = new HashMap<>();
            response.put("paymentUrl", data.getCheckoutUrl());
            response.put("txnRef", txnRef);
            response.put("qrCode", data.getQrCode());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, String> err = new HashMap<>();
            err.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(err);
        }
    }

    @PostMapping("/webhook")
    public ResponseEntity<?> handleWebhook(@RequestBody Object body) {
        try {
            WebhookData data = payOS.webhooks().verify(body);

            if (data == null) {
                return ResponseEntity.badRequest().body("Webhook verification failed");
            }

            String txnRef = String.valueOf(data.getOrderCode());

            Optional<PaymentTransaction> txnOpt = transactionRepository.findByTxnRef(txnRef);
            if (txnOpt.isPresent()) {
                PaymentTransaction txn = txnOpt.get();
                if ("PENDING".equals(txn.getStatus()) && data.getCode().equals("00")) {
                    txn.setStatus("SUCCESS");
                    txn.setVnpTransactionNo(data.getReference()); 
                    transactionRepository.save(txn);
                    
                    // Duyệt tự động: kích hoạt dự án
                    projectService.publishProjectAfterPayment(txn.getProjectId(), txn.getAmount());
                    
                    // Lưu lịch sử (Giả sử Admin ID = 1 cho hệ thống tự động)
                    dashboardRepository.logAudit(1, "PAYOS_WEBHOOK", "FINANCE", "Hệ thống tự động duyệt thanh toán PayOS cho dự án ID: " + txn.getProjectId() + ", Mã đơn: " + txn.getTxnRef());
                }
            }
            
            Map<String, Boolean> res = new HashMap<>();
            res.put("success", true);
            return ResponseEntity.ok(res);

        } catch (Exception e) {
            e.printStackTrace();
            Map<String, Boolean> res = new HashMap<>();
            res.put("success", false);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(res);
        }
    }

    @PostMapping("/query")
    public ResponseEntity<?> queryPayosTransaction(@RequestParam String txnRef, @RequestHeader(value = "X-Admin-Id", required = false, defaultValue = "1") int adminId) {
        try {
            long orderCode = Long.parseLong(txnRef);
            PaymentLink link = payOS.paymentRequests().get(orderCode);
            
            String payosStatus = link.getStatus().name(); // e.g. PENDING, CANCELLED, PAID
            
            Optional<PaymentTransaction> txnOpt = transactionRepository.findByTxnRef(txnRef);
            if (txnOpt.isPresent()) {
                PaymentTransaction txn = txnOpt.get();
                if ("PENDING".equals(txn.getStatus())) {
                    if ("CANCELLED".equalsIgnoreCase(payosStatus) || "EXPIRED".equalsIgnoreCase(payosStatus)) {
                        txn.setStatus("CANCELLED");
                        transactionRepository.save(txn);
                    } else if ("PAID".equalsIgnoreCase(payosStatus) || "SUCCESS".equalsIgnoreCase(payosStatus)) {
                        txn.setStatus("SUCCESS");
                        transactionRepository.save(txn);
                        projectService.publishProjectAfterPayment(txn.getProjectId(), txn.getAmount());
                    }
                }
            }
            
            Map<String, Object> res = new HashMap<>();
            res.put("success", true);
            res.put("message", "Trạng thái trên PayOS: " + payosStatus);
            res.put("payosStatus", payosStatus);
            
            dashboardRepository.logAudit(adminId, "QUERY_PAYOS_TRANSACTION", "FINANCE", "Truy vấn giao dịch PayOS " + txnRef + " - Trạng thái: " + payosStatus);

            return ResponseEntity.ok(res);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", "Lỗi khi truy vấn PayOS: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(err);
        }
    }

    @GetMapping("/return")
    public void payosReturn(@RequestParam Map<String, String> allParams, HttpServletResponse response) throws IOException {
        String status = "failed";
        Integer projectId = null;
        try {
            String orderCodeStr = allParams.get("orderCode");
            String cancel = allParams.get("cancel");
            if (orderCodeStr != null && !orderCodeStr.isEmpty()) {
                Optional<PaymentTransaction> txnOpt = transactionRepository.findByTxnRef(orderCodeStr);
                if (txnOpt.isPresent()) {
                    PaymentTransaction txn = txnOpt.get();
                    projectId = txn.getProjectId();
                    if ("true".equals(cancel)) {
                        status = "failed";
                        if ("PENDING".equals(txn.getStatus())) {
                            txn.setStatus("FAILED");
                            transactionRepository.save(txn);
                        }
                    } else if ("PAID".equals(allParams.get("status")) || "00".equals(allParams.get("code"))) {
                        status = "success";
                        // Webhook usually handles the success logic, but we can also set status here if needed.
                        // Let webhook handle the project publishing to avoid race conditions.
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        String redirectUrl = "http://localhost:3000/payment-result?status=" + status;
        if (projectId != null) {
            redirectUrl += "&projectId=" + projectId;
        }
        response.sendRedirect(redirectUrl);
    }
}
