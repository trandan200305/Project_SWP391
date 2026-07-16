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
public class ReviewDto {
    private Integer reviewId;
    private Integer contractId;
    private Integer reviewerFreelancerId;
    private String reviewerFreelancerName;
    private String reviewerFreelancerAvatar;
    private Integer reviewerEmployerId;
    private String reviewerEmployerName;
    private String reviewerEmployerAvatar;
    private Integer revieweeFreelancerId;
    private Integer revieweeEmployerId;
    private BigDecimal rating;
    private String comment;
    private LocalDateTime createdAt;
}
