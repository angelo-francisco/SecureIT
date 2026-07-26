-- Disable foreign key constraints to prevent deletion conflicts
PRAGMA foreign_keys = OFF;

-- Drop application tables
DROP TABLE IF EXISTS SubProfile;
DROP TABLE IF EXISTS PaymentRequest;
DROP TABLE IF EXISTS PaymentInfo;
DROP TABLE IF EXISTS Plan;
DROP TABLE IF EXISTS EmailCode;
DROP TABLE IF EXISTS AdminUser;
DROP TABLE IF EXISTS License;
DROP TABLE IF EXISTS LicenseKey;
DROP TABLE IF EXISTS User;

-- Re-enable foreign key constraints
PRAGMA foreign_keys = ON;