-- 004_add_sport_key_to_bet_selections.sql
ALTER TABLE bet_selections ADD COLUMN sport_key VARCHAR(100) NOT NULL DEFAULT 'unknown';
