package com.cny.backend.project.service;

import com.cny.backend.project.entity.Contract;
import com.cny.backend.project.entity.Project;
import com.cny.backend.project.entity.Proposal;
import com.cny.backend.user.entity.Freelancer;
import com.cny.backend.project.dto.ProposalCreateDto;
import com.cny.backend.project.dto.ProposalDto;
import com.cny.backend.project.repository.ContractRepository;
import com.cny.backend.project.repository.ProjectRepository;
import com.cny.backend.project.repository.ProposalRepository;
import com.cny.backend.user.repository.FreelancerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProposalService {

    @Autowired
    private ProposalRepository proposalRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private FreelancerRepository freelancerRepository;

    @Autowired
    private ContractRepository contractRepository;

    @Transactional
    public ProposalDto submitProposal(Integer projectId, Integer freelancerId, ProposalCreateDto dto) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy dự án ID: " + projectId));

        if (!"PUBLISHED".equals(project.getStatus())) {
            throw new IllegalArgumentException("Dự án này không ở trạng thái nhận báo giá.");
        }

        Freelancer freelancer = freelancerRepository.findById(freelancerId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy Freelancer ID: " + freelancerId));

        // Kiểm tra xem đã báo giá chưa
        proposalRepository.findByProjectProjectIdAndFreelancerProfileId(projectId, freelancerId)
                .ifPresent(p -> {
                    throw new IllegalArgumentException("Bạn đã gửi báo giá cho dự án này rồi.");
                });

        Proposal proposal = Proposal.builder()
                .project(project)
                .freelancer(freelancer)
                .bidAmount(dto.getBidAmount())
                .estimatedDays(dto.getEstimatedDays())
                .coverLetter(dto.getCoverLetter())
                .status("SUBMITTED")
                .build();

        Proposal saved = proposalRepository.save(proposal);

        // Tăng đếm số lượng proposal của dự án
        project.setProposalCount(project.getProposalCount() + 1);
        projectRepository.save(project);

        return mapToDto(saved);
    }

    public List<ProposalDto> getProposalsByProject(Integer projectId, Integer userId, String role) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy dự án ID: " + projectId));

        // Kiểm tra quyền: Chỉ chủ dự án (Employer) hoặc Admin/Staff mới được xem
        boolean isOwner = "EMPLOYER".equalsIgnoreCase(role) && project.getClient().getEmployerId().equals(userId);
        boolean isAdmin = List.of("ADMIN", "MANAGER", "STAFF").contains(role.toUpperCase());

        if (!isOwner && !isAdmin) {
            throw new IllegalArgumentException("Bạn không có quyền xem danh sách báo giá của dự án này.");
        }

        return proposalRepository.findByProjectProjectId(projectId)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public ProposalDto getProposalByProjectAndFreelancer(Integer projectId, Integer freelancerId) {
        Proposal proposal = proposalRepository.findByProjectProjectIdAndFreelancerProfileId(projectId, freelancerId)
                .orElse(null);
        return proposal != null ? mapToDto(proposal) : null;
    }

    @Transactional
    public void acceptProposal(Integer proposalId, Integer employerId) {
        Proposal proposal = proposalRepository.findById(proposalId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy báo giá ID: " + proposalId));

        Project project = proposal.getProject();

        // Kiểm tra quyền chủ sở hữu
        if (!project.getClient().getEmployerId().equals(employerId)) {
            throw new IllegalArgumentException("Bạn không có quyền chấp nhận báo giá này.");
        }

        if (!"PUBLISHED".equals(project.getStatus())) {
            throw new IllegalArgumentException("Dự án này hiện không còn khả dụng để chọn thầu.");
        }

        // 1. Cập nhật trạng thái báo giá được chọn
        proposal.setStatus("ACCEPTED");
        proposalRepository.save(proposal);

        // 2. Từ chối tất cả các báo giá khác của dự án này
        List<Proposal> otherProposals = proposalRepository.findByProjectProjectId(project.getProjectId());
        for (Proposal p : otherProposals) {
            if (!p.getProposalId().equals(proposalId)) {
                p.setStatus("REJECTED");
                proposalRepository.save(p);
            }
        }

        // 3. Tạo Hợp đồng mới (Contract)
        Contract contract = Contract.builder()
                .project(project)
                .freelancer(proposal.getFreelancer())
                .client(project.getClient())
                .title("Hợp đồng: " + project.getTitle())
                .agreedAmount(proposal.getBidAmount())
                .startDate(LocalDate.now())
                .status("ACTIVE")
                .terms(proposal.getCoverLetter())
                .build();
        contractRepository.save(contract);

        // 4. Cập nhật trạng thái dự án sang IN_PROGRESS
        project.setStatus("IN_PROGRESS");
        projectRepository.save(project);
    }

    private ProposalDto mapToDto(Proposal proposal) {
        String fullName = proposal.getFreelancer().getFullName();
        String displayName = proposal.getFreelancer().getDisplayName();
        String title = proposal.getFreelancer().getProfessionalTitle();

        return ProposalDto.builder()
                .proposalId(proposal.getProposalId())
                .projectId(proposal.getProject().getProjectId())
                .freelancerId(proposal.getFreelancer().getProfileId())
                .freelancerName(displayName != null ? displayName : (fullName != null ? fullName : "Freelancer"))
                .freelancerAvatar(proposal.getFreelancer().getAvatarUrl())
                .freelancerTitle(title != null ? title : "")
                .bidAmount(proposal.getBidAmount())
                .estimatedDays(proposal.getEstimatedDays())
                .coverLetter(proposal.getCoverLetter())
                .status(proposal.getStatus())
                .createdAt(proposal.getCreatedAt())
                .build();
    }
}
