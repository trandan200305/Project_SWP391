package com.hello.remake.entity;

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
public class Freelancer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "freelancer_id")
    private Integer profileId; // Matches PK for frontend compatibility

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

}
