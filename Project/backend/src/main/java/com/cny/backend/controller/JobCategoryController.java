package com.cny.backend.controller;

import com.cny.backend.entity.JobCategory;
import com.cny.backend.repository.JobCategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/categories")
@CrossOrigin(origins = "*")
public class JobCategoryController {

    @Autowired
    private JobCategoryRepository jobCategoryRepository;

    // Get all active job categories
    @GetMapping
    public ResponseEntity<List<JobCategory>> getAllCategories() {
        List<JobCategory> categories = jobCategoryRepository.findByIsActiveTrueOrderByDisplayOrderAsc();
        return ResponseEntity.ok(categories);
    }

    // Get only top-level parent categories for the homepage cards
    @GetMapping("/top")
    public ResponseEntity<List<JobCategory>> getTopCategories() {
        List<JobCategory> categories = jobCategoryRepository.findByParentIsNullAndIsActiveTrueOrderByDisplayOrderAsc();
        return ResponseEntity.ok(categories);
    }

    // Create a new category
    @PostMapping
    public ResponseEntity<JobCategory> createCategory(@RequestBody JobCategory category) {
        JobCategory saved = jobCategoryRepository.save(category);
        return ResponseEntity.ok(saved);
    }
}
