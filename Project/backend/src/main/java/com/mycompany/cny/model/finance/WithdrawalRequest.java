package com.mycompany.cny.model.finance;

import jakarta.persistence.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "withdrawal_requests")
public class WithdrawalRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "request_id")
    private Integer requestId;

    @Column(name = "user_id")
    private Integer userId;

    @Column(name = "amount")
    private java.math.BigDecimal amount;

    @Column(name = "bank_account_id")
    private Integer bankAccountId;

    @Column(name = "status")
    private String status;

    @Column(name = "reject_reason")
    private String rejectReason;

    @Column(name = "processed_by")
    private Integer processedBy;

    @Column(name = "processed_at")
    private java.time.LocalDateTime processedAt;

    @Column(name = "created_at")
    private java.time.LocalDateTime createdAt;

}
