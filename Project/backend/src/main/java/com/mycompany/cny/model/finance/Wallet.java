package com.mycompany.cny.model.finance;

import jakarta.persistence.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "wallets")
public class Wallet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "wallet_id")
    private Integer walletId;

    @Column(name = "user_id")
    private Integer userId;

    @Column(name = "balance")
    private java.math.BigDecimal balance;

    @Column(name = "pending_amount")
    private java.math.BigDecimal pendingAmount;

    @Column(name = "escrow_amount")
    private java.math.BigDecimal escrowAmount;

    @Column(name = "currency")
    private String currency;

    @Column(name = "created_at")
    private java.time.LocalDateTime createdAt;

    @Column(name = "updated_at")
    private java.time.LocalDateTime updatedAt;

}
