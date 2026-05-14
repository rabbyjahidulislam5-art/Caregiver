package com.caregiver;

import com.caregiver.model.User;
import com.caregiver.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.ResponseEntity;
import java.util.Map;
import java.util.UUID;
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class RegisterIntegrationTest {

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private UserRepository userRepository;

    @Test
    void testRegistrationFlow() {
        String email = "test_" + UUID.randomUUID() + "@example.com";
        Map<String, Object> request = Map.of(
            "email", email,
            "password", "password123",
            "role", "client",
            "firstName", "John",
            "lastName", "Doe",
            "phone", "1234567890",
            "bloodGroup", "O+"
        );

        ResponseEntity<String> response = restTemplate.postForEntity("/api/register", request, String.class);
        
        // Assert API success
        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
        
        // Assert DB persistence
        User user = userRepository.findByEmail(email).orElse(null);
        assertThat(user).isNotNull();
        assertThat(user.getUserId()).isNotNull();
        assertThat(user.getRole()).isEqualTo("client");
    }
}
