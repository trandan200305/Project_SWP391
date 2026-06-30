package com.cny.backend.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PendingGigDto {
    private int id;
    private String title;
    private String description;
    private double price;
    private Object createdAt;
    private String freelancerName;
    private String status;
}
