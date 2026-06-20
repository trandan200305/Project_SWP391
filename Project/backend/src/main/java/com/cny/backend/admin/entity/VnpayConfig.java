package com.cny.backend.admin.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "vnpay_configs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VnpayConfig {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "tmn_code", nullable = false)
    private String tmnCode;

    @Column(name = "hash_secret", nullable = false)
    private String hashSecret;

    @Column(name = "vnp_url", nullable = false)
    private String vnpUrl;

    @Column(name = "return_url", nullable = false)
    private String returnUrl;

    @Column(name = "bank_name")
    private String bankName;

    @Column(name = "bank_account_no")
    private String bankAccountNo;

    @Column(name = "bank_account_name")
    private String bankAccountName;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
