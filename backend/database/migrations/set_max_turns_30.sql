-- Migration: Set max_turns to 30 (September 2026 calendar: 30 days)
USE outvoted;

ALTER TABLE games MODIFY COLUMN max_turns INT DEFAULT 30;
