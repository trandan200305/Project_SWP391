package com.cny.backend.review.controller;

import com.cny.backend.review.dto.ReviewRequestDto;
import com.cny.backend.review.service.ReviewService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController("generalReviewController")
@RequestMapping("/reviews")
@CrossOrigin(origins = "*")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @PostMapping("/contract/{contractId}/employer")
    public ResponseEntity<?> submitEmployerReview(
            @PathVariable Integer contractId,
            @RequestParam Integer employerId,
            @Valid @RequestBody ReviewRequestDto dto) {
        try {
            return ResponseEntity.ok(reviewService.submitEmployerReview(contractId, employerId, dto));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Unable to submit review.");
        }
    }

    @PostMapping("/contract/{contractId}/freelancer")
    public ResponseEntity<?> submitFreelancerReview(
            @PathVariable Integer contractId,
            @RequestParam Integer freelancerId,
            @Valid @RequestBody ReviewRequestDto dto) {
        try {
            return ResponseEntity.ok(reviewService.submitFreelancerReview(contractId, freelancerId, dto));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Unable to submit review.");
        }
    }

    @GetMapping("/contract/{contractId}/general")
    public ResponseEntity<?> getReviewsByContract(@PathVariable Integer contractId) {
        try {
            return ResponseEntity.ok(reviewService.getReviewsByContract(contractId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Unable to load reviews.");
        }
    }
}
