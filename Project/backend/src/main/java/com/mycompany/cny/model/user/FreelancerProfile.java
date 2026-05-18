package com.mycompany.cny.model.user;

import jakarta.persistence.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "freelancer_profiles")
public class FreelancerProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "profile_id")
    private Integer profileId;

    @Column(name = "user_id")
    private Integer userId;

    @Column(name = "professional_title")
    private String professionalTitle;

    @Column(name = "bio")
    private String bio;

    @Column(name = "hourly_rate")
    private java.math.BigDecimal hourlyRate;

    @Column(name = "address")
    private String address;

    @Column(name = "city")
    private String city;

    @Column(name = "country")
    private String country;

    @Column(name = "profile_completeness")
    private Integer profileCompleteness;

    @Column(name = "total_earnings")
    private java.math.BigDecimal totalEarnings;

    @Column(name = "projects_completed")
    private Integer projectsCompleted;

    @Column(name = "average_rating")
    private java.math.BigDecimal averageRating;

    @Column(name = "is_available")
    private Boolean isAvailable;

    @Column(name = "created_at")
    private java.time.LocalDateTime createdAt;

    @Column(name = "updated_at")
    private java.time.LocalDateTime updatedAt;

}
