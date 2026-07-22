package com.cny.backend.project.service;

import com.cny.backend.project.entity.Contract;
import com.cny.backend.project.entity.Milestone;
import com.cny.backend.project.entity.Project;
import com.cny.backend.project.dto.ContractDetailDto;
import com.cny.backend.project.dto.CreateDisputeDto;
import com.cny.backend.project.dto.MilestoneDto;
import com.cny.backend.project.repository.ContractRepository;
import com.cny.backend.project.repository.MilestoneRepository;
import com.cny.backend.project.repository.DeliverableRepository;
import com.cny.backend.project.repository.ProjectRepository;
import com.cny.backend.admin.repository.DisputeRepository;
import com.cny.backend.admin.entity.Dispute;
import com.cny.backend.user.entity.Employer;
import com.cny.backend.user.entity.Freelancer;
import com.cny.backend.user.repository.EmployerRepository;
import com.cny.backend.user.repository.FreelancerProfileRepository;
import com.cny.backend.user.repository.FreelancerRepository;
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

    @Autowired
    private DisputeRepository disputeRepository;

    @Autowired
    private FreelancerRepository freelancerRepository;

    @Autowired
    private FreelancerProfileRepository freelancerProfileRepository;

    @Autowired
    private EmployerRepository employerRepository;
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
    public ContractDetailDto getContractByProjectId(Integer projectId, Integer userId) {
        Contract contract = contractRepository.findByProjectProjectId(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy hợp đồng cho dự án ID: " + projectId));
        return getContractDetails(contract.getContractId(), userId);
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

        // Kiểm tra xem hợp đồng đã có mốc công việc chưa và tất cả các mốc công việc đã được duyệt chưa
        List<Milestone> milestones = milestoneRepository.findByContractContractIdOrderByMilestoneIdAsc(contractId);
        if (milestones.isEmpty()) {
            throw new IllegalArgumentException("Không thể hoàn thành hợp đồng do hợp đồng chưa tạo bất kỳ mốc công việc nào.");
        }
        for (Milestone m : milestones) {
            if (!"COMPLETED".equals(m.getStatus())) {
                throw new IllegalArgumentException("Không thể hoàn thành hợp đồng do vẫn còn mốc công việc chưa hoàn thành/phê duyệt: " + m.getTitle());
            }
        }

        // Cập nhật trạng thái hợp đồng thành COMPLETED
        contract.setStatus("COMPLETED");
        contract.setEndDate(LocalDate.now());
        contractRepository.save(contract);

        // Cập nhật trạng thái dự án thành CLOSED
        Project project = contract.getProject();
        if (project != null) {
            project.setStatus("CLOSED");
            projectRepository.save(project);
        }

        // Cập nhật số lượng dự án hoàn thành & tổng thu nhập cho Freelancer
        Freelancer freelancer = contract.getFreelancer();
        if (freelancer != null) {
            freelancer.setProjectsCompleted((freelancer.getProjectsCompleted() == null ? 0 : freelancer.getProjectsCompleted()) + 1);
            if (contract.getAgreedAmount() != null) {
                java.math.BigDecimal curEarnings = freelancer.getTotalEarnings() != null ? freelancer.getTotalEarnings() : java.math.BigDecimal.ZERO;
                freelancer.setTotalEarnings(curEarnings.add(contract.getAgreedAmount()));
            }
            freelancerRepository.save(freelancer);

            freelancerProfileRepository.findByFreelancer_ProfileId(freelancer.getProfileId()).ifPresent(profile -> {
                profile.setProjectsCompleted((profile.getProjectsCompleted() == null ? 0 : profile.getProjectsCompleted()) + 1);
                if (contract.getAgreedAmount() != null) {
                    java.math.BigDecimal curProfEarnings = profile.getTotalEarnings() != null ? profile.getTotalEarnings() : java.math.BigDecimal.ZERO;
                    profile.setTotalEarnings(curProfEarnings.add(contract.getAgreedAmount()));
                }
                freelancerProfileRepository.save(profile);
            });
        }

        // Cập nhật tổng chi tiêu (totalSpent) & Hạng thành viên (tier) cho Employer
        Employer client = contract.getClient();
        if (client != null && contract.getAgreedAmount() != null) {
            com.cny.backend.user.util.EmployerTierUtils.updateEmployerSpending(client, contract.getAgreedAmount(), employerRepository);
        }
    }

    @Transactional
    public void createDispute(Integer contractId, Integer employerId, CreateDisputeDto dto) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy hợp đồng ID: " + contractId));

        if (!contract.getClient().getEmployerId().equals(employerId)) {
            throw new IllegalArgumentException("Bạn không có quyền gửi khiếu nại cho hợp đồng này.");
        }

        if (dto.getReason() == null || dto.getReason().trim().isEmpty()) {
            throw new IllegalArgumentException("Vui lòng nhập lý do/nội dung khiếu nại.");
        }

        String freelancerName = contract.getFreelancer().getDisplayName() != null ? contract.getFreelancer().getDisplayName()
                : (contract.getFreelancer().getFullName() != null ? contract.getFreelancer().getFullName() : "Freelancer");

        String clientName = contract.getClient().getCompanyName() != null ? contract.getClient().getCompanyName()
                : (contract.getClient().getFullName() != null ? contract.getClient().getFullName() : "Client");

        String priority = dto.getPriority() != null ? dto.getPriority() : "MEDIUM";

        com.cny.backend.admin.entity.Dispute dispute = com.cny.backend.admin.entity.Dispute.builder()
                .contractId(contract.getContractId())
                .raisedByEmployerId(employerId)
                .projectTitle(contract.getProject() != null ? contract.getProject().getTitle() : contract.getTitle())
                .clientName(clientName)
                .freelancerName(freelancerName)
                .amount(contract.getAgreedAmount())
                .reason(dto.getReason().trim())
                .priority(priority)
                .status("OPEN")
                .build();

        disputeRepository.save(dispute);
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

    @Transactional
    public void fileDispute(Integer contractId, Integer freelancerId, String reason) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy hợp đồng ID: " + contractId));

        if (!contract.getFreelancer().getProfileId().equals(freelancerId)) {
            throw new IllegalArgumentException("Chỉ freelancer thực hiện hợp đồng mới được quyền gửi tranh chấp.");
        }

        if (!"ACTIVE".equals(contract.getStatus())) {
            throw new IllegalArgumentException("Chỉ có thể khiếu nại tranh chấp khi hợp đồng đang hoạt động.");
        }

        contract.setStatus("DISPUTED");
        contractRepository.save(contract);

        Dispute dispute = Dispute.builder()
                .contractId(contractId)
                .raisedByFreelancerId(freelancerId)
                .projectTitle(contract.getProject().getTitle())
                .clientName(contract.getClient().getCompanyName() != null ? contract.getClient().getCompanyName() : contract.getClient().getFullName())
                .freelancerName(contract.getFreelancer().getDisplayName() != null ? contract.getFreelancer().getDisplayName() : contract.getFreelancer().getFullName())
                .amount(contract.getAgreedAmount())
                .reason(reason)
                .priority("HIGH")
                .status("OPEN")
                .build();
        disputeRepository.save(dispute);
    }
}
