-- Fix the code column size issue
-- Run this if you already created the database with the old schema

USE outvoted;

-- Alter the regions table to increase code column size
ALTER TABLE regions MODIFY COLUMN code VARCHAR(20) UNIQUE NOT NULL;
