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
import com.cny.backend.project.service.ProjectService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

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
    public ResponseEntity<?> getAllProjects(
            @RequestParam(value = "page", required = false) Integer page,
            @RequestParam(value = "size", required = false) Integer size) {
        if (page == null || size == null) {
            return ResponseEntity.ok(projectService.getPublishedProjects());
        }
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(projectService.getAllPublishedProjects(pageable));
    }

    @GetMapping("/latest")
    public ResponseEntity<List<Project>> getLatestProjects() {
        List<Project> projects = projectService.getPublishedProjects();
        List<Project> latest = projects.stream().limit(6).collect(Collectors.toList());
        return ResponseEntity.ok(latest);
    }

    @GetMapping("/search")
    public ResponseEntity<?> searchProjects(
            @RequestParam(value = "keyword", defaultValue = "") String keyword,
            @RequestParam(value = "categoryId", required = false) Integer categoryId,
            @RequestParam(value = "minSalary", required = false) java.math.BigDecimal minSalary,
            @RequestParam(value = "page", required = false) Integer page,
            @RequestParam(value = "size", required = false) Integer size) {
        if (page == null || size == null) {
            if (keyword == null || keyword.trim().isEmpty()) {
                return getLatestProjects();
            }
            return ResponseEntity.ok(projectService.searchProjects(keyword.trim()));
        }
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(projectService.searchPublishedProjects(keyword, categoryId, minSalary, pageable));
    }

    @GetMapping("/employer/{employerId}")
    public ResponseEntity<List<Project>> getProjectsByEmployer(@PathVariable Integer employerId) {
        return ResponseEntity.ok(projectService.getProjectsByEmployer(employerId));
    }

    @PostMapping
    public ResponseEntity<?> createProject(@RequestBody ProjectCreateDto dto) {
        try {
            Project saved = projectService.createProject(dto);
            return ResponseEntity.ok(saved);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{projectId}")
    public ResponseEntity<?> updateProject(@PathVariable Integer projectId, @RequestBody ProjectUpdateDto dto) {
        try {
            Project updated = projectService.updateProject(projectId, dto);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{projectId}/close")
    public ResponseEntity<?> closeProject(@PathVariable Integer projectId) {
        try {
            Project closed = projectService.closeProject(projectId);
            return ResponseEntity.ok(closed);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{projectId}")
    public ResponseEntity<?> deleteProject(@PathVariable Integer projectId) {
        try {
            Project deleted = projectService.deleteProject(projectId);
            return ResponseEntity.ok(deleted);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/saved")
    public ResponseEntity<List<ProjectDto>> getSavedProjects(
            @RequestParam Integer userId,
            @RequestParam String userRole) {
        return ResponseEntity.ok(projectService.getSavedProjects(userId, userRole));
    }

    @PostMapping("/{projectId}/save")
    public ResponseEntity<Void> saveProject(
            @PathVariable Integer projectId,
            @RequestParam Integer userId,
            @RequestParam String userRole) {
        projectService.saveProject(userId, userRole, projectId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{projectId}/save")
    public ResponseEntity<Void> unsaveProject(
            @PathVariable Integer projectId,
            @RequestParam Integer userId,
            @RequestParam String userRole) {
        projectService.unsaveProject(userId, userRole, projectId);
        return ResponseEntity.ok().build();
    }
}
