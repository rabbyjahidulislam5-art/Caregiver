package com.caregiver.controller;

import com.caregiver.model.User;
import com.caregiver.model.Profile;
import com.caregiver.repository.UserRepository;
import com.caregiver.repository.ProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProfileRepository profileRepository;

    @PostMapping("/register")
    public String register(@RequestBody Map<String, Object> payload) {
        try {
            if (userRepository.findByEmail((String) payload.get("email")).isPresent()) {
                throw new RuntimeException("Email already exists");
            }

            // Create User
            User user = new User();
            user.setEmail((String) payload.get("email"));
            user.setUsername((String) payload.get("email")); // FIX: Set username
            user.setPasswordHash((String) payload.get("password"));
            user.setRole((String) payload.get("role"));
            
            // Safe fallback for optional string fields
            user.setPhone(payload.get("phone") != null ? payload.get("phone").toString() : "");
            user.setBloodGroup(payload.get("bloodGroup") != null ? payload.get("bloodGroup").toString() : "");
            
            user.setCreatedAt(LocalDateTime.now());

            User savedUser = userRepository.save(user);

            // Create Profile
            Profile profile = new Profile();
            profile.setUserId(savedUser.getUserId());
            
            profile.setFirstName(payload.get("firstName") != null ? payload.get("firstName").toString() : "");
            profile.setLastName(payload.get("lastName") != null ? payload.get("lastName").toString() : "");
            
            // Safe Integer Parsing
            if (payload.get("experienceYears") != null) {
                try {
                    String expStr = payload.get("experienceYears").toString().trim();
                    if (!expStr.isEmpty()) {
                        profile.setExperienceYears(Integer.parseInt(expStr));
                    }
                } catch (NumberFormatException e) {
                    profile.setExperienceYears(0);
                }
            }

            if (payload.get("profession") != null) {
                profile.setProfession(payload.get("profession").toString());
            }
            if (payload.get("presentAddress") != null) {
                profile.setPresentAddress(payload.get("presentAddress").toString());
            }
            if (payload.get("permanentAddress") != null) {
                profile.setPermanentAddress(payload.get("permanentAddress").toString());
            }

            profile.setIsActive(true);
            profileRepository.save(profile);

            return "User registered successfully";

        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Registration failed: " + e.getMessage());
        }
    }

    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String password = payload.get("password");

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!user.getPasswordHash().equals(password)) {
            throw new RuntimeException("Invalid credentials");
        }

        return Map.of(
                "userId", user.getUserId(), // Long
                "role", user.getRole(),
                "message", "Login successful"
        );
    }

    // --- Profile Fetching with Long ID ---
    @GetMapping("/profile/{userId}")
    public Map<String, Object> getUserProfile(@PathVariable Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Profile profile = profileRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Profile not found"));

        Map<String, Object> response = new HashMap<>();
        response.put("fullName", profile.getFirstName() + " " + profile.getLastName());
        response.put("phone", user.getPhone());
        response.put("email", user.getEmail());
        response.put("address", profile.getPresentAddress());
        response.put("profession", profile.getProfession());
        response.put("profilePictureUrl", profile.getProfilePictureUrl());
        response.put("image", profile.getProfilePictureUrl()); // Keep image for compat if needed elsewhere

        return response;
    }
}