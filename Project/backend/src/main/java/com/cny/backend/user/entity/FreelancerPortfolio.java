package com.cny.backend.user.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "freelancer_portfolios")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FreelancerPortfolio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "portfolio_id")
    private Integer portfolioId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "freelancer_id", nullable = false)
    private Freelancer freelancer;

    @Column(nullable = false)
    private String title;

    @Column(name = "attachment_url", length = 500)
    private String attachmentUrl;

    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String description;

    @Column(name = "related_service")
    private String relatedService;

    @Column(name = "product_link", length = 500)
    private String productLink;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
