package com.cny.backend.project.service;

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
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProjectService {

    @Autowired
    private ProjectRepository projectRepository;

    public List<ProjectDto> getAllPublishedProjects() {
        List<Project> projects = projectRepository.findByIsDeletedFalseAndStatusOrderByCreatedAtDesc("PUBLISHED");
        return projects.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    public List<ProjectDto> getLatestPublishedProjects() {
        List<Project> projects = projectRepository.findByIsDeletedFalseAndStatusOrderByCreatedAtDesc("PUBLISHED");
        return projects.stream().limit(6).map(this::mapToDto).collect(Collectors.toList());
    }

    public List<ProjectDto> searchPublishedProjects(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return getLatestPublishedProjects();
        }
        List<Project> projects = projectRepository.searchProjectsByKeyword("PUBLISHED", keyword.trim());
        return projects.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    public ProjectDto createProject(Project project) {
        Project saved = projectRepository.save(project);
        return mapToDto(saved);
    }

    private ProjectDto mapToDto(Project project) {
        boolean isNew = false;
        if (project.getCreatedAt() != null) {
            isNew = project.getCreatedAt().isAfter(LocalDateTime.now().minusDays(3));
        }

        String employerName = "Unknown";
        String employerAvatar = "https://ui-avatars.com/api/?name=Unknown";
        
        if (project.getClient() != null) {
            if (project.getClient().getCompanyName() != null && !project.getClient().getCompanyName().isEmpty()) {
                employerName = project.getClient().getCompanyName();
            } else if (project.getClient().getUser() != null) {
                employerName = project.getClient().getUser().getFullName();
                if (project.getClient().getUser().getAvatarUrl() != null) {
                    employerAvatar = project.getClient().getUser().getAvatarUrl();
                } else {
                    employerAvatar = "https://ui-avatars.com/api/?name=" + employerName.replace(" ", "+");
                }
            }
        }

        String categoryName = "Chưa phân loại";
        if (project.getCategory() != null) {
            categoryName = project.getCategory().getCategoryName();
        }

        return ProjectDto.builder()
                .id(project.getProjectId())
                .title(project.getTitle())
                .isNew(isNew)
                .employerName(employerName)
                .employerAvatar(employerAvatar)
                .budgetMin(project.getBudgetMin())
                .budgetMax(project.getBudgetMax())
                .deadline(project.getDeadline())
                .description(project.getDescription())
                .applications(project.getProposalCount() != null ? project.getProposalCount() : 0)
                .categoryName(categoryName)
                .build();
    }
}
