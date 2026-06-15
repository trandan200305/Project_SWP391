package com.cny.backend.user.dto;

import com.cny.backend.auth.entity.*;
import com.cny.backend.admin.entity.*;
import com.cny.backend.project.entity.*;
import com.cny.backend.user.entity.*;
import com.cny.backend.auth.repository.*;
import com.cny.backend.admin.repository.*;
import com.cny.backend.project.repository.*;
import com.cny.backend.user.repository.*;
import com.cny.backend.admin.dto.*;
import com.cny.backend.chat.dto.*;
import com.cny.backend.project.dto.*;
import com.cny.backend.user.dto.*;
import com.cny.backend.auth.service.*;
import com.cny.backend.admin.service.*;
import com.cny.backend.chat.service.*;


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

    // --- KYC FIELDS ---
    private String kycStatus;
    private String idCardFrontUrl;
    private String idCardBackUrl;
    private String portraitUrl;
    private String kycSubmittedAt;
    private String kycReviewedAt;
    private Integer kycReviewedByStaffId;
    private String kycRejectedReason;
    private Boolean isVerified;
}
