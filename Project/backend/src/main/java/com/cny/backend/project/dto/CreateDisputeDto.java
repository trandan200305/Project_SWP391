package com.cny.backend.project.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateDisputeDto {
    private String reason;
    private String priority; // 'HIGH', 'MEDIUM', 'LOW'
}
