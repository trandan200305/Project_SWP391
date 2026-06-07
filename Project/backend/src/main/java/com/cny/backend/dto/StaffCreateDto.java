package com.cny.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StaffCreateDto {
    private String email;
    private String password;
    private String displayName;
    private String fullName;
    private String phone;
    private String specialization;
    private Integer managerId;
}
