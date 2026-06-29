package com.cny.backend.project.controller;

import com.cny.backend.project.dto.ContractDetailDto;
import com.cny.backend.project.service.ContractManagementService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/contracts")
@CrossOrigin(origins = "*")
public class ContractManagementController {

    @Autowired
    private ContractManagementService contractManagementService;

    // Lấy danh sách hợp đồng của nhà tuyển dụng
    @GetMapping("/employer")
    public ResponseEntity<?> getEmployerContracts(@RequestParam Integer employerId) {
        try {
            List<ContractDetailDto> list = contractManagementService.getEmployerContracts(employerId);
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Lấy danh sách hợp đồng của freelancer
    @GetMapping("/freelancer")
    public ResponseEntity<?> getFreelancerContracts(@RequestParam Integer freelancerId) {
        try {
            List<ContractDetailDto> list = contractManagementService.getFreelancerContracts(freelancerId);
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Lấy chi tiết hợp đồng kèm danh sách các mốc và sản phẩm nộp
    @GetMapping("/{contractId}")
    public ResponseEntity<?> getContractDetails(
            @PathVariable Integer contractId,
            @RequestParam Integer userId) {
        try {
            ContractDetailDto detail = contractManagementService.getContractDetails(contractId, userId);
            return ResponseEntity.ok(detail);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    // Lấy chi tiết hợp đồng theo Project ID
    @GetMapping("/project/{projectId}")
    public ResponseEntity<?> getContractByProjectId(
            @PathVariable Integer projectId,
            @RequestParam Integer userId) {
        try {
            ContractDetailDto detail = contractManagementService.getContractByProjectId(projectId, userId);
            return ResponseEntity.ok(detail);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    // Nhà tuyển dụng hoàn thành hợp đồng
    @PostMapping("/{contractId}/complete")
    public ResponseEntity<?> completeContract(
            @PathVariable Integer contractId,
            @RequestParam Integer employerId) {
        try {
            contractManagementService.completeContract(contractId, employerId);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }
}
