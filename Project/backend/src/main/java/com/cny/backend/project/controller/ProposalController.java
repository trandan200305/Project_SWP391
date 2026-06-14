package com.cny.backend.project.controller;

import com.cny.backend.project.dto.ProposalCreateDto;
import com.cny.backend.project.dto.ProposalDto;
import com.cny.backend.project.service.ProposalService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/proposals")
@CrossOrigin(origins = "*")
public class ProposalController {

    @Autowired
    private ProposalService proposalService;

    // Freelancer nộp báo giá
    @PostMapping("/project/{projectId}")
    public ResponseEntity<?> submitProposal(
            @PathVariable Integer projectId,
            @RequestParam Integer freelancerId,
            @RequestBody ProposalCreateDto dto) {
        try {
            ProposalDto response = proposalService.submitProposal(projectId, freelancerId, dto);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Employer/Admin xem danh sách báo giá của dự án
    @GetMapping("/project/{projectId}")
    public ResponseEntity<?> getProposalsByProject(
            @PathVariable Integer projectId,
            @RequestParam Integer userId,
            @RequestParam String role) {
        try {
            List<ProposalDto> list = proposalService.getProposalsByProject(projectId, userId, role);
            return ResponseEntity.ok(list);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Kiểm tra xem freelancer đã nộp báo giá cho dự án chưa
    @GetMapping("/project/{projectId}/check")
    public ResponseEntity<?> checkProposal(
            @PathVariable Integer projectId,
            @RequestParam Integer freelancerId) {
        ProposalDto proposal = proposalService.getProposalByProjectAndFreelancer(projectId, freelancerId);
        return ResponseEntity.ok(proposal); // Trả về null hoặc ProposalDto
    }

    // Employer chọn Freelancer (chấp nhận báo giá)
    @PostMapping("/{proposalId}/accept")
    public ResponseEntity<?> acceptProposal(
            @PathVariable Integer proposalId,
            @RequestParam Integer employerId) {
        try {
            proposalService.acceptProposal(proposalId, employerId);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
