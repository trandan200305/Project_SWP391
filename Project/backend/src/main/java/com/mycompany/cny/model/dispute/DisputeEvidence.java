package com.mycompany.cny.model.dispute;

import jakarta.persistence.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "dispute_evidences")
public class DisputeEvidence {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "evidence_id")
    private Integer evidenceId;

    @Column(name = "dispute_id")
    private Integer disputeId;

    @Column(name = "submitted_by")
    private Integer submittedBy;

    @Column(name = "evidence_type")
    private String evidenceType;

    @Column(name = "file_url")
    private String fileUrl;

    @Column(name = "description")
    private String description;

    @Column(name = "created_at")
    private java.time.LocalDateTime createdAt;

}
