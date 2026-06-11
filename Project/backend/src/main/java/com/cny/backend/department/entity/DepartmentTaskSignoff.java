package com.cny.backend.department.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "department_task_signoffs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DepartmentTaskSignoff {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "signoff_id")
    private Integer signoffId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "task_id", nullable = false)
    private DepartmentVerificationTask verificationTask;

    @Column(name = "department_code", nullable = false, length = 20)
    private String departmentCode;

    @Column(name = "verifier_email", nullable = false)
    private String verifierEmail;

    @Column(nullable = false)
    private String status; // APPROVED, REJECTED

    private String note;

    @Column(name = "signed_at")
    private LocalDateTime signedAt;

    @PrePersist
    protected void onCreate() {
        this.signedAt = LocalDateTime.now();
    }
}
