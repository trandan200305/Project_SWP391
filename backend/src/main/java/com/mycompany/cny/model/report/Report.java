package com.mycompany.cny.model.report;

import jakarta.persistence.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "reports")
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "report_id")
    private Integer reportId;

    @Column(name = "reporter_id")
    private Integer reporterId;

    @Column(name = "target_type")
    private String targetType;

    @Column(name = "target_id")
    private Integer targetId;

    @Column(name = "violation_type")
    private String violationType;

    @Column(name = "description")
    private String description;

    @Column(name = "status")
    private String status;

    @Column(name = "action_taken")
    private String actionTaken;

    @Column(name = "processed_by")
    private Integer processedBy;

    @Column(name = "processed_at")
    private java.time.LocalDateTime processedAt;

    @Column(name = "process_note")
    private String processNote;

    @Column(name = "created_at")
    private java.time.LocalDateTime createdAt;

}
