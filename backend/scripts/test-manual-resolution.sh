#!/bin/bash
# Script para probar la resolución manual de apuestas

# Configuración
ADMIN_TOKEN="admin_secure_parlay_2024"
BACKEND_URL="https://parlaybackend-production-b45e.up.railway.app"

echo "========================================="
echo "Sistema de Resolución Manual de Apuestas"
echo "========================================="
echo ""

# Función para obtener apuestas pendientes
get_pending_bets() {
  echo "📋 Obteniendo apuestas pendientes..."
  curl -s "${BACKEND_URL}/api/settlement/pending-manual?limit=10" | jq '.' 2>/dev/null || echo "Error fetching pending bets"
}

# Función para resolver una apuesta manualmente
resolve_bet() {
  local bet_id=$1
  local admin_id=$2
  local admin_notes=$3
  
  echo "🔧 Resolviendo apuesta BET-${bet_id}..."
  
  # Obtener detalles de la apuesta
  local bet_data=$(curl -s "${BACKEND_URL}/api/bets/${bet_id}" | jq '.' 2>/dev/null)
  
  # Construir payload (ejemplo: primera selección como ganada)
  local payload=$(cat <<EOF
{
  "betId": ${bet_id},
  "selections": [
    {
      "selectionId": 1,
      "result": "won"
    }
  ],
  "adminId": "${admin_id}",
  "adminNotes": "${admin_notes}"
}
EOF
)
  
  echo "Payload: ${payload}"
  
  curl -s -X POST "${BACKEND_URL}/api/settlement/resolve-manual" \
    -H "Content-Type: application/json" \
    -H "x-admin-token: ${ADMIN_TOKEN}" \
    -d "${payload}" | jq '.' 2>/dev/null
}

# Función para obtener audit log
get_audit_log() {
  local bet_id=$1
  echo "📊 Audit log para BET-${bet_id}..."
  curl -s "${BACKEND_URL}/api/settlement/audit-log?betId=${bet_id}" | jq '.' 2>/dev/null || echo "Error fetching audit log"
}

# Menú
case "${1}" in
  "pending")
    get_pending_bets
    ;;
  "resolve")
    if [ -z "$2" ]; then
      echo "Usage: $0 resolve <bet_id> [admin_id] [notes]"
      exit 1
    fi
    resolve_bet "$2" "${3:-admin_system}" "${4:-Manual resolution via CLI}"
    ;;
  "audit")
    if [ -z "$2" ]; then
      echo "Usage: $0 audit <bet_id>"
      exit 1
    fi
    get_audit_log "$2"
    ;;
  *)
    echo "Usage: $0 {pending|resolve|audit}"
    echo ""
    echo "Examples:"
    echo "  $0 pending                              # List pending bets"
    echo "  $0 resolve 1769939867293                # Resolve specific bet"
    echo "  $0 audit 1769939867293                  # View audit trail"
    exit 1
    ;;
esac
