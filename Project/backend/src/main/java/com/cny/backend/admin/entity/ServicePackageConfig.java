package com.cny.backend.admin.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "service_package_configs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServicePackageConfig {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "package_type", nullable = false, unique = true, length = 30)
    private String packageType; // "MEDIUM", "REGULAR", "PREMIUM"

    @Column(nullable = false)
    private double price;

    @Column(name = "post_limit", nullable = false)
    private Integer postLimit = 10; // Default quota

    @Column(name = "duration_days", nullable = false)
    private Integer durationDays = 30; // Default duration

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
