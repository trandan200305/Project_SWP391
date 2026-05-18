package com.mycompany.cny.model.finance;

import jakarta.persistence.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "platform_fee_configs")
public class PlatformFeeConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "config_id")
    private Integer configId;

    @Column(name = "fee_percentage")
    private java.math.BigDecimal feePercentage;

    @Column(name = "effective_from")
    private java.time.LocalDateTime effectiveFrom;

    @Column(name = "effective_to")
    private java.time.LocalDateTime effectiveTo;

    @Column(name = "created_by")
    private Integer createdBy;

    @Column(name = "created_at")
    private java.time.LocalDateTime createdAt;

}
