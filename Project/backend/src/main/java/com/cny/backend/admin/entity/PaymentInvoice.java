package com.cny.backend.admin.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payment_invoices")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentInvoice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "invoice_id")
    private Integer invoiceId;

    @Column(name = "invoice_number", nullable = false, unique = true, length = 50)
    private String invoiceNumber;

    @Column(name = "transaction_id", nullable = false)
    private Integer transactionId;

    @Column(name = "employer_id")
    private Integer employerId;

    @Column(columnDefinition = "NVARCHAR(255)")
    private String description;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal amount;

    @Column(name = "tax_amount", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Column(name = "total_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "issued_at")
    private LocalDateTime issuedAt;

    @Column(length = 20)
    @Builder.Default
    private String status = "PAID";

    // Viettel SInvoice fields
    @Column(name = "viettel_invoice_no", length = 50)
    private String viettelInvoiceNo;

    @Column(name = "viettel_transaction_uuid", length = 100)
    private String viettelTransactionUuid;

    @Column(name = "viettel_status", length = 50)
    private String viettelStatus;

    @PrePersist
    protected void onCreate() {
        if (issuedAt == null) {
            issuedAt = LocalDateTime.now();
        }
    }
}
