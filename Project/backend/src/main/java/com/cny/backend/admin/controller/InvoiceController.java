package com.cny.backend.admin.controller;

import com.cny.backend.admin.entity.PaymentInvoice;
import com.cny.backend.admin.repository.PaymentInvoiceRepository;
import org.springframework.beans.factory.annotation.Autowired;
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
        return invoiceRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/transaction/{txnId}")
    public ResponseEntity<?> getInvoiceByTransactionId(@PathVariable("txnId") Integer txnId) {
        return invoiceRepository.findByTransactionId(txnId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/employer/{employerId}")
    public ResponseEntity<List<PaymentInvoice>> getInvoicesByEmployer(@PathVariable("employerId") Integer employerId) {
        return ResponseEntity.ok(invoiceRepository.findByEmployerIdOrderByIssuedAtDesc(employerId));
    }
}
