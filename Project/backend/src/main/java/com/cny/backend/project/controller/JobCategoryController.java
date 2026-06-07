package com.cny.backend.project.controller;

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

    
    @GetMapping
    public ResponseEntity<List<JobCategory>> getAllCategories() {
        List<JobCategory> categories = jobCategoryRepository.findByIsActiveTrueOrderByDisplayOrderAsc();
        return ResponseEntity.ok(categories);
    }

    
    @GetMapping("/top")
    public ResponseEntity<List<JobCategory>> getTopCategories() {
        List<JobCategory> categories = jobCategoryRepository.findByParentIsNullAndIsActiveTrueOrderByDisplayOrderAsc();
        return ResponseEntity.ok(categories);
    }

    
    @PostMapping
    public ResponseEntity<JobCategory> createCategory(@RequestBody JobCategory category) {
        JobCategory saved = jobCategoryRepository.save(category);
        return ResponseEntity.ok(saved);
    }
}
