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
            @RequestParam(value = "size", required = false) Integer size) {
        if (employerId == null || employerId <= 0) {
            return ResponseEntity.badRequest().body("Mã Employer không hợp lệ.");
        }
        if (page != null && size != null) {
            Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "issuedAt"));
            Page<PaymentInvoice> invoicePage = invoiceRepository.findByEmployerId(employerId, pageable);
            return ResponseEntity.ok(invoicePage);
        }
        return ResponseEntity.ok(invoiceRepository.findByEmployerIdOrderByIssuedAtDesc(employerId));
    }
}
