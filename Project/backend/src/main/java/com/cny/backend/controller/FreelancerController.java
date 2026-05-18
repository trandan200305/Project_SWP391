package com.cny.backend.controller;

import com.cny.backend.entity.FreelancerProfile;
import com.cny.backend.repository.FreelancerProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/freelancers")
@CrossOrigin(origins = "*")
public class FreelancerController {

    @Autowired
    private FreelancerProfileRepository freelancerProfileRepository;

    // Get all active freelancers
    @GetMapping
    public ResponseEntity<List<FreelancerProfile>> getAllFreelancers() {
        List<FreelancerProfile> freelancers = freelancerProfileRepository.findByIsAvailableTrueOrderByAverageRatingDescProjectsCompletedDesc();
        return ResponseEntity.ok(freelancers);
    }

    // Get the top 4 highest-rated active freelancers for the homepage
    @GetMapping("/top")
    public ResponseEntity<List<FreelancerProfile>> getTopFreelancers() {
        List<FreelancerProfile> freelancers = freelancerProfileRepository.findTopRatedFreelancers();
        List<FreelancerProfile> topFreelancers = freelancers.stream().limit(4).collect(Collectors.toList());
        return ResponseEntity.ok(topFreelancers);
    }
}
