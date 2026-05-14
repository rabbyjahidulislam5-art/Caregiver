package com.caregiver.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/", "/index.html", "/style.css", "/script.js", "/images/**", "/uploads/**").permitAll()
                .requestMatchers("/login.html", "/register.html").permitAll()
                .requestMatchers("/admin_dashboard.html", "/client_dashboard.html", "/caregiver_dashboard.html").permitAll()
                .requestMatchers("/admin_portal.html", "/client_portal.html", "/caregiver_portal.html").permitAll()
                .requestMatchers("/api/reports/**").permitAll()
                .requestMatchers("/api/admin/**").permitAll() // Admin Access
                .requestMatchers("/api/**").permitAll() // Broad API accessk
            );
            
        return http.build();
    }
}
