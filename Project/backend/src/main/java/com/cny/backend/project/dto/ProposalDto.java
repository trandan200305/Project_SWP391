package com.cny.backend.project.dto;

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
public class ProposalDto {
    private Integer proposalId;
    private Integer projectId;
    private Integer freelancerId;
    private String freelancerName;
    private String freelancerAvatar;
    private String freelancerTitle;
    private BigDecimal bidAmount;
    private Integer estimatedDays;
    private String coverLetter;
    private String status;
    private LocalDateTime createdAt;
}