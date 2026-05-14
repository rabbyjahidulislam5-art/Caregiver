package com.caregiver.model;

import java.time.LocalDateTime;

public class BookingResponseDTO {
    private Long bookingId;
    private Long caregiverId; 
    private String caregiverName;
    private String profession;
    private String status;
    private LocalDateTime serviceDate;
    private String address; 
    
    // Client Details (for Caregiver view)
    private String clientName;
    private String clientPhone;
    private String clientAddress;

    public BookingResponseDTO(Long bookingId, Long caregiverId, String caregiverName, String profession, String status, LocalDateTime serviceDate, String address) {
        this.bookingId = bookingId;
        this.caregiverId = caregiverId;
        this.caregiverName = caregiverName;
        this.profession = profession;
        this.status = status;
        this.serviceDate = serviceDate;
        this.address = address;
    }

    // Constructor with Client Details
    public BookingResponseDTO(Long bookingId, Long caregiverId, String caregiverName, String status, LocalDateTime serviceDate, String clientName, String clientPhone, String clientAddress) {
        this.bookingId = bookingId;
        this.caregiverId = caregiverId;
        this.caregiverName = caregiverName;
        this.status = status;
        this.serviceDate = serviceDate;
        this.clientName = clientName;
        this.clientPhone = clientPhone;
        this.clientAddress = clientAddress;
    }

    // Getters and Setters
    public Long getBookingId() { return bookingId; }
    public void setBookingId(Long bookingId) { this.bookingId = bookingId; }
    public Long getCaregiverId() { return caregiverId; }
    public void setCaregiverId(Long caregiverId) { this.caregiverId = caregiverId; }
    public String getCaregiverName() { return caregiverName; }
    public void setCaregiverName(String caregiverName) { this.caregiverName = caregiverName; }
    public String getProfession() { return profession; }
    public void setProfession(String profession) { this.profession = profession; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getServiceDate() { return serviceDate; }
    public void setServiceDate(LocalDateTime serviceDate) { this.serviceDate = serviceDate; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    
    public String getClientName() { return clientName; }
    public void setClientName(String clientName) { this.clientName = clientName; }
    public String getClientPhone() { return clientPhone; }
    public void setClientPhone(String clientPhone) { this.clientPhone = clientPhone; }
    public String getClientAddress() { return clientAddress; }
    public void setClientAddress(String clientAddress) { this.clientAddress = clientAddress; }
}
