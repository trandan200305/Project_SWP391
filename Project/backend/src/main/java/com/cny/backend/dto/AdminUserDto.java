package com.cny.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminUserDto {
    private int id;
    private String name;
    private String email;
    private String status;
    private String role;
    private String joined;
    private String lastLogin;
    private boolean isProtectedAdmin;
}
