package com.mycompany.cny.model.contract;

import jakarta.persistence.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "milestones")
public class Milestone {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "milestone_id")
    private Integer milestoneId;

    @Column(name = "contract_id")
    private Integer contractId;

    @Column(name = "title")
    private String title;

    @Column(name = "description")
    private String description;

    @Column(name = "amount")
    private java.math.BigDecimal amount;

    @Column(name = "deadline")
    private java.time.LocalDateTime deadline;

    @Column(name = "status")
    private String status;

    @Column(name = "display_order")
    private Integer displayOrder;

    @Column(name = "created_at")
    private java.time.LocalDateTime createdAt;

    @Column(name = "updated_at")
    private java.time.LocalDateTime updatedAt;

}
