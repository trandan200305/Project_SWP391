package com.cny.backend.project.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "saved_jobs", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "user_role", "project_id"})
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SavedJob {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "saved_job_id")
    private Integer savedJobId;

    @Column(name = "user_id", nullable = false)
    private Integer userId;

    @Column(name = "user_role", nullable = false)
    private String userRole;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(name = "saved_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime savedAt = LocalDateTime.now();
}
