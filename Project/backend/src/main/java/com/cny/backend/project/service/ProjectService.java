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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;

@Service
public class ProjectService {

    @Autowired
    private ProjectRepository projectRepository;

    public Page<ProjectDto> getAllPublishedProjects(Pageable pageable) {
        Page<Project> projects = projectRepository.findByIsDeletedFalseAndStatusOrderByCreatedAtDesc("PUBLISHED", pageable);
        return projects.map(this::mapToDto);
    }

    public Page<ProjectDto> getLatestPublishedProjects(Pageable pageable) {
        Page<Project> projects = projectRepository.findByIsDeletedFalseAndStatusOrderByCreatedAtDesc("PUBLISHED", pageable);
        return projects.map(this::mapToDto);
    }

    public Page<ProjectDto> searchPublishedProjects(String keyword, Integer categoryId, java.math.BigDecimal minSalary, Pageable pageable) {
        String kw = (keyword == null) ? "" : keyword.trim();
        Page<Project> projects = projectRepository.searchProjectsByKeywordAndCategory("PUBLISHED", kw, categoryId, minSalary, pageable);
        return projects.map(this::mapToDto);
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
        Integer categoryId = null;
        if (project.getCategory() != null) {
            categoryName = project.getCategory().getCategoryName();
            categoryId = project.getCategory().getCategoryId();
        }

        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd/MM/yyyy, HH:mm");
        String formattedCreatedAt = project.getCreatedAt() != null ? project.getCreatedAt().format(dtf) : "Không rõ";

        String workForm = "-";
        String paymentType = project.getBudgetFixed() != null ? "Trả theo dự án" : "Thỏa thuận";

        String employerLoc = "Chưa cập nhật";
        String employerJoin = "Không rõ";
        Integer employerJobs = 0;
        if (project.getClient() != null) {
            employerLoc = project.getClient().getCity() != null ? project.getClient().getCity() : "Không rõ";
            if (project.getClient().getCreatedAt() != null) {
                DateTimeFormatter dateOnlyFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
                employerJoin = project.getClient().getCreatedAt().format(dateOnlyFormatter);
            }
            employerJobs = project.getClient().getProjectsPosted() != null ? project.getClient().getProjectsPosted() : 0;
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
                .categoryId(categoryId)
                .createdAt(formattedCreatedAt)
                .location(employerLoc)
                .workForm(workForm)
                .paymentType(paymentType)
                .employerLocation(employerLoc)
                .employerJoinDate(employerJoin)
                .employerJobsPosted(employerJobs)
                .skills(Arrays.asList("AFTER EFFECT", "INFOGRAPHIC", "MOTION GRAPHIC"))
                .build();
    }
}
