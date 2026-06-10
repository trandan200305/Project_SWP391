package com.cny.backend.project.service;

import com.cny.backend.project.entity.Project;
import com.cny.backend.project.entity.JobCategory;
import com.cny.backend.user.entity.Employer;
import com.cny.backend.project.dto.ProjectCreateDto;
import com.cny.backend.project.dto.ProjectUpdateDto;
import com.cny.backend.project.repository.ProjectRepository;
import com.cny.backend.project.repository.JobCategoryRepository;
import com.cny.backend.user.repository.EmployerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class ProjectService {

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private EmployerRepository employerRepository;

    @Autowired
    private JobCategoryRepository jobCategoryRepository;

    public List<Project> getPublishedProjects() {
        return projectRepository.findByIsDeletedFalseAndStatusOrderByCreatedAtDesc("PUBLISHED");
    }

    public List<Project> searchProjects(String keyword) {
        return projectRepository.searchProjectsByKeyword("PUBLISHED", keyword);
    }

    public List<Project> getProjectsByEmployer(Integer employerId) {
        return projectRepository.findByClientEmployerIdAndIsDeletedFalse(employerId);
    }

    @Transactional
    public Project createProject(ProjectCreateDto dto) {
        Employer client = employerRepository.findById(dto.getClientId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy Employer với ID: " + dto.getClientId()));

        JobCategory category = jobCategoryRepository.findById(dto.getCategoryId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy Danh mục công việc với ID: " + dto.getCategoryId()));

        Project project = Project.builder()
                .client(client)
                .category(category)
                .title(dto.getTitle())
                .description(dto.getDescription())
                .projectType(dto.getProjectType() != null ? dto.getProjectType() : "FIXED")
                .budgetMin(dto.getBudgetMin())
                .budgetMax(dto.getBudgetMax())
                .budgetFixed(dto.getBudgetFixed())
                .deadline(dto.getDeadline())
                .postingExpires(LocalDate.now().plusDays(30)) // Hạn đăng tin mặc định 30 ngày
                .status("PUBLISHED") // Published directly
                .proposalCount(0)
                .isDeleted(false)
                .build();

        return projectRepository.save(project);
    }

    @Transactional
    public Project updateProject(Integer projectId, ProjectUpdateDto dto) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy Dự án với ID: " + projectId));

        if (dto.getCategoryId() != null) {
            JobCategory category = jobCategoryRepository.findById(dto.getCategoryId())
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy Danh mục công việc với ID: " + dto.getCategoryId()));
            project.setCategory(category);
        }

        if (dto.getTitle() != null) project.setTitle(dto.getTitle());
        if (dto.getDescription() != null) project.setDescription(dto.getDescription());
        if (dto.getProjectType() != null) project.setProjectType(dto.getProjectType());
        
        project.setBudgetMin(dto.getBudgetMin());
        project.setBudgetMax(dto.getBudgetMax());
        project.setBudgetFixed(dto.getBudgetFixed());
        project.setDeadline(dto.getDeadline());

        return projectRepository.save(project);
    }

    @Transactional
    public Project closeProject(Integer projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy Dự án với ID: " + projectId));
        project.setStatus("CLOSED");
        return projectRepository.save(project);
    }

    @Transactional
    public Project deleteProject(Integer projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy Dự án với ID: " + projectId));
        project.setIsDeleted(true);
        return projectRepository.save(project);
    }
}
