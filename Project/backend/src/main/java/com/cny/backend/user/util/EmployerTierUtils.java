package com.cny.backend.user.util;

import com.cny.backend.user.entity.Employer;
import com.cny.backend.user.repository.EmployerRepository;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class EmployerTierUtils {

    public static String calculateTier(BigDecimal totalSpent) {
        if (totalSpent == null) return "BRONZE";
        if (totalSpent.compareTo(new BigDecimal("50000000")) >= 0) {
            return "PLATINUM";
        } else if (totalSpent.compareTo(new BigDecimal("20000000")) >= 0) {
            return "GOLD";
        } else if (totalSpent.compareTo(new BigDecimal("5000000")) >= 0) {
            return "SILVER";
        }
        return "BRONZE";
    }

    public static int getTierDiscountPercentage(String tier) {
        if ("PLATINUM".equalsIgnoreCase(tier)) return 15;
        if ("GOLD".equalsIgnoreCase(tier)) return 10;
        if ("SILVER".equalsIgnoreCase(tier)) return 5;
        return 0;
    }

    public static void updateEmployerSpending(Employer employer, BigDecimal addedAmount, EmployerRepository employerRepository) {
        if (employer == null || addedAmount == null || addedAmount.compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }
        BigDecimal currentSpent = employer.getTotalSpent() != null ? employer.getTotalSpent() : BigDecimal.ZERO;
        BigDecimal newTotalSpent = currentSpent.add(addedAmount);
        employer.setTotalSpent(newTotalSpent);
        employer.setLastSpentAt(LocalDateTime.now());
        employer.setTier(calculateTier(newTotalSpent));
        employerRepository.save(employer);
    }
}
