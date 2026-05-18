package com.mycompany.cny.model.project;

import jakarta.persistence.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "project_skills")
public class ProjectSkill {

    @Column(name = "project_id")
    private Integer projectId;

    @Column(name = "skill_id")
    private Integer skillId;

}
