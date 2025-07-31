-- Add unique join_key column to group_list table
ALTER TABLE group_list 
ADD COLUMN join_key VARCHAR(10) UNIQUE NOT NULL AFTER name;

-- Create index for faster lookups
CREATE INDEX idx_group_join_key ON group_list(join_key);