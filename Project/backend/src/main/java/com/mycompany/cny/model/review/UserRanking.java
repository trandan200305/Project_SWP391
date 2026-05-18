package com.mycompany.cny.model.review;

import jakarta.persistence.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "user_rankings")
public class UserRanking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ranking_id")
    private Integer rankingId;

    @Column(name = "user_id")
    private Integer userId;

    @Column(name = "user_type")
    private String userType;

    @Column(name = "ranking_score")
    private java.math.BigDecimal rankingScore;

    @Column(name = "rank_position")
    private Integer rankPosition;

    @Column(name = "category_id")
    private Integer categoryId;

    @Column(name = "calculated_at")
    private java.time.LocalDateTime calculatedAt;

}
