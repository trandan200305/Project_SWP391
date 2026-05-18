package com.mycompany.cny.model.project;

import jakarta.persistence.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "proposals")
public class Proposal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "proposal_id")
    private Integer proposalId;

    @Column(name = "project_id")
    private Integer projectId;

    @Column(name = "freelancer_id")
    private Integer freelancerId;

    @Column(name = "bid_amount")
    private java.math.BigDecimal bidAmount;

    @Column(name = "delivery_days")
    private Integer deliveryDays;

    @Column(name = "cover_letter")
    private String coverLetter;

    @Column(name = "status")
    private String status;

    @Column(name = "submitted_at")
    private java.time.LocalDateTime submittedAt;

    @Column(name = "updated_at")
    private java.time.LocalDateTime updatedAt;

}
