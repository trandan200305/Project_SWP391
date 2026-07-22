package com.cny.backend.user.service;

import com.cny.backend.project.entity.Contract;
import com.cny.backend.project.repository.ContractRepository;
import com.cny.backend.user.dto.RevenueChartDataDto;
import com.cny.backend.user.dto.RevenueHistoryDto;
import com.cny.backend.user.dto.RevenueOverviewDto;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class RevenueService {

    private final ContractRepository contractRepository;

    public RevenueService(ContractRepository contractRepository) {
        this.contractRepository = contractRepository;
    }

    public RevenueOverviewDto getOverview(Integer freelancerId) {
        BigDecimal totalEarnings = contractRepository.sumEarningsByFreelancerAndStatus(freelancerId, "COMPLETED");
        BigDecimal pendingClearance = contractRepository.sumEarningsByFreelancerAndStatus(freelancerId, "ACTIVE");
        Integer completedProjects = contractRepository.countContractsByFreelancerAndStatus(freelancerId, "COMPLETED");
        Integer activeProjects = contractRepository.countContractsByFreelancerAndStatus(freelancerId, "ACTIVE");

        return RevenueOverviewDto.builder()
                .totalEarnings(totalEarnings)
                .pendingClearance(pendingClearance)
                .completedProjects(completedProjects)
                .activeProjects(activeProjects)
                .build();
    }

    public List<RevenueHistoryDto> getHistory(Integer freelancerId) {
        List<Contract> completedContracts = contractRepository.findByFreelancerProfileIdAndStatusOrderByUpdatedAtDesc(freelancerId, "COMPLETED");

        return completedContracts.stream().map(contract -> RevenueHistoryDto.builder()
                .contractId(contract.getContractId())
                .projectTitle(contract.getTitle())
                .clientName(contract.getClient().getCompanyName() != null ? contract.getClient().getCompanyName() : contract.getClient().getFullName())
                .amount(contract.getAgreedAmount())
                .completedAt(contract.getUpdatedAt())
                .status("Thành công")
                .build()
        ).collect(Collectors.toList());
    }

    public List<RevenueChartDataDto> getChartData(Integer freelancerId, Integer year) {
        List<Contract> completedContracts = contractRepository.findByFreelancerProfileIdAndStatusOrderByUpdatedAtDesc(freelancerId, "COMPLETED");
        
        // Filter by year
        List<Contract> contractsThisYear = completedContracts.stream()
                .filter(c -> c.getUpdatedAt().getYear() == year)
                .collect(Collectors.toList());

        // Group by month
        Map<Integer, BigDecimal> monthlyTotals = new HashMap<>();
        for (int i = 1; i <= 12; i++) {
            monthlyTotals.put(i, BigDecimal.ZERO);
        }

        for (Contract c : contractsThisYear) {
            int month = c.getUpdatedAt().getMonthValue();
            monthlyTotals.put(month, monthlyTotals.get(month).add(c.getAgreedAmount()));
        }

        List<RevenueChartDataDto> chartData = new ArrayList<>();
        for (int i = 1; i <= 12; i++) {
            chartData.add(RevenueChartDataDto.builder()
                    .month("Tháng " + i)
                    .amount(monthlyTotals.get(i))
                    .build());
        }

        return chartData;
    }
}
