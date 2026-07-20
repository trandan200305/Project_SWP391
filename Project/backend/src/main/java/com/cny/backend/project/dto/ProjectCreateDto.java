package com.cny.backend.project.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectCreateDto {
    private Integer clientId;
    private Integer categoryId;
    private String title;
    private String workForm;
    private String description;
    private List<String> skills;
    private String projectType;
    private BigDecimal budgetMin;
    private BigDecimal budgetMax;
    private BigDecimal budgetFixed;
    private LocalDate deadline;
    private String servicePackage;
}
