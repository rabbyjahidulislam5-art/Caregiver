package com.caregiver.controller;

import com.caregiver.model.Profile;
import com.caregiver.model.User;
import com.caregiver.repository.ProfileRepository;
import com.caregiver.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class CaregiverController {

    @Autowired
    private ProfileRepository profileRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private com.caregiver.repository.ScheduleRepository scheduleRepository;

    // Search Caregivers (Global)
    @GetMapping("/caregivers/search")
    public List<Profile> searchCaregivers(@RequestParam(required = false) String profession) { 
        Iterable<Profile> profilesIter;
        
        if (profession == null || profession.trim().isEmpty()) {
            profilesIter = profileRepository.findAllCaregivers(); // FIX: Use filtered list
        } else {
            profilesIter = profileRepository.searchGlobal(profession); // FIX: Uses filtered query
        }

        List<Profile> profiles = StreamSupport.stream(profilesIter.spliterator(), false)
                .filter(p -> p.getProfession() != null && !p.getProfession().isEmpty())
                .collect(Collectors.toList());

        // Attach Schedules
        List<com.caregiver.model.Schedule> allSchedules = StreamSupport.stream(scheduleRepository.findAll().spliterator(), false).collect(Collectors.toList());
        Map<Long, List<com.caregiver.model.Schedule>> scheduleMap = allSchedules.stream().collect(Collectors.groupingBy(com.caregiver.model.Schedule::getCaregiverId));
        
        profiles.forEach(p -> p.setSchedules(scheduleMap.getOrDefault(p.getUserId(), java.util.Collections.emptyList())));

        return profiles;
    }

    // Get All Caregivers
    @GetMapping("/caregivers")
    public List<Profile> getCaregivers() {
        // FIX: Strictly fetch only caregivers
        List<Profile> profiles = profileRepository.findAllCaregivers(); 
        
        // Filter out empty professions if needed (optional, but good practice)
        profiles = profiles.stream()
                .filter(p -> p.getProfession() != null && !p.getProfession().isEmpty())
                .collect(Collectors.toList());
        
        attachSchedules(profiles); 
        return profiles;
    }

    // --- Advanced Filter Endpoints ---

    @GetMapping("/caregivers/professions")
    public List<String> getDistinctProfessions() {
        return profileRepository.findDistinctProfessions();
    }

    @GetMapping("/caregivers/filter")
    public List<Profile> filterCaregivers(
            @RequestParam(required = false) String profession,
            @RequestParam(required = false) Integer minExp,
            @RequestParam(required = false) Double minRating,
            @RequestParam(required = false) String day) {
            
        List<Profile> profiles = profileRepository.filterCaregivers(
            (profession != null && !profession.isEmpty()) ? profession : null, 
            minExp, 
            minRating, 
            (day != null && !day.isEmpty()) ? day : null
        );
        
        attachSchedules(profiles);
        return profiles;
    }

    private void attachSchedules(List<Profile> profiles) {
        if (profiles.isEmpty()) return;
        List<com.caregiver.model.Schedule> allSchedules = StreamSupport.stream(scheduleRepository.findAll().spliterator(), false).collect(Collectors.toList());
        Map<Long, List<com.caregiver.model.Schedule>> scheduleMap = allSchedules.stream().collect(Collectors.groupingBy(com.caregiver.model.Schedule::getCaregiverId));
        profiles.forEach(p -> p.setSchedules(scheduleMap.getOrDefault(p.getUserId(), java.util.Collections.emptyList())));
    }

    // --- NEW: Update Profile API (Long Version) ---
    @PutMapping("/update-profile/{userId}")
    public String updateProfile(@PathVariable Long userId, @RequestBody Map<String, Object> payload) {
        try {
            // 1. Fetch Profile & User using Long ID
            Profile profile = profileRepository.findByUserId(userId)
                    .orElseThrow(() -> new RuntimeException("Profile not found"));

            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // 2. Update Profile Fields
            if (payload.get("firstName") != null) profile.setFirstName((String) payload.get("firstName"));
            if (payload.get("lastName") != null) profile.setLastName((String) payload.get("lastName"));
            if (payload.get("profession") != null) profile.setProfession((String) payload.get("profession"));

            if (payload.get("experienceYears") != null && !payload.get("experienceYears").toString().isEmpty()) {
                profile.setExperienceYears(Integer.parseInt(payload.get("experienceYears").toString()));
            }

            if (payload.get("address") != null) profile.setPresentAddress((String) payload.get("address"));

            // 3. Update User Fields (Phone)
            if (payload.get("phone") != null) user.setPhone((String) payload.get("phone"));

            // 4. Save Changes
            profileRepository.save(profile);
            userRepository.save(user);

            return "Profile updated successfully!";
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Update failed: " + e.getMessage());
        }
    }
}