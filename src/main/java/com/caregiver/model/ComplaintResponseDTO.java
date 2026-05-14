package com.caregiver.model;

import java.time.LocalDateTime;

public class ComplaintResponseDTO {
    private Long id;
    private Long clientId;
    private String clientName;
    private String clientEmail;
    private Long caregiverId;
    private String caregiverName;
    private String caregiverEmail;
    private String caregiverPhone;
    private String description;
    private String status;
    private LocalDateTime date;
    private String adminReply;

    private String clientPhone;

    public ComplaintResponseDTO(Long id, Long clientId, String clientName, String clientEmail, String clientPhone, Long caregiverId, String caregiverName, String caregiverEmail, String caregiverPhone, String description, String status, LocalDateTime date, String adminReply) {
        this.id = id;
        this.clientId = clientId;
        this.clientName = clientName;
        this.clientEmail = clientEmail;
        this.clientPhone = clientPhone;
        this.caregiverId = caregiverId;
        this.caregiverName = caregiverName;
        this.caregiverEmail = caregiverEmail;
        this.caregiverPhone = caregiverPhone;
        this.description = description;
        this.status = status;
        this.date = date;
        this.adminReply = adminReply;
    }

    // Getters
    public Long getId() { return id; }
    public Long getClientId() { return clientId; }
    public String getClientName() { return clientName; }
    public String getClientEmail() { return clientEmail; }
    public String getClientPhone() { return clientPhone; }
    public Long getCaregiverId() { return caregiverId; }
    public String getCaregiverName() { return caregiverName; }
    public String getCaregiverEmail() { return caregiverEmail; }
    public String getCaregiverPhone() { return caregiverPhone; }
    public String getDescription() { return description; }
    public String getStatus() { return status; }
    public LocalDateTime getDate() { return date; }
    public String getAdminReply() { return adminReply; }
}
