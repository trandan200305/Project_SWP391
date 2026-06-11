package com.cny.backend.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkProfileDto {
    private String professionalTitle;
    private String bio;
    private String personalWebsite;
    private String expertiseField;
    private String experienceLevel;
    private String primarySkills;
    private String servicesOffered;
    private String availabilityType;
    private Boolean isAvailable;
}
