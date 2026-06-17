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
import java.util.stream.Collectors;

@RestController
@RequestMapping("/projects")
@CrossOrigin(origins = "*")
public class ProjectController {

    @Autowired
    private ProjectRepository projectRepository;

    
    @GetMapping
    public ResponseEntity<List<Project>> getAllProjects() {
        List<Project> projects = projectRepository.findByIsDeletedFalseAndStatusOrderByCreatedAtDesc("PUBLISHED");
        return ResponseEntity.ok(projects);
    }

    
    @GetMapping("/latest")
    public ResponseEntity<List<Project>> getLatestProjects() {
        List<Project> projects = projectRepository.findByIsDeletedFalseAndStatusOrderByCreatedAtDesc("PUBLISHED");
        List<Project> latest = projects.stream().limit(6).collect(Collectors.toList());
        return ResponseEntity.ok(latest);
    }

    
    @GetMapping("/search")
    public ResponseEntity<List<Project>> searchProjects(@RequestParam("keyword") String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return getLatestProjects();
        }
        List<Project> projects = projectRepository.searchProjectsByKeyword("PUBLISHED", keyword.trim());
        return ResponseEntity.ok(projects);
    }

    
    @PostMapping
    public ResponseEntity<Project> createProject(@RequestBody Project project) {
        Project saved = projectRepository.save(project);
        return ResponseEntity.ok(saved);
    }
}
