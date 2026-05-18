package com.mycompany.cny.model.user;

import jakarta.persistence.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "user_skills")
public class UserSkill {

    @Column(name = "user_id")
    private Integer userId;

    @Column(name = "skill_id")
    private Integer skillId;

    @Column(name = "proficiency")
    private String proficiency;

}
