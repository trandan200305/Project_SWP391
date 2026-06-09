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
    private ProjectService projectService;

    
    @GetMapping
    public ResponseEntity<List<ProjectDto>> getAllProjects() {
        List<ProjectDto> projects = projectService.getAllPublishedProjects();
        return ResponseEntity.ok(projects);
    }

    
    @GetMapping("/latest")
    public ResponseEntity<List<ProjectDto>> getLatestProjects() {
        List<ProjectDto> latest = projectService.getLatestPublishedProjects();
        return ResponseEntity.ok(latest);
    }

    
    @GetMapping("/search")
    public ResponseEntity<List<ProjectDto>> searchProjects(@RequestParam(value = "keyword", required = false) String keyword) {
        List<ProjectDto> projects = projectService.searchPublishedProjects(keyword);
        return ResponseEntity.ok(projects);
    }

    
    @PostMapping
    public ResponseEntity<ProjectDto> createProject(@RequestBody Project project) {
        ProjectDto saved = projectService.createProject(project);
        return ResponseEntity.ok(saved);
    }
}
