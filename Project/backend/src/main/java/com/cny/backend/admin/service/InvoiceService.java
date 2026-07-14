package com.cny.backend.admin.service;

import com.cny.backend.admin.entity.PaymentInvoice;
import com.cny.backend.admin.entity.PaymentTransaction;
import com.cny.backend.admin.repository.PaymentInvoiceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class InvoiceService {

    @Autowired
    private PaymentInvoiceRepository invoiceRepository;

    @Transactional
    public PaymentInvoice generateInvoiceForTransaction(PaymentTransaction txn, String description) {
        // Check if invoice already exists to prevent duplicates
        if (txn.getId() != null) {
            var existing = invoiceRepository.findByTransactionId(txn.getId());
            if (existing.isPresent()) {
                return existing.get();
            }
        }

        // Generate unique invoice number: INV-yyyyMMdd-txnId
        String datePart = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String invoiceNumber = "INV-" + datePart + "-" + txn.getTxnRef();

        BigDecimal taxAmount = BigDecimal.ZERO; // Optional: 10% VAT logic could go here
        BigDecimal totalAmount = txn.getAmount().add(taxAmount);

        PaymentInvoice invoice = PaymentInvoice.builder()
                .invoiceNumber(invoiceNumber)
                .transactionId(txn.getId())
                .employerId(txn.getEmployerId())
                .description(description)
                .amount(txn.getAmount())
                .taxAmount(taxAmount)
                .totalAmount(totalAmount)
                .status("PAID")
                .build();

        return invoiceRepository.save(invoice);
    }
}
