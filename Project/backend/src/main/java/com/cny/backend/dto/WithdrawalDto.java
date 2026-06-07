package com.cny.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WithdrawalDto {
    private int id;
    private double amount;
    private String status;
    private Object createdAt;
    private String userName;
    private String userEmail;
    private String bankName;
    private String accountNumber;
}
