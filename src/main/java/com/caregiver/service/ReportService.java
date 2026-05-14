package com.caregiver.service;

import com.caregiver.model.Booking;
import com.caregiver.model.Profile;
import com.caregiver.model.User;
import com.caregiver.repository.BookingRepository;
import com.caregiver.repository.ProfileRepository;
import com.caregiver.repository.UserRepository;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

@Service
public class ReportService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProfileRepository profileRepository; // Kept for User History if needed, but not used in Stats

    @Autowired
    private BookingRepository bookingRepository;

    public ByteArrayInputStream generateUserHistory(String email, String duration) {
        Document document = new Document();
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            // Fetch User
            User user = userRepository.findByEmail(email).orElse(null);
            if (user == null) {
                document.add(new Paragraph("User not found for email: " + email));
                document.close();
                return new ByteArrayInputStream(out.toByteArray());
            }

            // Fetch Profile for Name
            Profile profile = profileRepository.findByUserId(user.getUserId()).orElse(null);
            String fullName = (profile != null) 
                    ? (profile.getFirstName() + " " + profile.getLastName()) 
                    : "Unknown Name";

            // Header Section
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
            Paragraph title = new Paragraph("User History Report", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);
            
            // Metadata
            document.add(new Paragraph("Generated on: " + LocalDate.now()));
            document.add(new Paragraph("User: " + fullName + " (" + user.getRole() + ")"));
            document.add(new Paragraph("Email: " + user.getEmail()));
            document.add(new Paragraph("Duration: " + duration));
            document.add(new Paragraph(" ")); // Blank line spacer

            // Table Structure (4 Columns)
            PdfPTable table = new PdfPTable(4);
            table.setWidthPercentage(100);
            
            // Headers
            table.addCell("Service Date");
            table.addCell("Booking ID");
            table.addCell("Status");
            table.addCell("Counterpart ID");

            // Fetch Bookings
            List<Booking> bookings = StreamSupport.stream(bookingRepository.findAll().spliterator(), false)
                    .filter(b -> b.getClientId().equals(user.getUserId()) || (b.getCaregiverId() != null && b.getCaregiverId().equals(user.getUserId())))
                    .collect(Collectors.toList());

            // Table Data
            for (Booking b : bookings) {
                // Service Date
                table.addCell(b.getServiceDate() != null ? b.getServiceDate().toString() : "N/A");
                
                // Booking ID
                table.addCell(String.valueOf(b.getBookingId())); // Using getBookingId
                
                // Status
                table.addCell(b.getStatus() != null ? b.getStatus() : "N/A");
                
                // Counterpart Logic
                String counterpart = "Unassigned";
                if (user.getRole().equalsIgnoreCase("client")) {
                    if (b.getCaregiverId() != null) {
                        counterpart = "Caregiver " + b.getCaregiverId();
                    }
                } else if (user.getRole().equalsIgnoreCase("caregiver")) {
                    counterpart = "Client " + b.getClientId();
                }
                table.addCell(counterpart);
            }

            document.add(table);
            document.close();

        } catch (Exception e) {
            e.printStackTrace();
        }

        return new ByteArrayInputStream(out.toByteArray());
    }

    // Step 1: Specific Stats Method
    public ByteArrayInputStream generateSystemStats() {
        Document document = new Document();
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
            Paragraph title = new Paragraph("System Monitoring Report", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);
            document.add(new Paragraph("Generated on: " + LocalDate.now()));
            document.add(new Paragraph(" "));

            // Logic: Count only Users and Bookings as requested
            long totalUsers = StreamSupport.stream(userRepository.findAll().spliterator(), false).count();
            long totalBookings = StreamSupport.stream(bookingRepository.findAll().spliterator(), false).count();

            PdfPTable table = new PdfPTable(2);
            table.addCell("Metric");
            table.addCell("Count");
            
            table.addCell("Total Users");
            table.addCell(String.valueOf(totalUsers));
            
            table.addCell("Total Bookings");
            table.addCell(String.valueOf(totalBookings));

            document.add(table);
            document.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
        return new ByteArrayInputStream(out.toByteArray());
    }
    
    public ByteArrayInputStream generateActiveAssignments() {
        return generateSystemStats();
    }
}
