package com.cny.backend.department.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "department_verification_tasks")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DepartmentVerificationTask {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "task_id")
    private Integer taskId;

    @Column(name = "task_type", nullable = false)
    private String taskType; // WITHDRAWAL, DISPUTE_REFUND, KYC_VERIFICATION

    @Column(name = "reference_id", nullable = false)
    private Integer referenceId;

    @Column(nullable = false)
    private String title;

    private String description;

    @Column(nullable = false)
    private String status; // PENDING, APPROVED, REJECTED

    @Column(name = "required_departments", nullable = false)
    private String requiredDepartments; // e.g., "DIS,FIN"

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
