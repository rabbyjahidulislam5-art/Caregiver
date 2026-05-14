# Runbook: Caregiver App Repair & Migration

## 1. Quick Start Commands
Run these commands in order to fix the database and start the app.

```bash
# 1. Backup Database (Safety First)
mysqldump -u root -p caregiver_db > caregiver_db_backup_20251213.sql

# 2. Run SQL Migrations (Fix Schema)
# (If using Flyway, run mvn flyway:migrate. Otherwise, import these manually via phpMyAdmin)
# Import file: src/main/resources/db/migration/V20251213__add_missing_columns.sql

# 3. Run Repair Utility (Fix Serialized Data)
mvn -DskipTests exec:java -Dexec.mainClass="com.caregiver.db.migration.RepairSerializedRows"

# 4. Start Application
mvn -DskipTests spring-boot:run
```

## 2. Changes Summary

### Database Schema Fixes
- Added missing columns to `profiles`: `rating`, `is_active`, `experience_years`, `profile_picture_url`.
- Ensured consistency between Java Entities and MySQL Tables.

### Serialization Fix (ACED00 Error)
- Identified cause: Java `UUID` objects were being serialized into binary because MySQL `CHAR(36)` columns require explicit string conversion in Spring Data JDBC.
- **Fix**: Added `JdbcConfig.java` to convert `UUID` <-> `String` automatically.
- **Repair**: Created `RepairSerializedRows.java` to find and fix any existing corrupt data.

### Supabase Removal
- Frontend now uses local endpoints (`/api/login`, `/api/register`) instead of Supabase SDK.
- Backend connected fully to XAMPP MySQL.

## 3. Rollback
If issues arise, run:
```sql
DROP DATABASE caregiver_db;
CREATE DATABASE caregiver_db;
-- Restore from backup
-- Import caregiver_db_backup_20251213.sql
```
