-- No-op migration: `durationDays` was folded into the `PaymentRequest` table
-- definition in 0000_dizzy_redwing.sql (CREATE TABLE ... durationDays ...).
-- Kept as an empty step so the remote D1 journal stays in sync without
-- re-running a non-idempotent ALTER TABLE on already-seeded databases.
SELECT 1;
