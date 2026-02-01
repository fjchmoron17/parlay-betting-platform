-- Migration: Add score fields to settlement_audit_log

ALTER TABLE settlement_audit_log
  ADD COLUMN IF NOT EXISTS home_score INTEGER,
  ADD COLUMN IF NOT EXISTS away_score INTEGER,
  ADD COLUMN IF NOT EXISTS final_score VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_settlement_audit_log_final_score ON settlement_audit_log(final_score);
