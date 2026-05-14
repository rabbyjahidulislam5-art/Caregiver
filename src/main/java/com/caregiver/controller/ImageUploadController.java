package com.caregiver.controller;

import com.caregiver.model.Profile;
import com.caregiver.repository.ProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/profile")
public class ImageUploadController {

    private final String UPLOAD_DIR = System.getProperty("user.dir") + "/uploads/";

    @Autowired
    private ProfileRepository profileRepository;

    @PostMapping("/{userId}/image")
    public ResponseEntity<?> uploadProfileImage(@PathVariable Long userId, @RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("File is empty");
        }

        try {
            // Find Profile
            Optional<Profile> profileOpt = profileRepository.findByUserId(userId);
            if (profileOpt.isEmpty()) {
                return ResponseEntity.status(404).body("Profile not found for user: " + userId);
            }
            Profile profile = profileOpt.get();

            // Create Directory if not exists
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Generate unique filename
            String originalName = file.getOriginalFilename();
            String fileName = userId + "_" + System.currentTimeMillis() + "_" + (originalName != null ? originalName : "profile.jpg");
            Path filePath = uploadPath.resolve(fileName);

            // Save File
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // Update Profile URL (Serving as static resource or direct match if purely local)
            // For now, storing relative path or simple filename which frontend can resolve via a static file controller if needed.
            // Assuming static resource mapping will be needed or added.
            // Let's store the relative path "/uploads/" + fileName
            String fileUrl = "/uploads/" + fileName;
            profile.setProfilePictureUrl(fileUrl);
            profileRepository.save(profile);

            return ResponseEntity.ok(Map.of("message", "Image uploaded successfully", "url", fileUrl));

        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Failed to upload image: " + e.getMessage());
        }
    }
}
