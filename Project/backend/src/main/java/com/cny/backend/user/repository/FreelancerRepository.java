package com.cny.backend.user.repository;

import com.cny.backend.auth.entity.*;
import com.cny.backend.admin.entity.*;
import com.cny.backend.project.entity.*;
import com.cny.backend.user.entity.*;
import com.cny.backend.auth.repository.*;
import com.cny.backend.admin.repository.*;
import com.cny.backend.project.repository.*;
import com.cny.backend.user.repository.*;
import com.cny.backend.admin.dto.*;
import com.cny.backend.chat.dto.*;
import com.cny.backend.project.dto.*;
import com.cny.backend.user.dto.*;
import com.cny.backend.auth.service.*;
import com.cny.backend.admin.service.*;
import com.cny.backend.chat.service.*;


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface FreelancerRepository extends JpaRepository<Freelancer, Integer> {
    
    
    List<Freelancer> findByIsAvailableTrueOrderByAverageRatingDescProjectsCompletedDesc();
    
    @Query("SELECT f FROM Freelancer f WHERE f.isAvailable = true AND f.averageRating >= 4.5 ORDER BY f.averageRating DESC")
    List<Freelancer> findTopRatedFreelancers();

    Optional<Freelancer> findByEmail(String email);
    int countByEmail(String email);
    int countByPhone(String phone);
    int countByDisplayName(String displayName);
}
