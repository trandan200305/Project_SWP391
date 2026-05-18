package com.mycompany.cny.model.system;

import jakarta.persistence.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "user_settings")
public class UserSetting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @Column(name = "user_id")
    private Integer userId;

    @Column(name = "theme")
    private String theme;

    @Column(name = "tos_accepted_version")
    private Integer tosAcceptedVersion;

    @Column(name = "tos_accepted_at")
    private java.time.LocalDateTime tosAcceptedAt;

    @Column(name = "updated_at")
    private java.time.LocalDateTime updatedAt;

}
