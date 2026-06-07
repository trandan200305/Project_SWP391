package com.cny.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminAuditLogDto {
    private int id;
    private String status;
    private String module;
    private String detail;
    private Object timestamp;
    private String source;
}
