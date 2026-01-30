-- Add voter turnout and total voters to games table
ALTER TABLE games 
ADD COLUMN IF NOT EXISTS voter_turnout DECIMAL(5, 4) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS total_voters INT DEFAULT NULL;
