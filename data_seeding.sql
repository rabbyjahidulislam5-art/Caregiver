-- 1. Insert Dummy Clients
INSERT INTO users (username, email, password_hash, role, phone, blood_group, created_at) VALUES 
('Client Alice', 'alice@test.com', 'password123', 'client', '01711223344', 'O+', NOW()),
('Client Bob', 'bob@test.com', 'password123', 'client', '01999887766', 'A-', NOW());

-- 2. Insert Dummy Caregiver (if not exists, or assume ID 1 for testing if using existing. Using new one to be safe)
INSERT INTO users (username, email, password_hash, role, phone, blood_group, created_at) VALUES 
('Caregiver Charlie', 'charlie@care.com', 'password123', 'caregiver', '01888776655', 'B+', NOW());

-- Get IDs (Assuming Auto Increment, let's say Alice is ID 101, Bob 102, Charlie 103 for example, but better to use subqueries or just hardcode if we know the DB state. 
-- For safety, I will assume the user will run this on a clean or semi-clean DB. I'll use simple inserts).

-- 3. Insert Profiles for Names
INSERT INTO profiles (user_id, first_name, last_name, phone, present_address) VALUES 
((SELECT user_id FROM users WHERE email='alice@test.com'), 'Alice', 'Wonderland', '01711223344', '123 Client St, City'),
((SELECT user_id FROM users WHERE email='bob@test.com'), 'Bob', 'Builder', '01999887766', '456 Construction Rd, City'),
((SELECT user_id FROM users WHERE email='charlie@care.com'), 'Charlie', 'Chaplin', '01888776655', '789 Care Ln, City');

-- 4. Insert Bookings
-- Booking 1: ASSIGNED (Active) - Caregiver Charlie assigned to Client Alice
INSERT INTO bookings (client_id, caregiver_id, status, service_date, created_at) VALUES 
((SELECT user_id FROM users WHERE email='alice@test.com'), 
 (SELECT user_id FROM users WHERE email='charlie@care.com'), 
 'APPROVED_BY_ADMIN', -- Mapping 'ASSIGNED' concept to code's 'APPROVED_BY_ADMIN'
 NOW() + INTERVAL 2 DAY,
 NOW());

-- Booking 2: COMPLETED (History) - Caregiver Charlie worked for Client Bob
INSERT INTO bookings (client_id, caregiver_id, status, service_date, created_at) VALUES 
((SELECT user_id FROM users WHERE email='bob@test.com'), 
 (SELECT user_id FROM users WHERE email='charlie@care.com'), 
 'COMPLETED', 
 NOW() - INTERVAL 5 DAY,
 NOW());
