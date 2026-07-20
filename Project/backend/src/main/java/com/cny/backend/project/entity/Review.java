package com.cny.backend.project.entity;

import com.cny.backend.user.entity.Employer;
import com.cny.backend.user.entity.Freelancer;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity(name = "ProjectReview")
@Table(name = "reviews")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "review_id")
    private Integer reviewId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "contract_id", nullable = false)
    private Contract contract;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "reviewer_freelancer_id")
    private Freelancer reviewerFreelancer;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "reviewer_employer_id")
    private Employer reviewerEmployer;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "reviewee_freelancer_id")
    private Freelancer revieweeFreelancer;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "reviewee_employer_id")
    private Employer revieweeEmployer;

    @Column(nullable = false, precision = 3, scale = 2)
    private BigDecimal rating;

    @Column(length = 2000, columnDefinition = "NVARCHAR(2000)")
    private String comment;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
