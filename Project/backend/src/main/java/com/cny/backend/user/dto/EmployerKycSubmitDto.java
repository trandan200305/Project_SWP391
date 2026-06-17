package com.cny.backend.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployerKycSubmitDto {
    private String taxCode;
    private String businessLicenseUrl;
    private String representativeIdCardUrl;
}
