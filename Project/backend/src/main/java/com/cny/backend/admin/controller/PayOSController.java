package com.cny.backend.admin.controller;

import com.cny.backend.admin.entity.PaymentTransaction;
import com.cny.backend.admin.service.PayOSService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.payos.PayOS;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkResponse;
import vn.payos.model.webhooks.WebhookData;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/payment/payos")
@CrossOrigin(origins = "*")
public class PayOSController {

    @Autowired
    private PayOSService payOSService;

    @Autowired
    private PaymentController paymentController;

    @Autowired
    private PayOS payOS;

    @PostMapping("/create-url")
    public ResponseEntity<?> createPaymentUrl(
            @RequestParam(required = false) Integer projectId,
            @RequestParam(required = false) String packageType,
            HttpServletRequest request) {
        
        if (!payOSService.isPayosHealthy()) {
            System.out.println("PayOS is DOWN. Falling back to VNPay.");
            return (ResponseEntity<?>) paymentController.createPaymentUrl(projectId, packageType, request);
        }

        try {
            CreatePaymentLinkResponse data = payOSService.createPaymentUrl(projectId, packageType);

            Map<String, String> response = new HashMap<>();
            response.put("paymentUrl", data.getCheckoutUrl());
            // txnRef in this context is the orderCode string
            response.put("txnRef", String.valueOf(data.getOrderCode()));
            response.put("qrCode", data.getQrCode());

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, String> err = new HashMap<>();
            err.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(err);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, String> err = new HashMap<>();
            err.put("message", "Lỗi tạo URL PayOS: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(err);
        }
    }

    @PostMapping("/webhook")
    public ResponseEntity<?> handleWebhook(@RequestBody Object body) {
        try {
            WebhookData data = payOS.webhooks().verify(body);
            boolean success = payOSService.handleWebhookData(data);
            
            if (!success) {
                return ResponseEntity.badRequest().body("Webhook verification failed");
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
            String payosStatus = payOSService.queryTransaction(txnRef, adminId);
            
            Map<String, Object> res = new HashMap<>();
            res.put("success", true);
            res.put("message", "Trạng thái trên PayOS: " + payosStatus);
            res.put("payosStatus", payosStatus);

            return ResponseEntity.ok(res);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", "Lỗi khi truy vấn PayOS: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(err);
        }
    }

    @PostMapping("/cancel")
    public ResponseEntity<?> cancelPayment(@RequestParam String txnRef, @RequestHeader(value = "X-Admin-Id", required = false, defaultValue = "1") int adminId) {
        try {
            payOSService.cancelTransaction(txnRef, adminId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Đã hủy thanh toán và vô hiệu hóa QR code PayOS thành công"));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("success", false, "message", "Lỗi: " + e.getMessage()));
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
                PaymentTransaction txn = payOSService.getTransactionByRef(orderCodeStr);
                if (txn != null) {
                    projectId = txn.getProjectId();
                    if ("true".equals(cancel)) {
                        status = "failed";
                        if ("PENDING".equals(txn.getStatus())) {
                            payOSService.updateTransactionToFailed(txn);
                            
                            try {
                                long orderCode = Long.parseLong(orderCodeStr);
                                payOS.paymentRequests().cancel(orderCode);
                            } catch (Exception e) {
                                System.err.println("Lỗi khi hủy thanh toán trên PayOS: " + e.getMessage());
                            }
                        }
                    } else if ("PAID".equals(allParams.get("status")) || "00".equals(allParams.get("code"))) {
                        status = "success";
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
