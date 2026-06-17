package com.cny.backend.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminDto {
    private Integer adminId;
    private String email;
    private String displayName;
    private String fullName;
    private String phone;
    private String avatarUrl;
    private String status;
    private Boolean emailVerified;
    private String adminLevel;
    private String createdAt;
    private String updatedAt;
}
