package com.mycompany.cny.model.finance;

import jakarta.persistence.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "transactions")
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "transaction_id")
    private Integer transactionId;

    @Column(name = "wallet_id")
    private Integer walletId;

    @Column(name = "user_id")
    private Integer userId;

    @Column(name = "type")
    private String type;

    @Column(name = "amount")
    private java.math.BigDecimal amount;

    @Column(name = "balance_after")
    private java.math.BigDecimal balanceAfter;

    @Column(name = "reference_code")
    private String referenceCode;

    @Column(name = "description")
    private String description;

    @Column(name = "related_milestone_id")
    private Integer relatedMilestoneId;

    @Column(name = "status")
    private String status;

    @Column(name = "created_at")
    private java.time.LocalDateTime createdAt;

}
