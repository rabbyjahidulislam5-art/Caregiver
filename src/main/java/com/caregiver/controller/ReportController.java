package com.caregiver.controller;

import com.caregiver.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayInputStream;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = "*")
public class ReportController {

    @Autowired
    private ReportService reportService;

    // Existing User Report
    @GetMapping("/user")
    public ResponseEntity<InputStreamResource> getUserReport(@RequestParam String email, @RequestParam(defaultValue = "Monthly") String duration) {
        ByteArrayInputStream bis = reportService.generateUserHistory(email, duration);
        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Disposition", "attachment; filename=user_history.pdf");
        return ResponseEntity.ok().headers(headers).contentType(MediaType.APPLICATION_PDF).body(new InputStreamResource(bis));
    }

    // Step 2: Stats Endpoint
    @GetMapping("/stats")
    public ResponseEntity<InputStreamResource> getStatsReport() {
        ByteArrayInputStream bis = reportService.generateSystemStats();

        HttpHeaders headers = new HttpHeaders();
        // Requirement: filename=system_monitoring.pdf
        headers.add("Content-Disposition", "attachment; filename=system_monitoring.pdf");

        return ResponseEntity
                .ok()
                .headers(headers)
                .contentType(MediaType.APPLICATION_PDF)
                .body(new InputStreamResource(bis));
    }
    
    @GetMapping("/assignments")
    public ResponseEntity<InputStreamResource> getAssignmentsReport() {
        ByteArrayInputStream bis = reportService.generateActiveAssignments();
        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Disposition", "attachment; filename=assignments.pdf");
        return ResponseEntity.ok().headers(headers).contentType(MediaType.APPLICATION_PDF).body(new InputStreamResource(bis));
    }
}
