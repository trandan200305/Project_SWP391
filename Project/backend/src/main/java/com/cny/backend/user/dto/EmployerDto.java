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
public class EmployerDto {
    private Integer employerId;
    private String email;
    private String displayName;
    private String fullName;
    private String phone;
    private String avatarUrl;
    private String status;
    private Boolean emailVerified;
    private String companyName;
    private String companyLogoUrl;
    private String companyDescription;
    private String website;
    private String address;
    private String city;
    private String country;
    private String companySize;
    private String industry;
    private Integer profileCompleteness;
    private BigDecimal totalSpent;
    private Integer projectsPosted;
    private BigDecimal averageRating;
    private String createdAt;
    private String updatedAt;
}
