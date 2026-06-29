package com.cny.backend.project.service;

import com.cny.backend.project.entity.Contract;
import com.cny.backend.project.entity.Milestone;
import com.cny.backend.project.entity.Project;
import com.cny.backend.project.dto.ContractDetailDto;
import com.cny.backend.project.dto.MilestoneDto;
import com.cny.backend.project.repository.ContractRepository;
import com.cny.backend.project.repository.MilestoneRepository;
import com.cny.backend.project.repository.DeliverableRepository;
import com.cny.backend.project.repository.ProjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ContractManagementService {

    @Autowired
    private ContractRepository contractRepository;

    @Autowired
    private MilestoneRepository milestoneRepository;

    @Autowired
    private DeliverableRepository deliverableRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private DeliverableService deliverableService;

    @Transactional(readOnly = true)
    public List<ContractDetailDto> getEmployerContracts(Integer employerId) {
        List<Contract> contracts = contractRepository.findByClientEmployerId(employerId);
        return contracts.stream()
                .map(this::mapToBasicDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ContractDetailDto> getFreelancerContracts(Integer freelancerId) {
        List<Contract> contracts = contractRepository.findByFreelancerProfileId(freelancerId);
        return contracts.stream()
                .map(this::mapToBasicDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ContractDetailDto getContractDetails(Integer contractId, Integer userId) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy hợp đồng ID: " + contractId));

        // Kiểm tra quyền truy cập (phải là Client hoặc Freelancer của hợp đồng này)
        boolean isClient = contract.getClient().getEmployerId().equals(userId);
        boolean isFreelancer = contract.getFreelancer().getProfileId().equals(userId);
        if (!isClient && !isFreelancer) {
            throw new IllegalArgumentException("Bạn không có quyền truy cập thông tin hợp đồng này.");
        }

        ContractDetailDto dto = mapToBasicDto(contract);

        // Fetch milestones and their deliverables
        List<Milestone> milestones = milestoneRepository.findByContractContractIdOrderByMilestoneIdAsc(contractId);
        List<MilestoneDto> milestoneDtos = milestones.stream().map(m -> {
            return MilestoneDto.builder()
                    .milestoneId(m.getMilestoneId())
                    .contractId(contractId)
                    .title(m.getTitle())
                    .amount(m.getAmount())
                    .dueDate(m.getDueDate())
                    .status(m.getStatus())
                    .description(m.getDescription())
                    .createdAt(m.getCreatedAt())
                    .updatedAt(m.getUpdatedAt())
                    .deliverables(deliverableRepository.findByMilestoneMilestoneIdOrderByDeliverableIdDesc(m.getMilestoneId())
                            .stream()
                            .map(deliverableService::mapToDto)
                            .collect(Collectors.toList()))
                    .build();
        }).collect(Collectors.toList());

        dto.setMilestones(milestoneDtos);
        return dto;
    }

    @Transactional
    public void completeContract(Integer contractId, Integer employerId) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy hợp đồng ID: " + contractId));

        if (!contract.getClient().getEmployerId().equals(employerId)) {
            throw new IllegalArgumentException("Bạn không có quyền hoàn thành hợp đồng này.");
        }

        if (!"ACTIVE".equals(contract.getStatus())) {
            throw new IllegalArgumentException("Hợp đồng này không ở trạng thái hoạt động (ACTIVE).");
        }

        // Kiểm tra xem tất cả các mốc công việc đã được duyệt chưa
        List<Milestone> milestones = milestoneRepository.findByContractContractIdOrderByMilestoneIdAsc(contractId);
        for (Milestone m : milestones) {
            if (!"APPROVED".equals(m.getStatus())) {
                throw new IllegalArgumentException("Không thể hoàn thành hợp đồng do vẫn còn mốc công việc chưa hoàn thành/phê duyệt: " + m.getTitle());
            }
        }

        // Cập nhật trạng thái hợp đồng thành COMPLETED
        contract.setStatus("COMPLETED");
        contract.setEndDate(LocalDate.now());
        contractRepository.save(contract);

        // Cập nhật trạng thái dự án thành CLOSED
        Project project = contract.getProject();
        project.setStatus("CLOSED");
        projectRepository.save(project);
    }

    private ContractDetailDto mapToBasicDto(Contract contract) {
        String freelancerFullName = contract.getFreelancer().getFullName();
        String freelancerDisplayName = contract.getFreelancer().getDisplayName();
        String freelancerTitle = contract.getFreelancer().getProfessionalTitle();
        String freelancerName = freelancerDisplayName != null ? freelancerDisplayName : 
                (freelancerFullName != null ? freelancerFullName : "Freelancer");

        String employerFullName = contract.getClient().getFullName();
        String employerDisplayName = contract.getClient().getCompanyName();
        String employerName = employerDisplayName != null ? employerDisplayName : 
                (employerFullName != null ? employerFullName : "Client");

        return ContractDetailDto.builder()
                .contractId(contract.getContractId())
                .projectId(contract.getProject().getProjectId())
                .projectTitle(contract.getProject().getTitle())
                .freelancerId(contract.getFreelancer().getProfileId())
                .freelancerName(freelancerName)
                .freelancerAvatar(contract.getFreelancer().getAvatarUrl())
                .freelancerTitle(freelancerTitle != null ? freelancerTitle : "")
                .clientId(contract.getClient().getEmployerId())
                .clientName(employerName)
                .clientAvatar(contract.getClient().getAvatarUrl())
                .title(contract.getTitle())
                .agreedAmount(contract.getAgreedAmount())
                .startDate(contract.getStartDate())
                .endDate(contract.getEndDate())
                .status(contract.getStatus())
                .terms(contract.getTerms())
                .createdAt(contract.getCreatedAt())
                .updatedAt(contract.getUpdatedAt())
                .build();
    }
}
