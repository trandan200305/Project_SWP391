package com.cny.backend.invoice.service;

import com.cny.backend.admin.entity.PaymentTransaction;
import com.cny.backend.admin.repository.PaymentTransactionRepository;
import com.cny.backend.invoice.config.ViettelSInvoiceConfig;
import com.cny.backend.invoice.entity.ElectronicInvoice;
import com.cny.backend.invoice.repository.ElectronicInvoiceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service("viettelInvoiceService")
@RequiredArgsConstructor
@Slf4j
public class InvoiceService {

    private final ElectronicInvoiceRepository invoiceRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final ViettelSInvoiceConfig config;

    /**
     * Issue an electronic invoice for a completed top-up/payment transaction
     */
    @Transactional
    public ElectronicInvoice issueInvoiceForTransaction(Integer paymentTransactionId) {
        // 1. Fetch transaction
        PaymentTransaction txn = paymentTransactionRepository.findById(paymentTransactionId)
                .orElseThrow(() -> new RuntimeException("Payment transaction not found: " + paymentTransactionId));

        if (!"SUCCESS".equals(txn.getStatus())) {
            throw new RuntimeException("Cannot issue invoice for non-successful transaction");
        }

        // Check if invoice already exists
        if (invoiceRepository.findByPaymentTransactionId(paymentTransactionId).isPresent()) {
            throw new RuntimeException("Invoice already issued for this transaction");
        }

        // 2. Generate Transaction UUID to avoid duplicate invoices in Viettel system
        String transactionUuid = UUID.randomUUID().toString();

        // 3. Create Draft Invoice Entity
        ElectronicInvoice invoice = ElectronicInvoice.builder()
                .transactionUuid(transactionUuid)
                .paymentTransactionId(txn.getId())
                .buyerName("Employer ID: " + txn.getEmployerId()) // Mock name for now
                .buyerEmail("employer" + txn.getEmployerId() + "@mock.com") // Mock email
                .totalAmount(txn.getAmount())
                .invoiceTemplate(config.getTemplateCode() != null ? config.getTemplateCode() : "01GTKT0/001")
                .invoiceSeries(config.getInvoiceSeries() != null ? config.getInvoiceSeries() : "AA/22E")
                .status("PENDING")
                .build();

        invoice = invoiceRepository.save(invoice);

        // 4. Call Viettel API (Mocking the response for now since we don't have credentials)
        try {
            log.info("Mocking SInvoice API call for transaction UUID: {}", transactionUuid);
            
            // Simulating API success
            invoice.setStatus("ISSUED");
            invoice.setInvoiceNo("000" + (int)(Math.random() * 10000));
            invoice.setIssueDate(LocalDateTime.now());
            invoice.setViettelResponse("{\"status\": 200, \"message\": \"Thành công\", \"result\": {\"invoiceNo\": \"" + invoice.getInvoiceNo() + "\"}}");

        } catch (Exception e) {
            log.error("Failed to issue SInvoice: {}", e.getMessage());
            invoice.setStatus("FAILED");
            invoice.setViettelResponse("{\"error\": \"" + e.getMessage() + "\"}");
        }

        return invoiceRepository.save(invoice);
    }
}
