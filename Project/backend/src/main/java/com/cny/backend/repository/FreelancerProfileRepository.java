package com.cny.backend.repository;

import com.cny.backend.entity.FreelancerProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface FreelancerProfileRepository extends JpaRepository<FreelancerProfile, Integer> {
    Optional<FreelancerProfile> findByUserUserId(Integer userId);
    
    // Custom query to fetch top-rated active freelancers
    List<FreelancerProfile> findByIsAvailableTrueOrderByAverageRatingDescProjectsCompletedDesc();
    
    @Query("SELECT fp FROM FreelancerProfile fp WHERE fp.isAvailable = true AND fp.averageRating >= 4.5 ORDER BY fp.averageRating DESC")
    List<FreelancerProfile> findTopRatedFreelancers();
}
