package com.cny.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KycRequestDto {
    private int id;
    private String userName;
    private String userEmail;
    private String idCard;
    private String status;
    private String submittedAt;
}
