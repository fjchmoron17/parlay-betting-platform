#!/bin/bash
# Script: audit_pending_selections.sh
# Audita selecciones pendientes y muestra detalles para diagnóstico

export DATABASE_URL="postgresql://postgres:rfXpFufjujOJVHlREnNSlcCmhIwGUhCX@tramway.proxy.rlwy.net:42212/railway"

# Listar selecciones pendientes del 15-02-2026
psql "$DATABASE_URL" -c "\
SELECT id, bet_id, game_id, home_team, away_team, market, selected_team, point_spread, selection_status, created_at \
FROM bet_selections \
WHERE selection_status = 'pending' AND created_at::date = '2026-02-15' \
ORDER BY id ASC;\
"

echo "\nResumen de tickets pendientes:"
psql "$DATABASE_URL" -c "\
SELECT bet_id, COUNT(*) as pending_selections \
FROM bet_selections \
WHERE selection_status = 'pending' AND created_at::date = '2026-02-15' \
GROUP BY bet_id \
ORDER BY bet_id;\
"

echo "\nPara cada bet_id, revisa logs y ejecuta manualmente el proceso si es necesario."
