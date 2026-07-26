package com.cny.backend.dashboard.controller;

import com.cny.backend.dashboard.entity.ApiFrequencyStat;
import com.cny.backend.dashboard.repository.ApiFrequencyStatRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/dashboard/api-stats")

public class DashboardController {

    @Autowired
    private ApiFrequencyStatRepository apiFrequencyStatRepository;

    @GetMapping("/all")
    public ResponseEntity<List<ApiFrequencyStat>> getAllApiStats() {
        return ResponseEntity.ok(apiFrequencyStatRepository.findAll());
    }

    @GetMapping("/paginated")
    public ResponseEntity<Map<String, Object>> getApiStatsPaginated(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        // Spring Data JPA pages are 0-indexed, so we subtract 1 from the requested page
        int pageNumber = page > 0 ? page - 1 : 0;
        Page<ApiFrequencyStat> pageResult = apiFrequencyStatRepository.findAll(PageRequest.of(pageNumber, size));
        
        Map<String, Object> response = new HashMap<>();
        response.put("content", pageResult.getContent());
        response.put("currentPage", pageResult.getNumber() + 1);
        response.put("totalItems", pageResult.getTotalElements());
        response.put("totalPages", pageResult.getTotalPages());
        
        return ResponseEntity.ok(response);
    }
}
