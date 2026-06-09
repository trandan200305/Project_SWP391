package com.hello.remake.controller;
import com.hello.remake.entity.Admin;
import com.hello.remake.repository.AdminRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admins")
@CrossOrigin(origins = "*")
public class AdminController {
    @Autowired
    private AdminRepository repo;

    @GetMapping("/{id}")
    public Admin getById(@PathVariable Integer id) {
        return repo.findById(id).orElse(null);
    }

    @PutMapping("/{id}/profile")
    public Admin updateProfile(@PathVariable Integer id, @RequestBody Admin updated) {
        return repo.findById(id).map(a -> {
            if(updated.getDisplayName() != null) a.setDisplayName(updated.getDisplayName());
            if(updated.getFullName() != null) a.setFullName(updated.getFullName());
            if(updated.getPhone() != null) a.setPhone(updated.getPhone());
            if(updated.getLanguage() != null) a.setLanguage(updated.getLanguage());
            if(updated.getTimezone() != null) a.setTimezone(updated.getTimezone());
            if(updated.getAvatarUrl() != null) a.setAvatarUrl(updated.getAvatarUrl());
            return repo.save(a);
        }).orElse(null);
    }
}
