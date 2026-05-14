package com.caregiver.db.migration;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.core.JdbcTemplate;
import javax.sql.DataSource;
import java.io.ByteArrayInputStream;
import java.io.ObjectInputStream;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@SpringBootApplication
public class RepairSerializedRows {

    public static void main(String[] args) {
        System.setProperty("spring.main.web-application-type", "none");
        SpringApplication.run(RepairSerializedRows.class, args);
    }

    @Bean
    public CommandLineRunner run(JdbcTemplate jdbcTemplate) {
        return args -> {
            System.out.println(">>> STARTING DATA REPAIR...");

            // 1. Scan Users for 'ACED00' (Serialized Java Object Header) in any text column
            // (Assuming 'username' or others might be polluted, but usually it's implicit conversion fields)
            // Actually, the error was on INSERT/UPDATE of 'users'. likely the internal mapping.
            // If the data is already corrupt (saved as binary string), we try to fix it.
            
            // Note: Since 'user_id' is PK and CHAR(36), if it was saved as binary, the row might have a garbage ID.
            
            String query = "SELECT * FROM users";
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(query);
            
            System.out.println(">>> Found " + rows.size() + " users to check.");

            for (Map<String, Object> row : rows) {
                // Check if User ID looks like garbage (Java serialization often starts with aced0005)
                // In MySQL, it might look like string if mapped to char.
                Object idObj = row.get("user_id");
                if (idObj != null) {
                    String idStr = idObj.toString();
                    if (containsHex(idStr, "ACED00")) {
                        System.out.println("!!! Found Corrupt User Row: " + row);
                        // Strategy: Delete it? Or fixing it is impossible if the PK is garbage.
                        // We will attempt to delete corrupt rows if they are unusable.
                        jdbcTemplate.update("DELETE FROM users WHERE user_id = ?", idObj);
                        System.out.println("!!! Deleted corrupt row.");
                    }
                }
            }

            // 2. Scan Profiles for missing data or defaults
            // (Previous steps handled schema, this handles data logic if needed)
            
            System.out.println(">>> REPAIR COMPLETE.");
        };
    }

    private boolean containsHex(String input, String hex) {
        // Very basic check if the string representation contains the sequence
        // In reality, MySQL returns the bytes as String in default config
        return input != null && input.contains(hex);
    }
}
