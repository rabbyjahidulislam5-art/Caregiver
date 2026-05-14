-- Create Database (Run this manually first if not exists)
CREATE DATABASE IF NOT EXISTS caregiver_db;
USE caregiver_db;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    user_id CHAR(36) NOT NULL PRIMARY KEY, -- Storing UUID as String
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('client', 'caregiver', 'admin')),
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    blood_group VARCHAR(5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
    profile_id CHAR(36) NOT NULL PRIMARY KEY,
    user_id CHAR(36) NOT NULL UNIQUE,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    profession VARCHAR(100),
    experience_years INT,
    hourly_rate DECIMAL(10, 2),
    bio TEXT,
    address TEXT,
    city VARCHAR(50),
    photo_url VARCHAR(255),
    latitude DOUBLE,
    longitude DOUBLE,
    rating DOUBLE DEFAULT 0.0,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
    booking_id CHAR(36) NOT NULL PRIMARY KEY,
    client_id CHAR(36) NOT NULL,
    caregiver_id CHAR(36) NOT NULL,
    service_date TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed', 'cancelled')),
    address TEXT,
    latitude DOUBLE,
    longitude DOUBLE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES users(user_id),
    FOREIGN KEY (caregiver_id) REFERENCES users(user_id)
);

-- Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
    review_id CHAR(36) NOT NULL PRIMARY KEY,
    booking_id CHAR(36) NOT NULL,
    reviewer_id CHAR(36) NOT NULL,
    caregiver_id CHAR(36) NOT NULL,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id),
    FOREIGN KEY (reviewer_id) REFERENCES users(user_id),
    FOREIGN KEY (caregiver_id) REFERENCES users(user_id)
);

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    action VARCHAR(50) NOT NULL,
    user_id CHAR(36),
    details TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Complaints Table (Using BIGINT AUTO_INCREMENT as requested previously)
CREATE TABLE IF NOT EXISTS complaints (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    client_id CHAR(36) NOT NULL,
    caregiver_id CHAR(36) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES users(user_id),
    FOREIGN KEY (caregiver_id) REFERENCES users(user_id)
);

-- Schedules Table
CREATE TABLE IF NOT EXISTS schedules (
    schedule_id CHAR(36) NOT NULL PRIMARY KEY,
    caregiver_id CHAR(36) NOT NULL,
    day_of_week VARCHAR(20) NOT NULL,
    start_time VARCHAR(20) NOT NULL,
    end_time VARCHAR(20) NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (caregiver_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_bookings_caregiver_id ON bookings(caregiver_id);
CREATE INDEX idx_bookings_client_id ON bookings(client_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_reviews_caregiver_id ON reviews(caregiver_id);
CREATE INDEX idx_bookings_caregiver_status ON bookings(caregiver_id, status);
CREATE INDEX idx_bookings_client_service_date ON bookings(client_id, service_date);

CREATE INDEX idx_complaints_client ON complaints(client_id);
CREATE INDEX idx_complaints_caregiver ON complaints(caregiver_id);
CREATE INDEX idx_complaints_status ON complaints(status);