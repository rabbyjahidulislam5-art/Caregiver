package com.caregiver.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;
import java.time.LocalDateTime;

@Table("complaints")
public class Complaint {
    @Id
    @Column("id")
    private Long id;

    @Column("client_id")
    private Long clientId;

    @Column("caregiver_id")
    private Long caregiverId;

    @Column("description")
    private String description;

    @Column("status")
    private String status; // 'PENDING'

    @Column("date")
    private LocalDateTime date;

    @Column("admin_reply")
    private String adminReply;

    public Complaint() {}

    public Complaint(Long clientId, Long caregiverId, String description) {
        this.clientId = clientId;
        this.caregiverId = caregiverId;
        this.description = description;
        this.status = "PENDING";
        this.date = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getClientId() { return clientId; }
    public void setClientId(Long clientId) { this.clientId = clientId; }
    public Long getCaregiverId() { return caregiverId; }
    public void setCaregiverId(Long caregiverId) { this.caregiverId = caregiverId; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getDate() { return date; }
    public void setDate(LocalDateTime date) { this.date = date; }
    public String getAdminReply() { return adminReply; }
    public void setAdminReply(String adminReply) { this.adminReply = adminReply; }
}
