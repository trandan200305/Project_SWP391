package com.mycompany.cny.model.finance;

import jakarta.persistence.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "escrow_transactions")
public class EscrowTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "escrow_id")
    private Integer escrowId;

    @Column(name = "milestone_id")
    private Integer milestoneId;

    @Column(name = "client_id")
    private Integer clientId;

    @Column(name = "freelancer_id")
    private Integer freelancerId;

    @Column(name = "amount")
    private java.math.BigDecimal amount;

    @Column(name = "platform_fee")
    private java.math.BigDecimal platformFee;

    @Column(name = "net_amount")
    private java.math.BigDecimal netAmount;

    @Column(name = "status")
    private String status;

    @Column(name = "funded_at")
    private java.time.LocalDateTime fundedAt;

    @Column(name = "released_at")
    private java.time.LocalDateTime releasedAt;

    @Column(name = "created_at")
    private java.time.LocalDateTime createdAt;

}
