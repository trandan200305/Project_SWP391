package com.cny.backend.department.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "department_activity_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DepartmentActivityLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "log_id")
    private Integer logId;

    @Column(name = "session_id")
    private Integer sessionId;

    @Column(name = "department_id", nullable = false)
    private Integer departmentId;

    @Column(name = "user_id", nullable = false)
    private Integer userId;

    @Column(name = "user_role", nullable = false)
    private String userRole;

    @Column(nullable = false)
    private String action;

    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String description;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
