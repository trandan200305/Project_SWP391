package com.mycompany.cny.model.user;

import jakarta.persistence.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "user_roles")
public class UserRole {

    @Column(name = "user_id")
    private Integer userId;

    @Column(name = "role_id")
    private Integer roleId;

    @Column(name = "assigned_by")
    private Integer assignedBy;

    @Column(name = "assigned_at")
    private java.time.LocalDateTime assignedAt;

}
