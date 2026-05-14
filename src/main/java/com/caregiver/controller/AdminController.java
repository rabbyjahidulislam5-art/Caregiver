package com.caregiver.controller;

import com.caregiver.model.Complaint;
import com.caregiver.model.Profile;
import com.caregiver.model.User;
import com.caregiver.repository.BookingRepository;
import com.caregiver.repository.ComplaintRepository;
import com.caregiver.repository.ProfileRepository;
import com.caregiver.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProfileRepository profileRepository;

    @Autowired
    private ComplaintRepository complaintRepository;

    // 1. MANAGE USERS (LIST WITH NAMES)
    @GetMapping("/users")
    public List<Map<String, Object>> getAllUsers() {
        List<User> users = StreamSupport.stream(userRepository.findAll().spliterator(), false)
                .collect(Collectors.toList());

        List<Map<String, Object>> result = new ArrayList<>();
        for (User u : users) {
            Map<String, Object> map = new HashMap<>();
            map.put("userId", u.getUserId());
            map.put("email", u.getEmail());
            map.put("role", u.getRole());
            
            Profile p = profileRepository.findByUserId(u.getUserId()).orElse(null);
            if (p != null) {
                map.put("firstName", p.getFirstName());
                map.put("lastName", p.getLastName());
                map.put("profession", p.getProfession());
            } else {
                map.put("firstName", "N/A");
                map.put("lastName", "");
            }
            result.add(map);
        }
        return result;
    }

    @DeleteMapping("/users/{id}")
    public void deleteUser(@PathVariable Long id) {
        userRepository.deleteById(id);
        // Cascading delete might handle profile/bookings if configured in DB, 
        // otherwise we might need manual cleanup. Assuming DB cascade or simple delete for now.
    }

    // 2. APPROVE CAREGIVERS (PENDING PROFILES)
    @GetMapping("/pending-caregivers")
    public List<Map<String, Object>> getPendingCaregivers() {
        // Fetch all Profiles where isActive is false (and logically belong to a Caregiver role)
        List<Profile> profiles = StreamSupport.stream(profileRepository.findAll().spliterator(), false)
                .filter(p -> p.getIsActive() != null && !p.getIsActive())
                .collect(Collectors.toList());

        List<Map<String, Object>> result = new ArrayList<>();
        for (Profile p : profiles) {
            User u = userRepository.findById(p.getUserId()).orElse(null);
            if (u != null && "caregiver".equalsIgnoreCase(u.getRole())) {
                Map<String, Object> map = new HashMap<>();
                // FIX: Use getProfileId() instead of getId()
                map.put("profileId", p.getProfileId()); 
                map.put("userId", u.getUserId());
                map.put("firstName", p.getFirstName());
                map.put("lastName", p.getLastName());
                map.put("email", u.getEmail());
                map.put("profession", p.getProfession());
                map.put("experienceYears", p.getExperienceYears());
                result.add(map);
            }
        }
        return result;
    }

    @Transactional
    @PutMapping("/approve/{profileId}")
    public void approveCaregiver(@PathVariable Long profileId) {
        Profile p = profileRepository.findById(profileId).orElseThrow(() -> new RuntimeException("Profile not found"));
        p.setIsActive(true);
        profileRepository.save(p);
    }

    @Autowired
    private BookingRepository bookingRepository; // Injected 

    // ... (Existing endpoints)

    // 4. APPROVE BOOKINGS (Admin Permissions)
    @GetMapping("/requests/pending")
    public List<Map<String, Object>> getPendingBookingRequests() {
        // Fetch bookings that are either "pending" (direct) or "CAREGIVER_ACCEPTED" (workflow)
        List<com.caregiver.model.Booking> bookings = StreamSupport.stream(bookingRepository.findAll().spliterator(), false)
                .filter(b -> "CAREGIVER_ACCEPTED".equalsIgnoreCase(b.getStatus()) || "pending".equalsIgnoreCase(b.getStatus()))
                .collect(Collectors.toList());

        List<Map<String, Object>> result = new ArrayList<>();
        for (com.caregiver.model.Booking b : bookings) {
            Map<String, Object> map = new HashMap<>();
            map.put("bookingId", b.getBookingId());
            map.put("status", b.getStatus());
            map.put("serviceDate", b.getServiceDate());
            
            // Enrich details
            Profile client = profileRepository.findByUserId(b.getClientId()).orElse(null);
            Profile caregiver = profileRepository.findByUserId(b.getCaregiverId()).orElse(null);
            
            map.put("clientName", client != null ? client.getFirstName() + " " + client.getLastName() : "ID: " + b.getClientId());
            map.put("caregiverName", caregiver != null ? caregiver.getFirstName() + " " + caregiver.getLastName() : "ID: " + b.getCaregiverId());
            
            result.add(map);
        }
        return result;
    }

    @Transactional
    @PostMapping("/requests/{id}/{action}")
    public void reviewBookingRequest(@PathVariable Long id, @PathVariable String action) {
        com.caregiver.model.Booking b = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        
        if ("approve".equalsIgnoreCase(action)) {
            b.setStatus("APPROVED_BY_ADMIN");
        } else if ("reject".equalsIgnoreCase(action)) {
            b.setStatus("REJECTED_BY_ADMIN");
        }
        bookingRepository.save(b);
    }

    @Transactional
    @PutMapping("/complaints/{id}/reply")
    public void replyToComplaint(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        Complaint c = complaintRepository.findById(id).orElseThrow(() -> new RuntimeException("Complaint not found"));
        c.setAdminReply(payload.get("reply"));
        c.setStatus("REVIEWED");
        complaintRepository.save(c);
    }

    // 3. VIEW COMPLAINTS (Existing...)
    @GetMapping("/complaints")
    public List<Map<String, Object>> getAllComplaints() {
        if(complaintRepository == null) return new ArrayList<>(); 

        List<Complaint> complaints = StreamSupport.stream(complaintRepository.findAll().spliterator(), false)
                .collect(Collectors.toList());

        List<Map<String, Object>> result = new ArrayList<>();
        for (Complaint c : complaints) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", c.getId());
            map.put("description", c.getDescription());
            map.put("status", c.getStatus());
            map.put("date", c.getDate());
            map.put("adminReply", c.getAdminReply()); // Added this line

            // Enrich with Client Details
            Profile clientProfile = profileRepository.findByUserId(c.getClientId()).orElse(null);
            User clientUser = userRepository.findById(c.getClientId()).orElse(null);
            
            map.put("clientName", clientProfile != null ? clientProfile.getFirstName() + " " + clientProfile.getLastName() : "ID: " + c.getClientId());
            map.put("clientEmail", clientUser != null ? clientUser.getEmail() : "N/A");
            map.put("clientPhone", clientUser != null ? clientUser.getPhone() : "N/A");

            // Enrich with Caregiver Details
            Profile caregiverProfile = profileRepository.findByUserId(c.getCaregiverId()).orElse(null);
            User caregiverUser = userRepository.findById(c.getCaregiverId()).orElse(null);
            
            map.put("caregiverName", caregiverProfile != null ? caregiverProfile.getFirstName() + " " + caregiverProfile.getLastName() : "ID: " + c.getCaregiverId());
            map.put("caregiverEmail", caregiverUser != null ? caregiverUser.getEmail() : "N/A");
            map.put("caregiverPhone", caregiverUser != null ? caregiverUser.getPhone() : "N/A");

            result.add(map);
        }
        return result;
    }
}
