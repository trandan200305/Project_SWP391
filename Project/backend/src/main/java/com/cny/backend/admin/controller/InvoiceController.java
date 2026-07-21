package com.cny.backend.admin.controller;

import com.cny.backend.admin.entity.PaymentInvoice;
import com.cny.backend.admin.repository.PaymentInvoiceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/payment/invoices")
@CrossOrigin(origins = "*")
public class InvoiceController {

    @Autowired
    private PaymentInvoiceRepository invoiceRepository;

    @Autowired
    private com.cny.backend.admin.service.ViettelSInvoiceService sInvoiceService;

    @Autowired
    private com.cny.backend.user.repository.EmployerRepository employerRepository;

    @Autowired
    private com.cny.backend.email.service.EmailService emailService;

    @GetMapping
    public ResponseEntity<List<PaymentInvoice>> getAllInvoices() {
        return ResponseEntity.ok(invoiceRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getInvoiceById(@PathVariable("id") Integer id) {
        if (id == null || id <= 0) {
            return ResponseEntity.badRequest().body("Mã hóa đơn không hợp lệ.");
        }
        return invoiceRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/transaction/{txnId}")
    public ResponseEntity<?> getInvoiceByTransactionId(@PathVariable("txnId") Integer txnId) {
        if (txnId == null || txnId <= 0) {
            return ResponseEntity.badRequest().body("Mã giao dịch không hợp lệ.");
        }
        return invoiceRepository.findByTransactionId(txnId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/employer/{employerId}")
    public ResponseEntity<?> getInvoicesByEmployer(
            @PathVariable("employerId") Integer employerId,
            @RequestParam(value = "page", required = false) Integer page,
            @RequestParam(value = "size", required = false) Integer size,
            @RequestParam(value = "search", required = false) String search) {
        if (employerId == null || employerId <= 0) {
            return ResponseEntity.badRequest().body("Mã Employer không hợp lệ.");
        }
        if (page != null && size != null) {
            Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "issuedAt"));
            if (search != null && !search.trim().isEmpty()) {
                Page<PaymentInvoice> invoicePage = invoiceRepository.findByEmployerIdWithSearch(employerId, search.trim(), pageable);
                return ResponseEntity.ok(invoicePage);
            }
            Page<PaymentInvoice> invoicePage = invoiceRepository.findByEmployerId(employerId, pageable);
            return ResponseEntity.ok(invoicePage);
        }
        return ResponseEntity.ok(invoiceRepository.findByEmployerIdOrderByIssuedAtDesc(employerId));
    }

    @PostMapping("/{id}/issue")
    public ResponseEntity<?> issueViettelInvoice(@PathVariable("id") Integer id) {
        try {
            PaymentInvoice invoice = invoiceRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn nội bộ."));
                    
            if (invoice.getViettelInvoiceNo() != null) {
                return ResponseEntity.badRequest().body("Hóa đơn này đã được xuất (Số HĐ: " + invoice.getViettelInvoiceNo() + ").");
            }
            
            com.cny.backend.user.entity.Employer employer = employerRepository.findById(invoice.getEmployerId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy thông tin Employer."));

            java.util.Map<String, Object> result = sInvoiceService.createInvoice(invoice, employer);
            
            if ((Boolean) result.get("success")) {
                invoice.setViettelInvoiceNo((String) result.get("invoiceNo"));
                invoice.setViettelTransactionUuid((String) result.get("transactionUuid"));
                invoice.setViettelStatus("ISSUED");
                invoiceRepository.save(invoice);
                return ResponseEntity.ok(result);
            } else {
                return ResponseEntity.badRequest().body(result);
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(java.util.Map.of("success", false, "message", e.getMessage()));
        }
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<?> downloadInvoicePdf(@PathVariable("id") Integer id) {
        try {
            PaymentInvoice invoice = invoiceRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn."));
                    
            if (invoice.getViettelInvoiceNo() == null) {
                return ResponseEntity.badRequest().body("Hóa đơn chưa được xuất lên hệ thống Viettel.");
            }

            byte[] pdfBytes = sInvoiceService.downloadInvoicePdf(invoice.getViettelInvoiceNo());
            
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.setContentType(org.springframework.http.MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "HoaDon_" + invoice.getViettelInvoiceNo() + ".pdf");
            
            return new ResponseEntity<>(pdfBytes, headers, org.springframework.http.HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    @PostMapping("/{id}/email")
    public ResponseEntity<?> sendInvoiceEmail(@PathVariable("id") Integer id) {
        try {
            PaymentInvoice invoice = invoiceRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn."));
                    
            if (invoice.getViettelInvoiceNo() == null) {
                return ResponseEntity.badRequest().body("Hóa đơn chưa được xuất lên hệ thống Viettel.");
            }
            
            com.cny.backend.user.entity.Employer employer = employerRepository.findById(invoice.getEmployerId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy thông tin Employer."));

            byte[] pdfBytes = sInvoiceService.downloadInvoicePdf(invoice.getViettelInvoiceNo());
            
            String subject = "LancerPro - Hóa đơn điện tử số " + invoice.getViettelInvoiceNo();
            String content = "Kính gửi quý khách hàng " + employer.getFullName() + ",<br/><br/>"
                           + "LancerPro xin gửi tới quý khách hóa đơn điện tử đính kèm.<br/>"
                           + "Mã hóa đơn nội bộ: " + invoice.getInvoiceNumber() + "<br/>"
                           + "Số tiền: " + invoice.getTotalAmount() + " VNĐ<br/><br/>"
                           + "Trân trọng,<br/>Đội ngũ LancerPro.";
                           
            emailService.sendEmailWithAttachmentAsync(employer.getEmail(), subject, content, "HoaDon_" + invoice.getViettelInvoiceNo() + ".pdf", pdfBytes);
            
            return ResponseEntity.ok(java.util.Map.of("success", true, "message", "Đã đưa vào hàng đợi gửi email."));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(java.util.Map.of("success", false, "message", e.getMessage()));
        }
    }
}
