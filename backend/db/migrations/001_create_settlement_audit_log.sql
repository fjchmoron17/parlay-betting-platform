-- Migration: Create settlement_audit_log table
-- Esta tabla registra todas las resoluciones manuales de apuestas por admin

CREATE TABLE IF NOT EXISTS settlement_audit_log (
  id SERIAL PRIMARY KEY,
  bet_id INTEGER NOT NULL,
  selection_id INTEGER DEFAULT NULL,
  old_status VARCHAR(50),
  new_status VARCHAR(50),
  admin_id VARCHAR(255) NOT NULL,
  admin_notes TEXT,
  is_bet_resolution BOOLEAN DEFAULT FALSE,
  ip_address VARCHAR(45),
  resolved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (bet_id) REFERENCES bets(id) ON DELETE CASCADE,
  FOREIGN KEY (selection_id) REFERENCES bet_selections(id) ON DELETE SET NULL
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_settlement_audit_log_bet_id ON settlement_audit_log(bet_id);
CREATE INDEX IF NOT EXISTS idx_settlement_audit_log_admin_id ON settlement_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_settlement_audit_log_resolved_at ON settlement_audit_log(resolved_at DESC);
CREATE INDEX IF NOT EXISTS idx_settlement_audit_log_selection_id ON settlement_audit_log(selection_id);
