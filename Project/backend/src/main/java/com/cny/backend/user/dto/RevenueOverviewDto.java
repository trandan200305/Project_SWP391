package com.cny.backend.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RevenueOverviewDto {
    private BigDecimal totalEarnings;
    private BigDecimal pendingClearance;
    private Integer completedProjects;
    private Integer activeProjects;
}
