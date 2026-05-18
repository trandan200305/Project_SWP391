package com.cny.backend.controller;

import com.cny.backend.dto.RegisterRequest;
import com.cny.backend.entity.FreelancerProfile;
import com.cny.backend.entity.User;
import com.cny.backend.repository.FreelancerProfileRepository;
import com.cny.backend.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.math.BigDecimal;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "*") // Allows the React frontend to call this API
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FreelancerProfileRepository freelancerProfileRepository;

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequest request) {
        // Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            Map<String, String> response = new HashMap<>();
            response.put("error", "Email is already in use");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }

        // Create new User entity
        // Since there is no password encoder, we simulate it for now.
        // In a real application, you MUST hash the password (e.g. BCrypt).
        String simulatedHash = "$2a$10$simulatedHash" + request.getPassword();

        User newUser = User.builder()
                .email(request.getEmail())
                .passwordHash(simulatedHash)
                .displayName(request.getDisplayName())
                .fullName(request.getFullName())
                .phone(request.getPhoneNumber())
                .status("PENDING_VERIFICATION") // Default status
                .emailVerified(false)
                .build();

        User savedUser = userRepository.save(newUser);

        // If the user chose "freelancer", create an empty profile for them
        if ("freelancer".equalsIgnoreCase(request.getRole())) {
            FreelancerProfile profile = FreelancerProfile.builder()
                    .user(savedUser)
                    .professionalTitle("New Freelancer")
                    .bio("Please update your bio.")
                    .hourlyRate(BigDecimal.ZERO)
                    .profileCompleteness(10) // Basic start completeness
                    .isAvailable(true)
                    .build();
            freelancerProfileRepository.save(profile);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("message", "User registered successfully");
        response.put("userId", savedUser.getUserId());
        response.put("role", request.getRole());

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
