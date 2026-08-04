-- Disable foreign key constraints to prevent deletion conflicts
PRAGMA foreign_keys = OFF;

-- Drop application tables
DROP TABLE IF EXISTS subprofile;
DROP TABLE IF EXISTS paymentrequest;
DROP TABLE IF EXISTS paymentinfo;
DROP TABLE IF EXISTS planfeature;
DROP TABLE IF EXISTS planservice;
DROP TABLE IF EXISTS plan;
DROP TABLE IF EXISTS emailcode;
DROP TABLE IF EXISTS adminuser;
DROP TABLE IF EXISTS license;
DROP TABLE IF EXISTS licensekey;
DROP TABLE IF EXISTS maintenancerequest;
DROP TABLE IF EXISTS notification;
DROP TABLE IF EXISTS "user";

-- Re-enable foreign key constraints
PRAGMA foreign_keys = ON;