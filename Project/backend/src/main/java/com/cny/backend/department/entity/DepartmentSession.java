package com.cny.backend.department.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "department_sessions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DepartmentSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "session_id")
    private Integer sessionId;

    @Column(name = "department_id", nullable = false)
    private Integer departmentId;

    @Column(name = "user_id", nullable = false)
    private Integer userId;

    @Column(name = "user_role", nullable = false)
    private String userRole; // "MANAGER" or "STAFF"

    @Column(name = "login_at", nullable = false)
    private LocalDateTime loginAt;

    @Column(name = "logout_at")
    private LocalDateTime logoutAt;

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(nullable = false)
    private String status; // "ACTIVE", "COMPLETED", "TIMEOUT"

    @PrePersist
    protected void onCreate() {
        if (this.loginAt == null) {
            this.loginAt = LocalDateTime.now();
        }
        if (this.status == null) {
            this.status = "ACTIVE";
        }
    }
}
