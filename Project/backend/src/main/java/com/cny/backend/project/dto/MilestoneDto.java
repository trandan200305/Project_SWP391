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
public class MilestoneDto {
    private Integer milestoneId;
    private Integer contractId;
    private String title;
    private BigDecimal amount;
    private LocalDate dueDate;
    private String status;
    private String description;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<DeliverableDto> deliverables;
}
