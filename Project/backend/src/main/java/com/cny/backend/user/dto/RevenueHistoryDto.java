package com.cny.backend.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RevenueHistoryDto {
    private Integer contractId;
    private String projectTitle;
    private String clientName;
    private BigDecimal amount;
    private LocalDateTime completedAt;
    private String status;
}
