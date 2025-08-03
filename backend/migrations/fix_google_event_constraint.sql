-- Migration: Allow multiple users to sync the same Google Calendar
-- This removes the UNIQUE constraint on google_event_id to allow different users
-- to have the same Google events in their personal calendars

-- Drop the existing unique constraint
ALTER TABLE events DROP INDEX google_event_id;

-- Add a composite index for better query performance
-- This allows the same google_event_id for different users
CREATE INDEX idx_user_google_event ON events(user_id, google_event_id);