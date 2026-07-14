package com.cny.backend.project.controller;

import com.cny.backend.project.dto.DeliverableDto;
import com.cny.backend.project.dto.DeliverableSubmitDto;
import com.cny.backend.project.service.DeliverableService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/deliverables")
@CrossOrigin(origins = "*")
public class DeliverableController {

    @Autowired
    private DeliverableService deliverableService;

    // Freelancer nộp sản phẩm cho một mốc công việc
    @PostMapping("/milestones/{milestoneId}")
    public ResponseEntity<?> submitDeliverable(
            @PathVariable Integer milestoneId,
            @RequestParam Integer freelancerId,
            @RequestBody DeliverableSubmitDto dto) {
        try {
            DeliverableDto result = deliverableService.submitDeliverable(milestoneId, dto, freelancerId);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    // Nhà tuyển dụng duyệt hoặc từ chối sản phẩm đã nộp
    @PostMapping("/{deliverableId}/review")
    public ResponseEntity<?> reviewDeliverable(
            @PathVariable Integer deliverableId,
            @RequestParam Integer employerId,
            @RequestParam Boolean approve,
            @RequestParam(required = false) String feedback) {
        try {
            DeliverableDto result = deliverableService.reviewDeliverable(deliverableId, approve, feedback, employerId);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }
}
