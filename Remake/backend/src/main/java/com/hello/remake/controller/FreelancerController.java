package com.hello.remake.controller;
import com.hello.remake.entity.Freelancer;
import com.hello.remake.repository.FreelancerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/freelancers")
@CrossOrigin(origins = "*")
public class FreelancerController {
    @Autowired
    private FreelancerRepository repo;

    @GetMapping("/{id}")
    public Freelancer getById(@PathVariable Integer id) {
        return repo.findById(id).orElse(null);
    }

    @PutMapping("/{id}/profile")
    public Freelancer updateProfile(@PathVariable Integer id, @RequestBody Freelancer updated) {
        return repo.findById(id).map(f -> {
            if(updated.getDisplayName() != null) f.setDisplayName(updated.getDisplayName());
            if(updated.getFullName() != null) f.setFullName(updated.getFullName());
            if(updated.getPhone() != null) f.setPhone(updated.getPhone());
            if(updated.getProfessionalTitle() != null) f.setProfessionalTitle(updated.getProfessionalTitle());
            if(updated.getBio() != null) f.setBio(updated.getBio());
            if(updated.getHourlyRate() != null) f.setHourlyRate(updated.getHourlyRate());
            if(updated.getAddress() != null) f.setAddress(updated.getAddress());
            if(updated.getCity() != null) f.setCity(updated.getCity());
            if(updated.getCountry() != null) f.setCountry(updated.getCountry());
            if(updated.getLanguage() != null) f.setLanguage(updated.getLanguage());
            if(updated.getTimezone() != null) f.setTimezone(updated.getTimezone());
            if(updated.getAvatarUrl() != null) f.setAvatarUrl(updated.getAvatarUrl());
            return repo.save(f);
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

        java.util.Optional<Freelancer> opt = repo.findById(id);
        if (opt.isPresent()) {
            Freelancer f = opt.get();
            f.setIsDeleted(true);
            repo.save(f);
            response.put("success", true);
            response.put("message", "Tài khoản của bạn đã được xóa vĩnh viễn.");
        } else {
            response.put("success", false);
            response.put("message", "Không tìm thấy tài khoản để xóa.");
        }
        return response;
    }
}
