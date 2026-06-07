package com.cny.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PendingProjectDto {
    private int id;
    private String title;
    private String description;
    private String type;
    private double budget;
    private Object createdAt;
    private String clientName;
}
