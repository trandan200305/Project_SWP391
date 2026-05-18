package com.mycompany.cny.model.project;

import jakarta.persistence.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "saved_jobs")
public class SavedJob {

    @Column(name = "user_id")
    private Integer userId;

    @Column(name = "project_id")
    private Integer projectId;

    @Column(name = "saved_at")
    private java.time.LocalDateTime savedAt;

}
