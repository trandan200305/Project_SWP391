package com.mycompany.cny.model.contract;

import jakarta.persistence.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "deliverables")
public class Deliverable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "deliverable_id")
    private Integer deliverableId;

    @Column(name = "milestone_id")
    private Integer milestoneId;

    @Column(name = "freelancer_id")
    private Integer freelancerId;

    @Column(name = "description")
    private String description;

    @Column(name = "submitted_at")
    private java.time.LocalDateTime submittedAt;

}
