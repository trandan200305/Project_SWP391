package com.cny.backend.department.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "department_transfer_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DepartmentTransferRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "request_id")
    private Integer requestId;

    @Column(name = "user_type", nullable = false, length = 20)
    private String userType; // "MANAGER" or "STAFF"

    @Column(name = "user_id", nullable = false)
    private Integer userId;

    @Column(name = "user_email", nullable = false)
    private String userEmail;

    @Column(name = "user_display_name", length = 100)
    private String userDisplayName;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "from_department_id", nullable = false)
    private Department fromDepartment;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "to_department_id", nullable = false)
    private Department toDepartment;

    private String reason;

    @Column(nullable = false, length = 20)
    private String status; // "PENDING", "APPROVED", "REJECTED"

    @Column(name = "decided_by")
    private Integer decidedBy; // admin_id or manager_id

    @Column(name = "decision_note")
    private String decisionNote;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = "PENDING";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
