package com.cny.backend.department.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "department_transfer_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DepartmentTransferHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "transfer_id")
    private Integer transferId;

    @Column(name = "user_type", nullable = false, length = 20)
    private String userType; // 'MANAGER' or 'STAFF'

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

    @Column(name = "transferred_by", nullable = false)
    private Integer transferredBy;

    private String reason;

    @Column(name = "transferred_at")
    private LocalDateTime transferredAt;

    @PrePersist
    protected void onCreate() {
        this.transferredAt = LocalDateTime.now();
    }
}
