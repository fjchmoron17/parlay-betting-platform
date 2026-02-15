-- ====================================================
-- SISTEMA DE APUESTAS B2B - ESTRUCTURA PostgreSQL
-- Para Casas de Apuestas
-- ====================================================

-- ====================================================
-- 1. TABLA: betting_houses (Casas de Apuestas)
-- ====================================================
CREATE TABLE betting_houses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50),
    country VARCHAR(100),
    currency VARCHAR(3) DEFAULT 'USD',
    commission_percentage DECIMAL(5, 2) DEFAULT 2.00,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
    account_balance DECIMAL(15, 2) DEFAULT 0.00,
    total_commission_earned DECIMAL(15, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_betting_houses_status ON betting_houses(status);
CREATE INDEX idx_betting_houses_created_at ON betting_houses(created_at);

-- ====================================================
-- 2. TABLA: betting_house_users (Usuarios únicos por casa)
-- ====================================================
CREATE TABLE betting_house_users (
    id SERIAL PRIMARY KEY,
    betting_house_id INTEGER NOT NULL UNIQUE REFERENCES betting_houses(id) ON DELETE CASCADE,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'admin' CHECK (role IN ('admin', 'operator', 'viewer')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_betting_house ON betting_house_users(betting_house_id);
CREATE INDEX idx_users_username ON betting_house_users(username);
CREATE INDEX idx_users_status ON betting_house_users(status);

-- ====================================================
-- 3. TABLA: bets (Apuestas realizadas)
-- ====================================================
CREATE TABLE bets (
    id SERIAL PRIMARY KEY,
    betting_house_id INTEGER NOT NULL REFERENCES betting_houses(id) ON DELETE CASCADE,
    bet_ticket_number VARCHAR(50) NOT NULL UNIQUE, -- Número de boleto único
    
    -- Información de la apuesta
    bet_type VARCHAR(50) NOT NULL CHECK (bet_type IN ('single', 'parlay', 'system')),
    total_stake DECIMAL(15, 2) NOT NULL CHECK (total_stake > 0),
    total_odds DECIMAL(10, 4) NOT NULL CHECK (total_odds > 0),
    potential_win DECIMAL(15, 2) NOT NULL,
    
    -- Estado y resultado
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost', 'void', 'cashout', 'ongoing')),
    actual_win DECIMAL(15, 2) DEFAULT 0.00,
    
    -- Comisión
    commission_amount DECIMAL(15, 2) DEFAULT 0.00,
    net_win DECIMAL(15, 2) DEFAULT 0.00, -- actual_win - commission
    
    -- Fechas
    placed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    settled_at TIMESTAMP,
    placed_date DATE DEFAULT CURRENT_DATE, -- Para reportes diarios
    
    notes TEXT
);

CREATE INDEX idx_bets_betting_house ON bets(betting_house_id);
CREATE INDEX idx_bets_status ON bets(status);
CREATE INDEX idx_bets_placed_date ON bets(placed_date);
CREATE INDEX idx_bets_settled_at ON bets(settled_at);

-- ====================================================
-- 4. TABLA: bet_selections (Selecciones dentro de una apuesta)
-- ====================================================
CREATE TABLE bet_selections (
    id SERIAL PRIMARY KEY,
    bet_id INTEGER NOT NULL REFERENCES bets(id) ON DELETE CASCADE,
    
    -- Información del evento/juego
    game_id VARCHAR(100) NOT NULL, -- ID del juego de The Odds API
    sport_key VARCHAR(100) NOT NULL, -- Clave del deporte de la API (ej: soccer_italy_serie_a)
    home_team VARCHAR(255) NOT NULL,
    away_team VARCHAR(255) NOT NULL,
    league VARCHAR(100) NOT NULL,
    market VARCHAR(50) NOT NULL CHECK (market IN ('h2h', 'spreads', 'totals')),
    
    -- Selección
    selected_team VARCHAR(255) NOT NULL,
    selected_odds DECIMAL(10, 4) NOT NULL,
    point_spread DECIMAL(5, 2), -- Para spreads/totals
    
    -- Resultado
    selection_status VARCHAR(50) DEFAULT 'pending' CHECK (selection_status IN ('pending', 'won', 'lost', 'void')),
    bookmaker VARCHAR(100),
    game_commence_time TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bet_selections_bet ON bet_selections(bet_id);
CREATE INDEX idx_bet_selections_game ON bet_selections(game_id);
CREATE INDEX idx_bet_selections_status ON bet_selections(selection_status);

-- ====================================================
-- 5. TABLA: daily_reports (Reportes diarios por casa)
-- ====================================================
CREATE TABLE daily_reports (
    id SERIAL PRIMARY KEY,
    betting_house_id INTEGER NOT NULL REFERENCES betting_houses(id) ON DELETE CASCADE,
    report_date DATE NOT NULL,
    
    -- Métricas de apuestas
    total_bets_placed INTEGER DEFAULT 0,
    total_amount_wagered DECIMAL(15, 2) DEFAULT 0.00,
    
    -- Resultados
    bets_won INTEGER DEFAULT 0,
    bets_lost INTEGER DEFAULT 0,
    bets_void INTEGER DEFAULT 0,
    bets_pending INTEGER DEFAULT 0,
    
    -- Dinero
    total_winnings DECIMAL(15, 2) DEFAULT 0.00, -- Total de ganancias brutas
    total_losses DECIMAL(15, 2) DEFAULT 0.00, -- Total de pérdidas (stakes perdidas)
    total_commissions DECIMAL(15, 2) DEFAULT 0.00, -- Comisiones cobradas
    net_profit_loss DECIMAL(15, 2) DEFAULT 0.00, -- Ganancias netas - Comisiones
    
    -- Balance
    opening_balance DECIMAL(15, 2) NOT NULL,
    closing_balance DECIMAL(15, 2) NOT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(betting_house_id, report_date)
);

CREATE INDEX idx_daily_reports_betting_house ON daily_reports(betting_house_id);
CREATE INDEX idx_daily_reports_date ON daily_reports(report_date);

-- ====================================================
-- 6. TABLA: account_transactions (Historial de transacciones)
-- ====================================================
CREATE TABLE account_transactions (
    id SERIAL PRIMARY KEY,
    betting_house_id INTEGER NOT NULL REFERENCES betting_houses(id) ON DELETE CASCADE,
    
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN (
        'bet_placed',      -- Apuesta realizada (débito)
        'bet_won',         -- Apuesta ganada (crédito)
        'commission',      -- Comisión cobrada (débito)
        'deposit',         -- Depósito (crédito)
        'withdrawal',      -- Retiro (débito)
        'adjustment'       -- Ajuste manual
    )),
    
    amount DECIMAL(15, 2) NOT NULL,
    balance_before DECIMAL(15, 2) NOT NULL,
    balance_after DECIMAL(15, 2) NOT NULL,
    
    -- Referencia
    bet_id INTEGER REFERENCES bets(id) ON DELETE SET NULL,
    description TEXT,
    
    transaction_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transactions_betting_house ON account_transactions(betting_house_id);
CREATE INDEX idx_transactions_type ON account_transactions(transaction_type);
CREATE INDEX idx_transactions_date ON account_transactions(transaction_date);
CREATE INDEX idx_transactions_bet ON account_transactions(bet_id);

-- ====================================================
-- 7. TABLA: user_activity_log (Log de actividades)
-- ====================================================
CREATE TABLE user_activity_log (
    id SERIAL PRIMARY KEY,
    betting_house_user_id INTEGER NOT NULL REFERENCES betting_house_users(id) ON DELETE CASCADE,
    betting_house_id INTEGER NOT NULL REFERENCES betting_houses(id) ON DELETE CASCADE,
    
    action VARCHAR(100) NOT NULL, -- 'login', 'placed_bet', 'viewed_report', etc.
    details JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activity_log_user ON user_activity_log(betting_house_user_id);
CREATE INDEX idx_activity_log_house ON user_activity_log(betting_house_id);
CREATE INDEX idx_activity_log_created ON user_activity_log(created_at);

-- ====================================================
-- VISTAS ÚTILES PARA REPORTES
-- ====================================================

-- Vista: Resumen de apuestas por estado
CREATE VIEW v_betting_summary AS
SELECT 
    bh.id,
    bh.name,
    COUNT(b.id) as total_bets,
    SUM(CASE WHEN b.status = 'won' THEN 1 ELSE 0 END) as bets_won,
    SUM(CASE WHEN b.status = 'lost' THEN 1 ELSE 0 END) as bets_lost,
    SUM(CASE WHEN b.status = 'pending' THEN 1 ELSE 0 END) as bets_pending,
    SUM(b.total_stake) as total_wagered,
    SUM(CASE WHEN b.status = 'won' THEN b.actual_win ELSE 0 END) as total_won,
    SUM(b.commission_amount) as total_commissions,
    bh.account_balance
FROM betting_houses bh
LEFT JOIN bets b ON bh.id = b.betting_house_id
GROUP BY bh.id, bh.name, bh.account_balance;

-- Vista: Ganancias/Pérdidas por día
CREATE VIEW v_daily_pnl AS
SELECT 
    dr.report_date,
    bh.name,
    dr.total_bets_placed,
    dr.total_amount_wagered,
    dr.bets_won,
    dr.bets_lost,
    dr.total_winnings,
    dr.total_losses,
    dr.total_commissions,
    dr.net_profit_loss,
    dr.opening_balance,
    dr.closing_balance
FROM daily_reports dr
JOIN betting_houses bh ON dr.betting_house_id = bh.id
ORDER BY dr.report_date DESC;

-- Vista: Últimos 7 días de actividad
CREATE VIEW v_last_7_days_performance AS
SELECT 
    bh.name,
    COUNT(DISTINCT CAST(b.placed_at AS DATE)) as active_days,
    COUNT(b.id) as total_bets,
    SUM(b.total_stake) as total_wagered,
    SUM(CASE WHEN b.status = 'won' THEN 1 ELSE 0 END) as wins,
    SUM(CASE WHEN b.status = 'lost' THEN 1 ELSE 0 END) as losses,
    ROUND(
        SUM(CASE WHEN b.status = 'won' THEN 1 ELSE 0 END)::NUMERIC / 
        NULLIF(COUNT(b.id), 0) * 100, 
        2
    ) as win_rate_percent,
    SUM(CASE WHEN b.status = 'won' THEN b.actual_win ELSE 0 END) - 
    SUM(CASE WHEN b.status = 'lost' THEN b.total_stake ELSE 0 END) as net_pnl
FROM betting_houses bh
LEFT JOIN bets b ON bh.id = b.betting_house_id 
    AND b.placed_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY bh.name;

-- ====================================================
-- PROCEDIMIENTOS ALMACENADOS
-- ====================================================

-- Función para calcular reporte diario
CREATE OR REPLACE FUNCTION calculate_daily_report(
    p_betting_house_id INTEGER,
    p_report_date DATE
)
RETURNS TABLE(
    status VARCHAR,
    message TEXT,
    report_id INTEGER
) AS $$
DECLARE
    v_report_id INTEGER;
    v_opening_balance DECIMAL;
    v_closing_balance DECIMAL;
    v_total_wagered DECIMAL;
    v_total_won DECIMAL;
    v_total_commissions DECIMAL;
BEGIN
    -- Obtener balance de apertura (closing del día anterior)
    SELECT closing_balance INTO v_opening_balance
    FROM daily_reports
    WHERE betting_house_id = p_betting_house_id 
        AND report_date = p_report_date - INTERVAL '1 day'
    LIMIT 1;
    
    IF v_opening_balance IS NULL THEN
        SELECT account_balance INTO v_opening_balance
        FROM betting_houses
        WHERE id = p_betting_house_id;
    END IF;
    
    -- Calcular totales del día
    SELECT 
        COALESCE(SUM(total_stake), 0),
        COALESCE(SUM(CASE WHEN status = 'won' THEN actual_win ELSE 0 END), 0),
        COALESCE(SUM(commission_amount), 0)
    INTO v_total_wagered, v_total_won, v_total_commissions
    FROM bets
    WHERE betting_house_id = p_betting_house_id 
        AND placed_date = p_report_date;
    
    v_closing_balance := v_opening_balance + v_total_won - v_total_wagered - v_total_commissions;
    
    -- Insertar o actualizar reporte
    INSERT INTO daily_reports (
        betting_house_id, report_date, 
        total_bets_placed, total_amount_wagered,
        bets_won, bets_lost, bets_void, bets_pending,
        total_winnings, total_commissions,
        opening_balance, closing_balance
    )
    SELECT
        p_betting_house_id,
        p_report_date,
        COUNT(*),
        v_total_wagered,
        SUM(CASE WHEN status = 'won' THEN 1 ELSE 0 END),
        SUM(CASE WHEN status = 'lost' THEN 1 ELSE 0 END),
        SUM(CASE WHEN status = 'void' THEN 1 ELSE 0 END),
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END),
        v_total_won,
        v_total_commissions,
        v_opening_balance,
        v_closing_balance
    FROM bets
    WHERE betting_house_id = p_betting_house_id 
        AND placed_date = p_report_date
    ON CONFLICT (betting_house_id, report_date) 
    DO UPDATE SET
        total_bets_placed = EXCLUDED.total_bets_placed,
        total_amount_wagered = EXCLUDED.total_amount_wagered,
        bets_won = EXCLUDED.bets_won,
        bets_lost = EXCLUDED.bets_lost,
        total_winnings = EXCLUDED.total_winnings,
        total_commissions = EXCLUDED.total_commissions,
        closing_balance = EXCLUDED.closing_balance,
        updated_at = CURRENT_TIMESTAMP;
    
    RETURN QUERY SELECT 'success'::VARCHAR, 'Reporte diario calculado exitosamente'::TEXT, v_report_id;
END;
$$ LANGUAGE plpgsql;

-- ====================================================
-- DATOS DE EJEMPLO
-- ====================================================

-- Insertar casas de apuestas de ejemplo
INSERT INTO betting_houses (name, email, country, currency, account_balance)
VALUES 
    ('Casa del Juego México', 'info@casajuego.mx', 'Mexico', 'MXN', 50000.00),
    ('Apuestas Latinas', 'admin@apuestaslatinas.com', 'Colombia', 'COP', 30000.00),
    ('BetsCentral', 'support@betscentral.com', 'Argentina', 'ARS', 25000.00)
ON CONFLICT DO NOTHING;

-- Insertar usuarios únicos por casa
INSERT INTO betting_house_users (betting_house_id, username, email, password_hash, full_name, role)
VALUES 
    (1, 'admin_casajuego', 'admin@casajuego.mx', 'hashed_password_1', 'Administrador Casa del Juego', 'admin'),
    (2, 'admin_apuestas', 'admin@apuestaslatinas.com', 'hashed_password_2', 'Administrador Apuestas Latinas', 'admin'),
    (3, 'admin_betscentral', 'admin@betscentral.com', 'hashed_password_3', 'Administrador BetsCentral', 'admin')
ON CONFLICT DO NOTHING;
