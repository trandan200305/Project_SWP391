package com.mycompany.cny.model.system;

import jakarta.persistence.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "admin_audit_logs")
public class AdminAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "log_id")
    private Integer logId;

    @Column(name = "admin_id")
    private Integer adminId;

    @Column(name = "action")
    private String action;

    @Column(name = "module")
    private String module;

    @Column(name = "target_type")
    private String targetType;

    @Column(name = "target_id")
    private Integer targetId;

    @Column(name = "old_value")
    private String oldValue;

    @Column(name = "new_value")
    private String newValue;

    @Column(name = "description")
    private String description;

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "created_at")
    private java.time.LocalDateTime createdAt;

}
