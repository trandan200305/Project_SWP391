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
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ProjectService {

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private EmployerRepository employerRepository;

    @Autowired
    private JobCategoryRepository jobCategoryRepository;

    @Autowired
    private SavedJobRepository savedJobRepository;

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

        String type = dto.getProjectType() != null ? dto.getProjectType() : "FIXED";

        if ("RANGE".equals(type)) {
            if (dto.getBudgetMin() != null || dto.getBudgetMax() != null) {
                if (dto.getBudgetMin() == null || dto.getBudgetMax() == null) {
                    throw new IllegalArgumentException("Vui lòng điền đầy đủ ngân sách tối thiểu và tối đa.");
                }
                if (dto.getBudgetMin().compareTo(java.math.BigDecimal.ZERO) <= 0 || dto.getBudgetMax().compareTo(java.math.BigDecimal.ZERO) <= 0) {
                    throw new IllegalArgumentException("Ngân sách tối thiểu và tối đa phải lớn hơn 0.");
                }
                if (dto.getBudgetMin().compareTo(dto.getBudgetMax()) > 0) {
                    throw new IllegalArgumentException("Ngân sách tối thiểu không được lớn hơn ngân sách tối đa.");
                }
            }
        } else {
            if (dto.getBudgetFixed() != null) {
                if (dto.getBudgetFixed().compareTo(java.math.BigDecimal.ZERO) <= 0) {
                    throw new IllegalArgumentException("Ngân sách cố định phải lớn hơn 0.");
                }
            }
        }

        Project project = Project.builder()
                .client(client)
                .category(category)
                .title(dto.getTitle())
                .description(dto.getDescription())
                .projectType(type)
                .budgetMin("RANGE".equals(type) ? dto.getBudgetMin() : null)
                .budgetMax("RANGE".equals(type) ? dto.getBudgetMax() : null)
                .budgetFixed("FIXED".equals(type) ? dto.getBudgetFixed() : null)
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
        
        String type = dto.getProjectType() != null ? dto.getProjectType() : project.getProjectType();
        if (dto.getProjectType() != null) project.setProjectType(type);

        if ("RANGE".equals(type)) {
            if (dto.getBudgetMin() != null || dto.getBudgetMax() != null) {
                if (dto.getBudgetMin() == null || dto.getBudgetMax() == null) {
                    throw new IllegalArgumentException("Vui lòng điền đầy đủ ngân sách tối thiểu và tối đa.");
                }
                if (dto.getBudgetMin().compareTo(java.math.BigDecimal.ZERO) <= 0 || dto.getBudgetMax().compareTo(java.math.BigDecimal.ZERO) <= 0) {
                    throw new IllegalArgumentException("Ngân sách tối thiểu và tối đa phải lớn hơn 0.");
                }
                if (dto.getBudgetMin().compareTo(dto.getBudgetMax()) > 0) {
                    throw new IllegalArgumentException("Ngân sách tối thiểu không được lớn hơn ngân sách tối đa.");
                }
            }
            project.setBudgetMin(dto.getBudgetMin());
            project.setBudgetMax(dto.getBudgetMax());
            project.setBudgetFixed(null);
        } else {
            if (dto.getBudgetFixed() != null) {
                if (dto.getBudgetFixed().compareTo(java.math.BigDecimal.ZERO) <= 0) {
                    throw new IllegalArgumentException("Ngân sách cố định phải lớn hơn 0.");
                }
            }
            project.setBudgetFixed(dto.getBudgetFixed());
            project.setBudgetMin(null);
            project.setBudgetMax(null);
        }
        
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

    public List<ProjectDto> getSavedProjects(Integer userId, String userRole) {
        List<SavedJob> savedJobs = savedJobRepository.findByUserIdAndUserRoleOrderBySavedAtDesc(userId, userRole);
        return savedJobs.stream()
                .map(sj -> mapToDto(sj.getProject()))
                .collect(Collectors.toList());
    }

    public void saveProject(Integer userId, String userRole, Integer projectId) {
        Optional<SavedJob> existing = savedJobRepository.findByUserIdAndUserRoleAndProject_ProjectId(userId, userRole, projectId);
        if (existing.isEmpty()) {
            Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));
            
            SavedJob savedJob = SavedJob.builder()
                .userId(userId)
                .userRole(userRole)
                .project(project)
                .savedAt(LocalDateTime.now())
                .build();
            savedJobRepository.save(savedJob);
        }
    }

    @Transactional
    public void unsaveProject(Integer userId, String userRole, Integer projectId) {
        savedJobRepository.deleteByUserIdAndUserRoleAndProject_ProjectId(userId, userRole, projectId);
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
