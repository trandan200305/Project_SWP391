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
import com.cny.backend.user.entity.Employer;
import com.cny.backend.user.repository.EmployerRepository;
import com.cny.backend.admin.entity.ServicePackageConfig;
import com.cny.backend.admin.repository.ServicePackageConfigRepository;
import com.cny.backend.project.entity.JobCategory;
import com.cny.backend.project.repository.JobCategoryRepository;
import com.cny.backend.admin.entity.PaymentInvoice;
import com.cny.backend.admin.repository.PaymentInvoiceRepository;
import com.cny.backend.admin.service.ViettelSInvoiceService;
import com.cny.backend.email.service.EmailService;
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
import java.util.concurrent.CompletableFuture;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/payment")
@CrossOrigin(origins = "*")
public class PaymentController {

    private static final Logger log = LoggerFactory.getLogger(PaymentController.class);

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

    @Autowired
    private EmployerRepository employerRepository;

    @Autowired
    private ServicePackageConfigRepository servicePackageConfigRepository;

    @Autowired
    private JobCategoryRepository jobCategoryRepository;

    @Autowired
    private PaymentInvoiceRepository paymentInvoiceRepository;

    @Autowired
    private ViettelSInvoiceService sInvoiceService;

    @Autowired
    private EmailService emailService;

    @PostMapping("/create-url")
    public ResponseEntity<?> createPaymentUrl(
            @RequestParam(required = false) Integer projectId,
            @RequestParam(required = false) String packageType,
            @RequestParam(required = false) Integer employerId,
            HttpServletRequest request) {
        try {
            Project project = null;
            if (projectId != null) {
                project = projectRepository.findById(projectId)
                        .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy Dự án với ID: " + projectId));
            }

            Employer client = null;
            if (employerId != null) {
                client = employerRepository.findById(employerId)
                        .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy Nhà tuyển dụng với ID: " + employerId));
            } else {
                client = employerRepository.findAll().stream().findFirst().orElseGet(() -> {
                    Employer dummyEmp = Employer.builder()
                            .email("employer_test@lancerpro.com")
                            .passwordHash("hashed")
                            .displayName("Employer Test")
                            .fullName("Employer Test")
                            .status("ACTIVE")
                            .isVerified(true)
                            .isDeleted(false)
                            .createdAt(LocalDateTime.now())
                            .build();
                    return employerRepository.save(dummyEmp);
                });
            }

            double price = 0.0;
            if (project != null && project.getServiceFee() != null) {
                price = project.getServiceFee();
            } else if (packageType != null) {
                String pkgUpper = packageType.toUpperCase();
                Optional<ServicePackageConfig> configOpt = servicePackageConfigRepository.findByPackageType(pkgUpper);
                if (configOpt.isPresent()) {
                    price = configOpt.get().getPrice();
                } else {
                    double defaultPrice = "PREMIUM".equals(pkgUpper) ? 500000.0 : ("MEDIUM".equals(pkgUpper) ? 250000.0 : 100000.0);
                    int duration = "PREMIUM".equals(pkgUpper) ? 30 : ("MEDIUM".equals(pkgUpper) ? 10 : 20);
                    ServicePackageConfig newCfg = ServicePackageConfig.builder()
                            .packageType(pkgUpper)
                            .price(defaultPrice)
                            .durationDays(duration)
                            .postLimit(10)
                            .build();
                    try {
                        servicePackageConfigRepository.save(newCfg);
                    } catch (Exception e) {}
                    price = defaultPrice;
                }
            } else {
                throw new IllegalArgumentException("Vui lòng cung cấp projectId hoặc packageType");
            }

            BigDecimal feeAmount = BigDecimal.valueOf(price);

            // create unique transaction reference
            String txnRef = "CNY_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 8);

            PaymentTransaction txn = PaymentTransaction.builder()
                    .txnRef(txnRef)
                    .employerId(project != null ? project.getClient().getEmployerId() : client.getEmployerId())
                    .projectId(project != null ? project.getProjectId() : (projectId != null ? projectId : null))
                    .packageType(packageType != null ? packageType.toUpperCase() : null)
                    .amount(feeAmount)
                    .status("PENDING")
                    .build();

            paymentTransactionRepository.save(txn);

            // get client ip address
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
                
                if (txn.getEmployerId() != null && txn.getAmount() != null) {
                    employerRepository.findById(txn.getEmployerId()).ifPresent(employer -> {
                        com.cny.backend.user.util.EmployerTierUtils.updateEmployerSpending(employer, txn.getAmount(), employerRepository);
                    });
                }

                // Publish project and log platform fee if this was a project payment
                if (txn.getProjectId() != null) {
                    projectService.publishProjectAfterPayment(txn.getProjectId(), txn.getAmount());
                } else if (txn.getPackageType() != null) {
                    employerRepository.findById(txn.getEmployerId()).ifPresent(employer -> {
                        String pkgUpper = txn.getPackageType().toUpperCase();
                        int postLimit = 10;
                        int durationDays = 30;

                        Optional<ServicePackageConfig> configOpt = servicePackageConfigRepository.findByPackageType(pkgUpper);
                        if (configOpt.isPresent()) {
                            postLimit = configOpt.get().getPostLimit();
                            durationDays = configOpt.get().getDurationDays();
                        } else {
                            if ("REGULAR".equals(pkgUpper)) { postLimit = 5; durationDays = 15; }
                            else if ("PREMIUM".equals(pkgUpper)) { postLimit = 20; durationDays = 30; }
                        }

                        int currentQuota = employer.getPackagePostQuota() != null && employer.getPackagePostQuota() > 0 ? employer.getPackagePostQuota() : 0;
                        employer.setCurrentPackageType(pkgUpper);
                        employer.setPackagePostQuota(currentQuota + postLimit);
                        employer.setPackageExpiryDate(LocalDateTime.now().plusDays(durationDays));
                        employerRepository.save(employer);
                    });
                }

                // TỰ ĐỘNG XUẤT HÓA ĐƠN VÀ GỬI EMAIL
                if (txn.getEmployerId() != null && txn.getAmount() != null) {
                    PaymentInvoice invoice = PaymentInvoice.builder()
                            .invoiceNumber("INV-" + System.currentTimeMillis())
                            .transactionId(txn.getId())
                            .employerId(txn.getEmployerId())
                            .description(txn.getProjectId() != null ? "Thanh toán dịch vụ dự án " + txn.getProjectId() : "Thanh toán gói dịch vụ " + txn.getPackageType())
                            .amount(txn.getAmount())
                            .totalAmount(txn.getAmount())
                            .issuedAt(LocalDateTime.now())
                            .status("PAID")
                            .build();
                    paymentInvoiceRepository.save(invoice);

                    CompletableFuture.runAsync(() -> {
                        try {
                            employerRepository.findById(txn.getEmployerId()).ifPresent(employer -> {
                                Map<String, Object> result = sInvoiceService.createInvoice(invoice, employer);
                                if ((boolean) result.getOrDefault("success", false)) {
                                    String viettelInvoiceNo = (String) result.get("invoiceNo");
                                    invoice.setViettelInvoiceNo(viettelInvoiceNo);
                                    invoice.setViettelTransactionUuid((String) result.get("transactionUuid"));
                                    invoice.setViettelStatus("ISSUED");
                                    paymentInvoiceRepository.save(invoice);

                                    // Tải file PDF từ Viettel
                                    byte[] pdfBytes = sInvoiceService.downloadInvoicePdf(viettelInvoiceNo);
                                    if (pdfBytes != null && pdfBytes.length > 0) {
                                        // Gửi Email
                                        String subject = "Hóa đơn điện tử dịch vụ LancerPro - Số " + viettelInvoiceNo;
                                        String body = "<p>Kính gửi " + employer.getFullName() + ",</p>"
                                                + "<p>Cảm ơn bạn đã thanh toán dịch vụ trên LancerPro. Hệ thống xin gửi đính kèm Hóa đơn điện tử (PDF) chính thức từ Viettel SInvoice cho giao dịch vừa thực hiện.</p>"
                                                + "<p>Trân trọng,<br>Đội ngũ LancerPro</p>";
                                        emailService.sendEmailWithAttachmentAsync(employer.getEmail(), subject, body, "HoaDon_" + viettelInvoiceNo + ".pdf", pdfBytes);
                                    }
                                } else {
                                    log.error("Lỗi xuất SInvoice tự động: {}", result.get("message"));
                                }
                            });
                        } catch (Exception e) {
                            log.error("Lỗi hệ thống khi tự động xuất hóa đơn", e);
                        }
                    });
                }
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

                            if (txn.getEmployerId() != null && txn.getAmount() != null) {
                                employerRepository.findById(txn.getEmployerId()).ifPresent(employer -> {
                                    com.cny.backend.user.util.EmployerTierUtils.updateEmployerSpending(employer, txn.getAmount(), employerRepository);
                                });
                            }
                            if (txn.getProjectId() != null) {
                                projectService.publishProjectAfterPayment(txn.getProjectId(), txn.getAmount());
                            } else if (txn.getPackageType() != null) {
                                employerRepository.findById(txn.getEmployerId()).ifPresent(employer -> {
                                    servicePackageConfigRepository.findByPackageType(txn.getPackageType().toUpperCase()).ifPresent(config -> {
                                        employer.setCurrentPackageType(txn.getPackageType().toUpperCase());
                                        employer.setPackagePostQuota(config.getPostLimit());
                                        employer.setPackageExpiryDate(LocalDateTime.now().plusDays(config.getDurationDays()));
                                        employerRepository.save(employer);
                                    });
                                });
                            }
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
