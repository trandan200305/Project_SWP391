package com.cny.backend.user.controller;

import com.cny.backend.user.dto.RevenueChartDataDto;
import com.cny.backend.user.dto.RevenueHistoryDto;
import com.cny.backend.user.dto.RevenueOverviewDto;
import com.cny.backend.user.service.RevenueService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/freelancers/{id}/revenue")
public class RevenueController {

    private final RevenueService revenueService;

    public RevenueController(RevenueService revenueService) {
        this.revenueService = revenueService;
    }

    @GetMapping("/overview")
    public ResponseEntity<RevenueOverviewDto> getOverview(@PathVariable("id") Integer id) {
        return ResponseEntity.ok(revenueService.getOverview(id));
    }

    @GetMapping("/chart")
    public ResponseEntity<List<RevenueChartDataDto>> getChartData(
            @PathVariable("id") Integer id,
            @RequestParam(value = "year", defaultValue = "2024") Integer year) {
        return ResponseEntity.ok(revenueService.getChartData(id, year));
    }

    @GetMapping("/history")
    public ResponseEntity<List<RevenueHistoryDto>> getHistory(@PathVariable("id") Integer id) {
        return ResponseEntity.ok(revenueService.getHistory(id));
    }
}
