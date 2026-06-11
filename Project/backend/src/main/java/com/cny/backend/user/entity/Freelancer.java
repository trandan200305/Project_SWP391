package com.cny.backend.user.entity;

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

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "freelancers")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Freelancer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "freelancer_id")
    private Integer profileId; 

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "display_name", nullable = false)
    private String displayName;

    @Column(name = "full_name")
    private String fullName;

    private String phone;

    @Column(name = "avatar_url")
    private String avatarUrl;

    @Column(nullable = false)
    private String status;

    @Column(name = "email_verified")
    private Boolean emailVerified;

    @Column(name = "google_id")
    private String googleId;

    private String language;
    private String timezone;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    @Column(name = "professional_title")
    private String professionalTitle;

    private String bio;

    @Column(name = "hourly_rate")
    private BigDecimal hourlyRate;

    private String address;
    private String city;
    private String country;

    @Column(name = "profile_completeness")
    private Integer profileCompleteness;

    @Column(name = "total_earnings")
    private BigDecimal totalEarnings;

    @Column(name = "projects_completed")
    private Integer projectsCompleted;

    @Column(name = "average_rating")
    private BigDecimal averageRating;

    @Column(name = "is_available")
    private Boolean isAvailable;

    @Column(name = "is_deleted")
    private Boolean isDeleted;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "messenger_pin")
    private String messengerPin;

    // --- BẮT ĐẦU PHẦN KYC ---
    
    @Column(name = "kyc_status", length = 20)
    private String kycStatus = "UNVERIFIED";

    @Column(name = "id_card_front_url", length = 500)
    private String idCardFrontUrl;

    @Column(name = "id_card_back_url", length = 500)
    private String idCardBackUrl;

    @Column(name = "portrait_url", length = 500)
    private String portraitUrl;

    @Column(name = "kyc_submitted_at")
    private LocalDateTime kycSubmittedAt;

    @Column(name = "kyc_reviewed_at")
    private LocalDateTime kycReviewedAt;

    @Column(name = "kyc_reviewed_by_staff_id")
    private Integer kycReviewedByStaffId;

    @Column(name = "kyc_rejected_reason", length = 500)
    private String kycRejectedReason;

    @Column(name = "is_verified", nullable = false)
    private Boolean isVerified = false;

    // --- KẾT THÚC PHẦN KYC ---

    @Transient
    private TransientUser user;

    @PostLoad
    @PostPersist
    @PostUpdate
    public void initTransientUser() {
        this.user = new TransientUser(this.profileId, this.email, this.displayName, this.fullName, this.avatarUrl, this.phone);
    }

    @Data
    @AllArgsConstructor
    public static class TransientUser {
        private Integer userId;
        private String email;
        private String displayName;
        private String fullName;
        private String avatarUrl;
        private String phone;
    }
}
