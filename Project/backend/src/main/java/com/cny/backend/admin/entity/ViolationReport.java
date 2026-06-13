package com.cny.backend.admin.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "violation_reports")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ViolationReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "report_id")
    private Integer reportId;

    @Column(name = "target_type")
    private String targetType; // e.g. "USER", "PROJECT", "MESSAGE"

    @Column(name = "target_id")
    private String targetId;

    @Column(name = "reporter_name")
    private String reporterName;

    @Column(name = "accused_name")
    private String accusedName;

    @Column(name = "severity")
    private String severity; // "LOW", "MEDIUM", "HIGH"

    @Column(name = "status")
    private String status; // "PENDING", "RESOLVED", "DISMISSED"

    @Column(name = "reason", columnDefinition = "NVARCHAR(MAX)")
    private String reason;

    @Column(name = "evidence", columnDefinition = "NVARCHAR(MAX)")
    private String evidence;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) status = "PENDING";
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
