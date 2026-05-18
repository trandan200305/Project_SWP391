package com.mycompany.cny.model.review;

import jakarta.persistence.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "reviews")
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "review_id")
    private Integer reviewId;

    @Column(name = "contract_id")
    private Integer contractId;

    @Column(name = "reviewer_id")
    private Integer reviewerId;

    @Column(name = "reviewee_id")
    private Integer revieweeId;

    @Column(name = "overall_rating")
    private java.math.BigDecimal overallRating;

    @Column(name = "comment")
    private String comment;

    @Column(name = "is_visible")
    private Boolean isVisible;

    @Column(name = "is_hidden")
    private Boolean isHidden;

    @Column(name = "hidden_reason")
    private String hiddenReason;

    @Column(name = "hidden_by")
    private Integer hiddenBy;

    @Column(name = "created_at")
    private java.time.LocalDateTime createdAt;

    @Column(name = "updated_at")
    private java.time.LocalDateTime updatedAt;

    @Column(name = "is_deleted")
    private Boolean isDeleted;

}
