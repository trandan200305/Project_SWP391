package com.mycompany.cny.model.dispute;

import jakarta.persistence.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "disputes")
public class Dispute {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "dispute_id")
    private Integer disputeId;

    @Column(name = "milestone_id")
    private Integer milestoneId;

    @Column(name = "contract_id")
    private Integer contractId;

    @Column(name = "opened_by")
    private Integer openedBy;

    @Column(name = "reason_category")
    private String reasonCategory;

    @Column(name = "description")
    private String description;

    @Column(name = "status")
    private String status;

    @Column(name = "assigned_to")
    private Integer assignedTo;

    @Column(name = "response_deadline")
    private java.time.LocalDateTime responseDeadline;

    @Column(name = "created_at")
    private java.time.LocalDateTime createdAt;

    @Column(name = "updated_at")
    private java.time.LocalDateTime updatedAt;

}
