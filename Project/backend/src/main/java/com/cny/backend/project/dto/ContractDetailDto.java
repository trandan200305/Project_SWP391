package com.cny.backend.project.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContractDetailDto {
    private Integer contractId;
    private Integer projectId;
    private String projectTitle;
    
    private Integer freelancerId;
    private String freelancerName;
    private String freelancerAvatar;
    private String freelancerTitle;
    
    private Integer clientId;
    private String clientName;
    private String clientAvatar;
    
    private String title;
    private BigDecimal agreedAmount;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status;
    private String terms;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    private List<MilestoneDto> milestones;
}
