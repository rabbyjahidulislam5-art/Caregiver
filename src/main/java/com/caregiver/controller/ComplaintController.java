package com.caregiver.controller;

import com.caregiver.model.Complaint;
import com.caregiver.model.ComplaintResponseDTO;
import com.caregiver.model.Profile;
import com.caregiver.model.User;
import com.caregiver.repository.ComplaintRepository;
import com.caregiver.repository.ProfileRepository;
import com.caregiver.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

@RestController
@RequestMapping("/api/complaints")
@CrossOrigin(origins = "*")
public class ComplaintController {

    @Autowired
    private ComplaintRepository complaintRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProfileRepository profileRepository;

    // 1. Submit Complaint (Client)
    @PostMapping("/submit")
    @Transactional
    public ResponseEntity<?> submitComplaint(@RequestBody Map<String, Object> payload) {
        try {
            String clientStr = String.valueOf(payload.get("clientId"));
            String caregiverStr = String.valueOf(payload.get("caregiverId"));
            String desc = String.valueOf(payload.get("description"));

            if (clientStr == null || clientStr.isEmpty() || "null".equals(clientStr)) 
                return ResponseEntity.badRequest().body("Client ID is missing");
            
            if (caregiverStr == null || caregiverStr.isEmpty() || "null".equals(caregiverStr) || "undefined".equals(caregiverStr))
                return ResponseEntity.badRequest().body("Caregiver ID is missing");

            Long clientId = Long.parseLong(clientStr);
            Long caregiverId = Long.parseLong(caregiverStr);
            
            Complaint complaint = new Complaint(clientId, caregiverId, desc);
            complaintRepository.save(complaint);
            
            return ResponseEntity.ok(java.util.Collections.singletonMap("message", "Complaint submitted successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    // 2. Get All Complaints (Admin)
    @GetMapping("/all")
    public List<ComplaintResponseDTO> getAllComplaints() {
        List<Complaint> complaints = StreamSupport.stream(complaintRepository.findAll().spliterator(), false)
                .collect(Collectors.toList());

        return complaints.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    // 4. Get Client History
    @GetMapping("/history/{clientId}")
    public List<ComplaintResponseDTO> getClientComplaints(@PathVariable Long clientId) {
        return complaintRepository.findByClientId(clientId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    private ComplaintResponseDTO convertToDTO(Complaint complaint) {
        // Fetch Caregiver Details
        User caregiverUser = userRepository.findById(complaint.getCaregiverId()).orElse(null);
        Profile caregiverProfile = profileRepository.findByUserId(complaint.getCaregiverId()).orElse(null);
        
        // Fetch Client Details
        User clientUser = userRepository.findById(complaint.getClientId()).orElse(null);
        Profile clientProfile = profileRepository.findByUserId(complaint.getClientId()).orElse(null);
        
        String cgName = "Unknown";
        String cgEmail = "N/A";
        String cgPhone = "N/A";
        
        String clName = "Unknown";
        String clEmail = "N/A";
        String clPhone = "N/A";

        if (caregiverUser != null) {
            cgEmail = caregiverUser.getEmail();
            cgPhone = caregiverUser.getPhone();
        }
        if (caregiverProfile != null) {
            cgName = caregiverProfile.getFirstName() + " " + caregiverProfile.getLastName();
        }
        
        if (clientUser != null) {
            clEmail = clientUser.getEmail();
            clPhone = clientUser.getPhone();
        }
        if (clientProfile != null) {
            clName = clientProfile.getFirstName() + " " + clientProfile.getLastName();
        }

        return new ComplaintResponseDTO(
            complaint.getId(),
            complaint.getClientId(),
            clName,
            clEmail,
            clPhone,
            complaint.getCaregiverId(),
            cgName,
            cgEmail,
            cgPhone,
            complaint.getDescription(),
            complaint.getStatus(),
            complaint.getDate(),
            complaint.getAdminReply()
        );
    }

    // 3. Admin Reply / Action
    @PostMapping("/reply")
    @Transactional
    public ResponseEntity<?> replyToComplaint(@RequestBody Map<String, Object> payload) {
        try {
            Long complaintId = Long.parseLong(payload.get("complaintId").toString());
            String reply = (String) payload.get("reply");
            
            Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new RuntimeException("Complaint not found with ID: " + complaintId));
            
            complaint.setAdminReply(reply);
            complaint.setStatus("REVIEWED");
            
            complaintRepository.save(complaint);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
    
    // Legacy Endpoint (Optional: keep if frontend uses it, or update frontend to use /all)
    @GetMapping("/pending")
    public java.util.List<Complaint> getPendingComplaints() {
        return complaintRepository.findByStatus("PENDING");
    }
}
