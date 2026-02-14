#!/bin/bash
# Marca como void todas las selecciones y apuestas pendientes de partidos en la ventana de resolución manual

# Configura tu conexión a PostgreSQL

# Configuración de Railway (producción)
PGUSER="postgres"
PGDATABASE="railway"
PGHOST="tramway.proxy.rlwy.net"
PGPORT="42212"
PGPASSWORD="rfXpFufjujOJVHlREnNSlcCmhIwGUhCX"

# Consulta todos los partidos pendientes en la ventana manual
PGPASSWORD="$PGPASSWORD" psql -U "$PGUSER" -d "$PGDATABASE" -h "$PGHOST" -p "$PGPORT" -Atc "
SELECT DISTINCT home_team, away_team, game_commence_time
FROM bet_selections
WHERE selection_status = 'pending'
  AND game_commence_time IS NOT NULL
ORDER BY game_commence_time;" | while IFS='|' read -r home_team away_team game_commence_time; do
  echo "Marcando como void: $home_team vs $away_team ($game_commence_time)"
  # 1. Marcar selecciones como void
  PGPASSWORD="$PGPASSWORD" psql -U "$PGUSER" -d "$PGDATABASE" -h "$PGHOST" -p "$PGPORT" -c "
    UPDATE bet_selections
    SET selection_status = 'void'
    WHERE home_team = '$home_team'
      AND away_team = '$away_team'
      AND game_commence_time = '$game_commence_time'
      AND selection_status = 'pending';
  "
  # 2. Marcar apuestas relacionadas como void si todas sus selecciones están en void
  PGPASSWORD="$PGPASSWORD" psql -U "$PGUSER" -d "$PGDATABASE" -h "$PGHOST" -p "$PGPORT" -c "
    UPDATE bets
    SET status = 'void', actual_win = 0, settled_at = NOW()
    WHERE id IN (
      SELECT bet_id
      FROM bet_selections
      WHERE home_team = '$home_team'
        AND away_team = '$away_team'
        AND game_commence_time = '$game_commence_time'
    )
    AND status = 'pending';
  "
done
