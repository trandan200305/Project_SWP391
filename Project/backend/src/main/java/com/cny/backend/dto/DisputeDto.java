package com.cny.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DisputeDto {
    private int id;
    private String projectTitle;
    private String clientName;
    private String freelancerName;
    private double amount;
    private String status;
    private String reason;
    private String createdAt;
}
