package com.cny.backend.review.dto;

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
    private Integer reviewerId;
    private String reviewerType;
    private String reviewerName;
    private String reviewerAvatar;
    private Integer revieweeId;
    private String revieweeType;
    private String revieweeName;
    private String revieweeAvatar;
    private BigDecimal rating;
    private String comment;
    private LocalDateTime createdAt;
}
