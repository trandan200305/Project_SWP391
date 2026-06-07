package com.cny.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FreelancerDto {
    private Integer profileId;
    private String email;
    private String displayName;
    private String fullName;
    private String phone;
    private String avatarUrl;
    private String status;
    private Boolean emailVerified;
    private String professionalTitle;
    private String bio;
    private BigDecimal hourlyRate;
    private String address;
    private String city;
    private String country;
    private Integer profileCompleteness;
    private BigDecimal totalEarnings;
    private Integer projectsCompleted;
    private BigDecimal averageRating;
    private Boolean isAvailable;
    private String createdAt;
    private String updatedAt;
}
