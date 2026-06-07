package com.cny.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupportTicketDto {
    private int id;
    private String subject;
    private String sender;
    private String priority;
    private String status;
    private String createdAt;
}
