package com.cny.backend.kyc.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_kyc_verifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserKycVerification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_email", nullable = false)
    private String userEmail;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(name = "id_number", nullable = false)
    private String idNumber;

    @Column(name = "date_of_birth")
    private String dateOfBirth;

    @Column(name = "gender")
    private String gender;

    @Column(name = "address", length = 500)
    private String address;

    @Column(name = "card_type")
    private String cardType;

    @Column(name = "id_card_front_url", columnDefinition = "NVARCHAR(MAX)")
    private String idCardFrontUrl;

    @Column(name = "id_card_back_url", columnDefinition = "NVARCHAR(MAX)")
    private String idCardBackUrl;

    @Column(name = "face_portrait_url", columnDefinition = "NVARCHAR(MAX)")
    private String facePortraitUrl;

    @Column(name = "card_liveness_status")
    private String cardLivenessStatus;

    @Column(name = "face_liveness_status")
    private String faceLivenessStatus;

    @Column(name = "face_match_percentage")
    private Double faceMatchPercentage;

    @Column(name = "face_match_result")
    private String faceMatchResult;

    @Column(name = "status")
    private String status; // PENDING, APPROVED, REJECTED

    @Column(name = "admin_notes", columnDefinition = "NVARCHAR(MAX)")
    private String adminNotes;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (updatedAt == null) updatedAt = LocalDateTime.now();
        if (status == null) status = "PENDING";
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
