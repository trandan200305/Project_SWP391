package com.hello.remake.controller;
import com.hello.remake.entity.Employer;
import com.hello.remake.repository.EmployerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/employers")
@CrossOrigin(origins = "*")
public class EmployerController {
    @Autowired
    private EmployerRepository repo;

    @GetMapping("/{id}")
    public Employer getById(@PathVariable Integer id) {
        return repo.findById(id).orElse(null);
    }

    @PutMapping("/{id}/profile")
    public Employer updateProfile(@PathVariable Integer id, @RequestBody Employer updated) {
        return repo.findById(id).map(e -> {
            if(updated.getDisplayName() != null) e.setDisplayName(updated.getDisplayName());
            if(updated.getFullName() != null) e.setFullName(updated.getFullName());
            if(updated.getPhone() != null) e.setPhone(updated.getPhone());
            if(updated.getCompanyName() != null) e.setCompanyName(updated.getCompanyName());
            if(updated.getCompanyDescription() != null) e.setCompanyDescription(updated.getCompanyDescription());
            if(updated.getWebsite() != null) e.setWebsite(updated.getWebsite());
            if(updated.getCompanySize() != null) e.setCompanySize(updated.getCompanySize());
            if(updated.getIndustry() != null) e.setIndustry(updated.getIndustry());
            if(updated.getAddress() != null) e.setAddress(updated.getAddress());
            if(updated.getCity() != null) e.setCity(updated.getCity());
            if(updated.getCountry() != null) e.setCountry(updated.getCountry());
            if(updated.getLanguage() != null) e.setLanguage(updated.getLanguage());
            if(updated.getTimezone() != null) e.setTimezone(updated.getTimezone());
            if(updated.getAvatarUrl() != null) e.setAvatarUrl(updated.getAvatarUrl());
            return repo.save(e);
        }).orElse(null);
    }

    @DeleteMapping("/{id}")
    public Map<String, Object> deleteAccount(@PathVariable Integer id, @RequestParam(required = false) String confirmationText) {
        Map<String, Object> response = new HashMap<>();
        
        if (confirmationText == null || !confirmationText.equals("DELETE")) {
            response.put("success", false);
            response.put("message", "Chữ xác nhận không hợp lệ. Vui lòng nhập đúng chữ 'DELETE'.");
            return response;
        }

        java.util.Optional<Employer> opt = repo.findById(id);
        if (opt.isPresent()) {
            Employer e = opt.get();
            e.setIsDeleted(true);
            repo.save(e);
            response.put("success", true);
            response.put("message", "Tài khoản Doanh nghiệp của bạn đã được xóa vĩnh viễn.");
        } else {
            response.put("success", false);
            response.put("message", "Không tìm thấy tài khoản để xóa.");
        }
        return response;
    }
}
