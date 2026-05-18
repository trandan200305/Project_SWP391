package com.mycompany.cny.model.project;

import jakarta.persistence.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "projects")
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "project_id")
    private Integer projectId;

    @Column(name = "client_id")
    private Integer clientId;

    @Column(name = "category_id")
    private Integer categoryId;

    @Column(name = "title")
    private String title;

    @Column(name = "description")
    private String description;

    @Column(name = "project_type")
    private String projectType;

    @Column(name = "budget_min")
    private java.math.BigDecimal budgetMin;

    @Column(name = "budget_max")
    private java.math.BigDecimal budgetMax;

    @Column(name = "budget_fixed")
    private java.math.BigDecimal budgetFixed;

    @Column(name = "deadline")
    private java.time.LocalDateTime deadline;

    @Column(name = "posting_expires")
    private java.time.LocalDateTime postingExpires;

    @Column(name = "status")
    private String status;

    @Column(name = "reject_reason")
    private String rejectReason;

    @Column(name = "reviewed_by")
    private Integer reviewedBy;

    @Column(name = "reviewed_at")
    private java.time.LocalDateTime reviewedAt;

    @Column(name = "proposal_count")
    private Integer proposalCount;

    @Column(name = "created_at")
    private java.time.LocalDateTime createdAt;

    @Column(name = "updated_at")
    private java.time.LocalDateTime updatedAt;

    @Column(name = "is_deleted")
    private Boolean isDeleted;

    @Column(name = "deleted_at")
    private java.time.LocalDateTime deletedAt;

}
