package com.cny.backend.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PortfolioDto {
    private Integer portfolioId;
    private Integer freelancerId;
    private String title;
    private String attachmentUrl;
    private String description;
    private String relatedService;
    private String productLink;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
