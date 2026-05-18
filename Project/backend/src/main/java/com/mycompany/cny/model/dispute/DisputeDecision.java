package com.mycompany.cny.model.dispute;

import jakarta.persistence.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "dispute_decisions")
public class DisputeDecision {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "decision_id")
    private Integer decisionId;

    @Column(name = "dispute_id")
    private Integer disputeId;

    @Column(name = "decided_by")
    private Integer decidedBy;

    @Column(name = "decision_type")
    private String decisionType;

    @Column(name = "client_amount")
    private java.math.BigDecimal clientAmount;

    @Column(name = "freelancer_amount")
    private java.math.BigDecimal freelancerAmount;

    @Column(name = "reasoning")
    private String reasoning;

    @Column(name = "decided_at")
    private java.time.LocalDateTime decidedAt;

}
