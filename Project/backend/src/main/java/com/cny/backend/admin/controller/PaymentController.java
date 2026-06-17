package com.cny.backend.admin.controller;

import com.cny.backend.admin.entity.PaymentTransaction;
import com.cny.backend.admin.entity.Transaction;
import com.cny.backend.admin.repository.PaymentTransactionRepository;
import com.cny.backend.admin.repository.TransactionRepository;
import com.cny.backend.admin.service.AdminService;
import com.cny.backend.admin.service.VNPayService;
import com.cny.backend.project.entity.Project;
import com.cny.backend.project.repository.ProjectRepository;
import com.cny.backend.project.service.ProjectService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/payment")
@CrossOrigin(origins = "*")
public class PaymentController {

    @Autowired
    private VNPayService vnpayService;

    @Autowired
    private PaymentTransactionRepository paymentTransactionRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private ProjectService projectService;

    @Autowired
    private AdminService adminService;

    @PostMapping("/create-url")
    public ResponseEntity<?> createPaymentUrl(@RequestParam Integer projectId, HttpServletRequest request) {
        try {
            Project project = projectRepository.findById(projectId)
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy Dự án với ID: " + projectId));

            // Calculate posting fee based on platform fee percentage configuration
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
            // Ensure minimum fee of 50,000 VND
            if (feeAmount.compareTo(new BigDecimal("50000")) < 0) {
                feeAmount = new BigDecimal("50000");
            }

            // Create unique transaction reference
            String txnRef = "CNY_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 8);

            PaymentTransaction txn = PaymentTransaction.builder()
                    .txnRef(txnRef)
                    .employerId(project.getClient().getEmployerId())
                    .projectId(projectId)
                    .amount(feeAmount)
                    .status("PENDING")
                    .build();

            paymentTransactionRepository.save(txn);

            // Get Client IP Address
            String ipAddress = request.getHeader("X-Forwarded-For");
            if (ipAddress == null) {
                ipAddress = request.getRemoteAddr();
            }

            String paymentUrl = vnpayService.generatePaymentUrl(txn, ipAddress);

            com.cny.backend.admin.entity.VnpayConfig vnpayConfig = adminService.getVnpayConfig();

            Map<String, String> response = new HashMap<>();
            response.put("paymentUrl", paymentUrl);
            response.put("txnRef", txnRef);
            response.put("amount", feeAmount.toString());
            response.put("bankName", vnpayConfig.getBankName());
            response.put("bankAccountNo", vnpayConfig.getBankAccountNo());
            response.put("bankAccountName", vnpayConfig.getBankAccountName());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    @GetMapping("/vnpay-ipn")
    @ResponseBody
    public ResponseEntity<?> vnpayIpn(@RequestParam Map<String, String> allParams) {
        Map<String, String> responseBody = new HashMap<>();
        
        try {
            if (!vnpayService.verifySignature(allParams)) {
                responseBody.put("RspCode", "97");
                responseBody.put("Message", "Invalid Signature");
                return ResponseEntity.ok(responseBody);
            }

            String txnRef = allParams.get("vnp_TxnRef");
            Optional<PaymentTransaction> txnOpt = paymentTransactionRepository.findByTxnRef(txnRef);
            if (txnOpt.isEmpty()) {
                responseBody.put("RspCode", "01");
                responseBody.put("Message", "Order not found");
                return ResponseEntity.ok(responseBody);
            }

            PaymentTransaction txn = txnOpt.get();
            
            // Check amount (vnp_Amount is in cents, need to divide by 100)
            long vnpAmountLong = Long.parseLong(allParams.get("vnp_Amount"));
            BigDecimal vnpAmount = BigDecimal.valueOf(vnpAmountLong).divide(BigDecimal.valueOf(100));
            if (txn.getAmount().compareTo(vnpAmount) != 0) {
                responseBody.put("RspCode", "04");
                responseBody.put("Message", "Invalid Amount");
                return ResponseEntity.ok(responseBody);
            }

            // Check if transaction is already processed
            if (!"PENDING".equals(txn.getStatus())) {
                responseBody.put("RspCode", "02");
                responseBody.put("Message", "Order already confirmed");
                return ResponseEntity.ok(responseBody);
            }

            String responseCode = allParams.get("vnp_ResponseCode");
            String transactionNo = allParams.get("vnp_TransactionNo");
            
            if ("00".equals(responseCode)) {
                txn.setStatus("SUCCESS");
                txn.setVnpTransactionNo(transactionNo);
                paymentTransactionRepository.save(txn);
                
                // Publish project and log platform fee
                projectService.publishProjectAfterPayment(txn.getProjectId(), txn.getAmount());
            } else {
                txn.setStatus("FAILED");
                txn.setVnpTransactionNo(transactionNo);
                paymentTransactionRepository.save(txn);
            }

            responseBody.put("RspCode", "00");
            responseBody.put("Message", "Confirm Success");
            return ResponseEntity.ok(responseBody);

        } catch (Exception e) {
            responseBody.put("RspCode", "99");
            responseBody.put("Message", "Unknown Error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(responseBody);
        }
    }

    @GetMapping("/vnpay-return")
    public void vnpayReturn(@RequestParam Map<String, String> allParams, HttpServletResponse response) throws IOException {
        String status = "failed";
        Integer projectId = null;
        String txnRef = allParams.get("vnp_TxnRef");

        try {
            if (vnpayService.verifySignature(allParams)) {
                Optional<PaymentTransaction> txnOpt = paymentTransactionRepository.findByTxnRef(txnRef);
                if (txnOpt.isPresent()) {
                    PaymentTransaction txn = txnOpt.get();
                    projectId = txn.getProjectId();
                    String responseCode = allParams.get("vnp_ResponseCode");
                    
                    if ("00".equals(responseCode)) {
                        status = "success";
                        // Make sure to process state even if IPN was delayed
                        if ("PENDING".equals(txn.getStatus())) {
                            txn.setStatus("SUCCESS");
                            txn.setVnpTransactionNo(allParams.get("vnp_TransactionNo"));
                            paymentTransactionRepository.save(txn);
                            projectService.publishProjectAfterPayment(txn.getProjectId(), txn.getAmount());
                        }
                    } else {
                        status = "failed";
                        if ("PENDING".equals(txn.getStatus())) {
                            txn.setStatus("FAILED");
                            txn.setVnpTransactionNo(allParams.get("vnp_TransactionNo"));
                            paymentTransactionRepository.save(txn);
                        }
                    }
                }
            }
        } catch (Exception e) {
            status = "error";
        }

        // Redirect back to React frontend page
        // Standard ports: 3000 / 5173
        String redirectUrl = "http://localhost:3000/payment-result?status=" + status;
        if (projectId != null) {
            redirectUrl += "&projectId=" + projectId;
        }
        response.sendRedirect(redirectUrl);
    }
}
