package com.cny.backend.admin.service;

import com.cny.backend.admin.entity.PaymentTransaction;
import com.cny.backend.admin.repository.PaymentTransactionRepository;
import com.cny.backend.project.entity.Project;
import com.cny.backend.project.repository.ProjectRepository;
import com.cny.backend.project.service.ProjectService;
import com.cny.backend.admin.repository.DashboardRepository;
import com.cny.backend.user.entity.Employer;
import com.cny.backend.user.repository.EmployerRepository;
import com.cny.backend.admin.entity.ServicePackageConfig;
import com.cny.backend.admin.repository.ServicePackageConfigRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.payos.PayOS;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkRequest;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkResponse;
import vn.payos.model.v2.paymentRequests.PaymentLinkItem;
import vn.payos.model.v2.paymentRequests.PaymentLink;
import vn.payos.model.webhooks.WebhookData;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class PayOSService {

    @Autowired
    private PayOS payOS;

    @Autowired
    private PaymentTransactionRepository transactionRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private EmployerRepository employerRepository;

    @Autowired
    private ServicePackageConfigRepository servicePackageConfigRepository;


    @Autowired
    private ProjectService projectService;

    @Autowired
    private com.cny.backend.admin.service.InvoiceService invoiceService;

    @Autowired
    private com.cny.backend.invoice.service.InvoiceService viettelInvoiceService;

    @Autowired
    private DashboardRepository dashboardRepository;

    public boolean isPayosHealthy() {
        try {
            org.springframework.http.client.SimpleClientHttpRequestFactory factory = new org.springframework.http.client.SimpleClientHttpRequestFactory();
            factory.setConnectTimeout(2000);
            factory.setReadTimeout(2000);
            org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate(factory);
            try {
                restTemplate.getForEntity("https://api-merchant.payos.vn", String.class);
                return true;
            } catch (org.springframework.web.client.HttpStatusCodeException ex) {
                return true; // 404, 401 etc means server is responding
            }
        } catch (Exception e) {
            return false;
        }
    }

    public CreatePaymentLinkResponse createPaymentUrl(Integer projectId, String packageType, Integer employerIdReq) throws Exception {
        Project project = null;
        if (projectId != null) {
            project = projectRepository.findById(projectId)
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy Dự án với ID: " + projectId));
        }

        Employer client = null;
        if (employerIdReq != null) {
            client = employerRepository.findById(employerIdReq)
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy Nhà tuyển dụng với ID: " + employerIdReq));
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
            Optional<ServicePackageConfig> configOpt = servicePackageConfigRepository.findByPackageType(packageType.toUpperCase());
            if (configOpt.isPresent()) {
                price = configOpt.get().getPrice();
            } else {
                throw new IllegalArgumentException("Không tìm thấy cấu hình giá cho gói dịch vụ: " + packageType);
            }
        } else {
            throw new IllegalArgumentException("Vui lòng cung cấp projectId hoặc packageType");
        }

        BigDecimal feeAmount = BigDecimal.valueOf(price);

        String timeStamp = java.time.LocalTime.now().format(DateTimeFormatter.ofPattern("HHmmss"));
        Integer employerId = project != null ? project.getClient().getEmployerId() : client.getEmployerId();
        String orderCodeStr = employerId + timeStamp;
        long orderCode = Long.parseLong(orderCodeStr);
        String txnRef = String.valueOf(orderCode);

        // Hủy các giao dịch PENDING cũ của dự án
        if (project != null) {
            List<PaymentTransaction> pendingTxns = transactionRepository.findByProjectIdAndStatus(project.getProjectId(), "PENDING");
            for (PaymentTransaction pendingTxn : pendingTxns) {
                pendingTxn.setStatus("FAILED");
                transactionRepository.save(pendingTxn);
                try {
                    long oldOrderCode = Long.parseLong(pendingTxn.getTxnRef());
                    payOS.paymentRequests().cancel(oldOrderCode);
                } catch (Exception e) {
                    System.err.println("Không thể hủy link PayOS cũ (orderCode: " + pendingTxn.getTxnRef() + "): " + e.getMessage());
                }
            }
        }

        PaymentTransaction txn = PaymentTransaction.builder()
                .txnRef(txnRef)
                .employerId(employerId)
                .projectId(project != null ? project.getProjectId() : null)
                .packageType(packageType != null ? packageType.toUpperCase() : null)
                .amount(feeAmount)
                .status("PENDING")
                .build();

        transactionRepository.save(txn);

        int timeoutMinutes = 30;        
        long expiredAt = LocalDateTime.now().plusMinutes(timeoutMinutes).toEpochSecond(ZoneOffset.ofHours(7));
        
        String pkgType = (packageType != null) ? packageType.toUpperCase() : (project != null && project.getServicePackage() != null ? project.getServicePackage().toUpperCase() : "MEDIUM");
        String friendlyPkgName;
        if ("MEDIUM".equals(pkgType)) {
            friendlyPkgName = "Goi MEDIUM";
        } else if ("REGULAR".equals(pkgType)) {
            friendlyPkgName = "Goi REGULAR";
        } else if ("PREMIUM".equals(pkgType)) {
            friendlyPkgName = "Goi PREMIUM";
        } else {
            friendlyPkgName = "Goi " + pkgType;
        }

        PaymentLinkItem item = PaymentLinkItem.builder()
            .name(friendlyPkgName + (project != null ? " - Du an ID " + projectId : ""))
            .quantity(1)
            .price(feeAmount.longValue())
            .build();

        // Sử dụng domain ảo tạm thời để tránh lỗi Private Network Access (PNA) của Chrome khi chạy iframe trên localhost
        String returnUrl = "https://cny-lancerpro.vercel.app/payment-result"; 
        String cancelUrl = "https://cny-lancerpro.vercel.app/payment-result";

        CreatePaymentLinkRequest paymentData = CreatePaymentLinkRequest.builder()
                .orderCode(orderCode)
                .amount(feeAmount.longValue())
                .description("Thanh toan " + (project != null ? "ID " + projectId : pkgType))
                .returnUrl(returnUrl)
                .cancelUrl(cancelUrl)
                .item(item)
                .expiredAt(expiredAt)
                .build();

        return payOS.paymentRequests().create(paymentData);
    }

    public boolean handleWebhookData(WebhookData data) throws Exception {
        if (data == null) {
            return false;
        }

        String txnRef = String.valueOf(data.getOrderCode());

        Optional<PaymentTransaction> txnOpt = transactionRepository.findByTxnRef(txnRef);
        if (txnOpt.isPresent()) {
            PaymentTransaction txn = txnOpt.get();
            if ("PENDING".equals(txn.getStatus()) && data.getCode().equals("00")) {
                txn.setStatus("SUCCESS");
                txn.setVnpTransactionNo(data.getReference()); 
                transactionRepository.save(txn);
                
                invoiceService.generateInvoiceForTransaction(txn, "Thanh toan giao dich PayOS " + txn.getTxnRef());

                try {
                    viettelInvoiceService.issueInvoiceForTransaction(txn.getId());
                } catch (Exception e) {
                    System.err.println("Failed to issue Viettel electronic invoice via PayOS webhook: " + e.getMessage());
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
                
                dashboardRepository.logAudit(1, "system", "PAYOS_WEBHOOK", "FINANCE", "Hệ thống tự động duyệt thanh toán PayOS cho dự án ID: " + txn.getProjectId() + ", Mã đơn: " + txn.getTxnRef());
            }
        }
        return true;
    }

    public String queryTransaction(String txnRef, int adminId) throws Exception {
        long orderCode = Long.parseLong(txnRef);
        PaymentLink link = payOS.paymentRequests().get(orderCode);
        
        String payosStatus = link.getStatus().name();
        
        Optional<PaymentTransaction> txnOpt = transactionRepository.findByTxnRef(txnRef);
        if (txnOpt.isPresent()) {
            PaymentTransaction txn = txnOpt.get();
            if ("PENDING".equals(txn.getStatus())) {
                if ("CANCELLED".equalsIgnoreCase(payosStatus) || "EXPIRED".equalsIgnoreCase(payosStatus)) {
                    txn.setStatus("CANCELLED");
                    transactionRepository.save(txn);
                } else if ("PAID".equalsIgnoreCase(payosStatus) || "SUCCESS".equalsIgnoreCase(payosStatus)) {
                    txn.setStatus("SUCCESS");
                    
                    // Trích xuất mã tham chiếu giao dịch ngân hàng thực tế từ PayOS
                    if (link.getTransactions() != null && !link.getTransactions().isEmpty()) {
                        txn.setVnpTransactionNo(link.getTransactions().get(0).getReference());
                    }
                    
                    transactionRepository.save(txn);
                    
                    invoiceService.generateInvoiceForTransaction(txn, "Thanh toan giao dich PayOS " + txn.getTxnRef());

                    try {
                        viettelInvoiceService.issueInvoiceForTransaction(txn.getId());
                    } catch (Exception e) {
                        System.err.println("Failed to issue Viettel electronic invoice via PayOS query: " + e.getMessage());
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
            }
        }
        dashboardRepository.logAudit(adminId, "admin", "QUERY_PAYOS_TRANSACTION", "FINANCE", "Truy vấn giao dịch PayOS " + txnRef + " - Trạng thái: " + payosStatus);
        return payosStatus;
    }

    public void cancelTransaction(String txnRef, int adminId) throws Exception {
        Optional<PaymentTransaction> txnOpt = transactionRepository.findByTxnRef(txnRef);
        if (txnOpt.isEmpty()) {
            throw new IllegalArgumentException("Không tìm thấy giao dịch");
        }

        PaymentTransaction txn = txnOpt.get();
        if (!"PENDING".equals(txn.getStatus())) {
            throw new IllegalStateException("Giao dịch không ở trạng thái PENDING");
        }

        txn.setStatus("FAILED");
        transactionRepository.save(txn);

        try {
            long orderCode = Long.parseLong(txnRef);
            payOS.paymentRequests().cancel(orderCode);
        } catch (Exception e) {
            System.err.println("Lỗi khi gọi API hủy link PayOS: " + e.getMessage());
        }

        dashboardRepository.logAudit(adminId, "admin", "CANCEL_PAYOS_TRANSACTION", "FINANCE", "Hủy giao dịch PayOS " + txnRef);
    }

    public PaymentTransaction getTransactionByRef(String txnRef) {
        return transactionRepository.findByTxnRef(txnRef).orElse(null);
    }

    public void updateTransactionToFailed(PaymentTransaction txn) {
        txn.setStatus("FAILED");
        transactionRepository.save(txn);
    }
}
