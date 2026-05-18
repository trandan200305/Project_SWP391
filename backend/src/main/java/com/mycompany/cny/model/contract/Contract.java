package com.mycompany.cny.model.contract;

import jakarta.persistence.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "contracts")
public class Contract {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "contract_id")
    private Integer contractId;

    @Column(name = "project_id")
    private Integer projectId;

    @Column(name = "proposal_id")
    private Integer proposalId;

    @Column(name = "client_id")
    private Integer clientId;

    @Column(name = "freelancer_id")
    private Integer freelancerId;

    @Column(name = "agreed_amount")
    private java.math.BigDecimal agreedAmount;

    @Column(name = "status")
    private String status;

    @Column(name = "started_at")
    private java.time.LocalDateTime startedAt;

    @Column(name = "completed_at")
    private java.time.LocalDateTime completedAt;

    @Column(name = "created_at")
    private java.time.LocalDateTime createdAt;

}
