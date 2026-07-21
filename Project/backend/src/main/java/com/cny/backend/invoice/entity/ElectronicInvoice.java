package com.cny.backend.invoice.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "electronic_invoices")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ElectronicInvoice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "transaction_uuid", nullable = false, unique = true, length = 100)
    private String transactionUuid;

    @Column(name = "payment_transaction_id")
    private Integer paymentTransactionId;

    @Column(name = "buyer_email", length = 100)
    private String buyerEmail;

    @Column(name = "buyer_name", length = 200)
    private String buyerName;

    @Column(name = "buyer_tax_code", length = 50)
    private String buyerTaxCode;

    @Column(name = "invoice_no", length = 50)
    private String invoiceNo;

    @Column(name = "invoice_template", length = 50)
    private String invoiceTemplate;

    @Column(name = "invoice_series", length = 50)
    private String invoiceSeries;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal totalAmount;

    @Column(nullable = false, length = 30)
    private String status; // PENDING, ISSUED, FAILED, CANCELED

    @Column(name = "issue_date")
    private LocalDateTime issueDate;

    @Column(name = "viettel_response", columnDefinition = "NVARCHAR(MAX)")
    private String viettelResponse;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) {
            status = "PENDING";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
