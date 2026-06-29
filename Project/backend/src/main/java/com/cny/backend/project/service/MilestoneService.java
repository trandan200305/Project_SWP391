package com.cny.backend.project.service;

import com.cny.backend.project.entity.Contract;
import com.cny.backend.project.entity.Milestone;
import com.cny.backend.project.dto.MilestoneCreateDto;
import com.cny.backend.project.dto.MilestoneDto;
import com.cny.backend.project.repository.MilestoneRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class MilestoneService {

    @Autowired
    private MilestoneRepository milestoneRepository;

    @Transactional
    public Milestone createDefaultMilestone(Contract contract) {
        Milestone milestone = Milestone.builder()
                .contract(contract)
                .title("Mốc 1: Hoàn thành toàn bộ dự án")
                .amount(contract.getAgreedAmount())
                .dueDate(contract.getEndDate() != null ? contract.getEndDate() : contract.getStartDate().plusDays(30))
                .status("PENDING")
                .description(contract.getTerms() != null ? contract.getTerms() : "Thực hiện các công việc theo thỏa thuận hợp đồng.")
                .build();
        return milestoneRepository.save(milestone);
    }

    @Transactional(readOnly = true)
    public List<Milestone> getMilestonesByContract(Integer contractId) {
        return milestoneRepository.findByContractContractIdOrderByMilestoneIdAsc(contractId);
    }
}
