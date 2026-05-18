package com.mycompany.cny.model.user;

import jakarta.persistence.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "password_reset_tokens")
public class PasswordResetToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @Column(name = "user_id")
    private Integer userId;

    @Column(name = "token")
    private String token;

    @Column(name = "expires_at")
    private java.time.LocalDateTime expiresAt;

    @Column(name = "used")
    private Boolean used;

    @Column(name = "created_at")
    private java.time.LocalDateTime createdAt;

}
