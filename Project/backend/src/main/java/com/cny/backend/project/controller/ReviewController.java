package com.cny.backend.project.controller;

import com.cny.backend.project.dto.ReviewCreateDto;
import com.cny.backend.project.dto.ReviewDto;
import com.cny.backend.project.service.ReviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController("projectReviewController")
@RequestMapping("/reviews")
@CrossOrigin(origins = "*")
public class ReviewController {

    @Autowired
    private ReviewService reviewService;

    // Freelancer viết đánh giá cho Employer của một hợp đồng đã hoàn thành
    @PostMapping("/contract/{contractId}")
    public ResponseEntity<?> writeReview(
            @PathVariable Integer contractId,
            @RequestParam Integer freelancerId,
            @RequestBody ReviewCreateDto dto) {
        try {
            ReviewDto response = reviewService.writeReviewForEmployer(contractId, freelancerId, dto);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    // Lấy tất cả đánh giá mà Freelancer nhận được từ các Employer cũ
    @GetMapping("/freelancer/{freelancerId}")
    public ResponseEntity<?> getFreelancerReviews(@PathVariable Integer freelancerId) {
        try {
            List<ReviewDto> list = reviewService.getFreelancerReviews(freelancerId);
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Lấy tất cả đánh giá của một hợp đồng
    @GetMapping("/contract/{contractId}")
    public ResponseEntity<?> getContractReviews(@PathVariable Integer contractId) {
        try {
            List<ReviewDto> list = reviewService.getContractReviews(contractId);
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
