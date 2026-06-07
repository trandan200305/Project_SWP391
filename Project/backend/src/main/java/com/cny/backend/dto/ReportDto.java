package com.cny.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReportDto {
    private int id;
    private String reporterName;
    private String reportedName;
    private String reason;
    private String status;
    private String createdAt;
}
