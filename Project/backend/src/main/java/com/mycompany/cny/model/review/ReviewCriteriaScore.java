package com.mycompany.cny.model.review;

import jakarta.persistence.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "review_criteria_scores")
public class ReviewCriteriaScore {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @Column(name = "review_id")
    private Integer reviewId;

    @Column(name = "criteria_name")
    private String criteriaName;

    @Column(name = "score")
    private java.math.BigDecimal score;

}
