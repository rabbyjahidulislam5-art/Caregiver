-- V20251213__add_missing_columns.sql
-- Run this against 'caregiver_db' to fix missing columns

-- 1. Fix Profiles Table
-- Check compatibility before running. These are non-destructive adds.
-- If columns exist, these might error on older MySQL versions without 'IF NOT EXISTS' support in ALTER.
-- For standard MySQL 8.0:
ALTER TABLE profiles ADD COLUMN rating DOUBLE DEFAULT 0.0;
ALTER TABLE profiles ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE profiles ADD COLUMN experience_years INT DEFAULT 0;
ALTER TABLE profiles ADD COLUMN profile_picture_url VARCHAR(1024);

-- 2. Fix Users Table (if converted to usage of JSON or fix serialization)
-- No schema changes needed for User if we use the Repair Tool + JdbcConfig strategy.
