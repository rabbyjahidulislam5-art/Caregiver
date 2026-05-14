package com.caregiver;

import com.caregiver.model.Profile;
import com.caregiver.model.User;
import com.caregiver.repository.ProfileRepository;
import com.caregiver.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import java.time.LocalDateTime;

@SpringBootApplication
public class CaregiverApp {
    public static void main(String[] args) {
        SpringApplication.run(CaregiverApp.class, args);
    }

    @Bean
    public CommandLineRunner initAdmin(UserRepository userRepo, ProfileRepository profileRepo) {
        return args -> {
            // Ensure Admin User Exists
            if (userRepo.findByEmail("admin@caregiver.com").isEmpty()) {
                User admin = new User();
                admin.setUsername("admin");
                admin.setEmail("admin@caregiver.com");
                admin.setPasswordHash("Admin@123");
                admin.setRole("admin");
                admin.setPhone("0000000000");
                admin.setCreatedAt(LocalDateTime.now());
                
                User savedAdmin = userRepo.save(admin);

                // Ensure Admin Profile Exists (Required for Dashboard)
                Profile adminProfile = new Profile();
                adminProfile.setUserId(savedAdmin.getUserId());
                adminProfile.setFirstName("System");
                adminProfile.setLastName("Admin");
                adminProfile.setIsActive(true);
                adminProfile.setProfession("Administrator");
                
                profileRepo.save(adminProfile);
                System.out.println(">>> Admin User & Profile Created Successfully.");
            }
        };
    }
}