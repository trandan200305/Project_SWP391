package com.cny.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StaffDto {
    private int staffId;
    private String email;
    private String displayName;
    private String fullName;
    private String phone;
    private String avatarUrl;
    private String status;
    private String specialization;
    private Integer managerId;
    private String managerName;
    private Integer createdByAdmin;
    private String createdAt;
    private String updatedAt;
}
