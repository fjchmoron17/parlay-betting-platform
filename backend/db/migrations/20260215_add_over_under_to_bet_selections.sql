-- Migration: Add over_under_type and over_under_value to bet_selections
ALTER TABLE bet_selections
ADD COLUMN over_under_type VARCHAR(10), -- 'over' o 'under'
ADD COLUMN over_under_value DECIMAL(5,2); -- Ejemplo: 2.5
