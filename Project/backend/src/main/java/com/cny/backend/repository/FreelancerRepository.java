package com.cny.backend.repository;

import com.cny.backend.entity.Freelancer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface FreelancerRepository extends JpaRepository<Freelancer, Integer> {
    
    // Custom query to fetch top-rated active freelancers
    List<Freelancer> findByIsAvailableTrueOrderByAverageRatingDescProjectsCompletedDesc();
    
    @Query("SELECT f FROM Freelancer f WHERE f.isAvailable = true AND f.averageRating >= 4.5 ORDER BY f.averageRating DESC")
    List<Freelancer> findTopRatedFreelancers();
}
