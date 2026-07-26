package com.cny.backend.kyc.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KycSubmissionDto {
    private String userEmail;
    private String fullName;
    private String idNumber;
    private String dateOfBirth;
    private String gender;
    private String address;
    private String cardType;
    private String idCardFrontUrl;
    private String idCardBackUrl;
    private String facePortraitUrl;
    private String cardLivenessStatus;
    private String faceLivenessStatus;
    private Double faceMatchPercentage;
    private String faceMatchResult;
}
