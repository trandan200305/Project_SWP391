package com.cny.backend.project.entity;

import com.cny.backend.user.entity.Freelancer;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "saved_jobs", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"freelancer_id", "project_id"})
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SavedJob {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer savedJobId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "freelancer_id", nullable = false)
    private Freelancer freelancer;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(name = "saved_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime savedAt = LocalDateTime.now();
}
