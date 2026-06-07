package com.cny.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminStatsDto {
    private int totalUsers;
    private int activeProjects;
    private double totalRevenue;
    private int activeDisputes;
    private int pendingWithdrawals;
    private double usersGrowthPercent;
    private double projectsGrowthPercent;
    private double revenueGrowthPercent;
}
