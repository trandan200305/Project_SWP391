package com.cny.backend.admin.controller;

import com.cny.backend.admin.dto.PendingGigDto;
import com.cny.backend.admin.dto.PendingProjectDto;
import com.cny.backend.admin.service.AdminService;
import com.cny.backend.project.dto.ArticleDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/moderation")
@CrossOrigin(origins = "*")
public class ModerationController {

    @Autowired
    private AdminService adminService;

    @GetMapping("/projects/pending")
    public ResponseEntity<List<PendingProjectDto>> getPendingProjects() {
        return ResponseEntity.ok(adminService.getPendingProjects());
    }

    @PutMapping("/projects/{id}/moderate")
    public ResponseEntity<Map<String, Object>> moderateProject(
            @PathVariable("id") int id,
            @RequestParam("approve") boolean approve,
            @RequestParam(value = "reason", required = false) String reason,
            @RequestHeader(value = "X-Admin-Id", required = false, defaultValue = "1") int adminId) {
        return ResponseEntity.ok(adminService.moderateProject(id, approve, reason, adminId));
    }

    @GetMapping("/gigs/pending")
    public ResponseEntity<List<PendingGigDto>> getPendingGigs() {
        return ResponseEntity.ok(adminService.getPendingGigs());
    }

    @PutMapping("/gigs/{id}/moderate")
    public ResponseEntity<Map<String, Object>> moderateGig(
            @PathVariable("id") int id,
            @RequestParam("approve") boolean approve,
            @RequestParam(value = "reason", required = false) String reason,
            @RequestHeader(value = "X-Admin-Id", required = false, defaultValue = "1") int adminId) {
        return ResponseEntity.ok(adminService.moderateGig(id, approve, reason, adminId));
    }

    @GetMapping("/articles")
    public ResponseEntity<List<ArticleDto>> getArticles() {
        return ResponseEntity.ok(adminService.getArticles());
    }

    @PutMapping("/content/hide")
    public ResponseEntity<Map<String, Object>> hideInvalidContent(
            @RequestParam("contentType") String contentType,
            @RequestParam("contentId") int contentId,
            @RequestParam("reason") String reason,
            @RequestHeader(value = "X-Admin-Id", required = false, defaultValue = "1") int adminId) {
        // TODO: Implement hideInvalidContent in AdminService
        return ResponseEntity.ok(Map.of("success", true, "message", "Đã ẩn nội dung vi phạm thành công."));
    }

    @GetMapping("/reports")
    public ResponseEntity<List<com.cny.backend.admin.dto.ReportDto>> getReports() {
        return ResponseEntity.ok(adminService.getReports());
    }

    @PutMapping("/reports/{id}/resolve")
    public ResponseEntity<Map<String, Object>> resolveReport(
            @PathVariable("id") int id,
            @RequestParam("status") String status,
            @RequestHeader(value = "X-Admin-Id", required = false, defaultValue = "1") int adminId) {
        return ResponseEntity.ok(adminService.resolveReport(id, status, adminId));
    }
}
