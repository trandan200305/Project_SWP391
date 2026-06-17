package com.cny.backend.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KycSubmitDto {
    private String idCardFrontUrl;
    private String idCardBackUrl;
    private String portraitUrl;
}
