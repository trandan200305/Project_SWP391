package com.cny.backend.controller;

import com.cny.backend.entity.Freelancer;
import com.cny.backend.repository.FreelancerRepository;
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
    private FreelancerRepository freelancerRepository;

    
    @GetMapping
    public ResponseEntity<List<Freelancer>> getAllFreelancers() {
        List<Freelancer> freelancers = freelancerRepository.findByIsAvailableTrueOrderByAverageRatingDescProjectsCompletedDesc();
        return ResponseEntity.ok(freelancers);
    }

    
    @GetMapping("/top")
    public ResponseEntity<List<Freelancer>> getTopFreelancers() {
        List<Freelancer> freelancers = freelancerRepository.findTopRatedFreelancers();
        List<Freelancer> topFreelancers = freelancers.stream().limit(4).collect(Collectors.toList());
        return ResponseEntity.ok(topFreelancers);
    }
}
