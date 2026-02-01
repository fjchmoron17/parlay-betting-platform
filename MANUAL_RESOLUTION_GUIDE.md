# Manual Bet Resolution System

## Descripción General

Sistema seguro de resolución manual de apuestas para administradores cuando el sistema automático no puede resolver apuestas (ej: eventos de tenis donde The Odds API no proporciona scores).

## Características

✅ **Autenticación**: Solo admins con token válido pueden resolver apuestas
✅ **Auditoría Completa**: Registra quién, cuándo, qué y desde dónde se resolvió cada apuesta
✅ **Validación**: Verifica que la apuesta exista, esté pendiente y las selecciones sean válidas
✅ **Recálculo**: Automáticamente recalcula el estado de la apuesta basado en las selecciones resueltas
✅ **Historial**: Mantén historial completo de todas las resoluciones manuales

## Endpoints

### 1. Resolver Apuesta Manualmente

```
POST /api/settlement/resolve-manual
```

**Encabezados:**
```
Content-Type: application/json
x-admin-token: admin_secure_parlay_2024
```

**Body:**
```json
{
  "betId": 1769939867293,
  "selections": [
    {
      "selectionId": 2142,
      "result": "won"
    },
    {
      "selectionId": 2143,
      "result": "lost"
    }
  ],
  "adminId": "admin_user_123",
  "adminNotes": "Alcaraz won vs Djokovic - Confirmed on ATP website"
}
```

**Parámetros:**
- `betId` (number): ID de la apuesta a resolver
- `selections` (array): Array de selecciones a resolver
  - `selectionId` (number): ID de la selección individual
  - `result` (string): "won", "lost", o "void"
- `adminId` (string): Identificador del admin resolviendo (para auditoría)
- `adminNotes` (string): Notas sobre por qué se resolvió de esta forma

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "message": "Bet BET-1769939867293-2142 resolved manually by admin",
  "data": {
    "betId": 1769939867293,
    "betTicketNumber": "BET-1769939867293-2142",
    "oldStatus": "pending",
    "newStatus": "won",
    "actualWin": "250.50",
    "resolvedSelections": 1,
    "resolvedAt": "2024-02-02T14:30:00.000Z",
    "adminId": "admin_user_123",
    "adminNotes": "Alcaraz won vs Djokovic - Confirmed on ATP website"
  }
}
```

**Respuestas de Error:**

- 400: Parámetros inválidos
- 403: Token de admin inválido
- 404: Apuesta o selección no encontrada
- 500: Error del servidor

### 2. Obtener Apuestas Pendientes

```
GET /api/settlement/pending-manual?limit=50&offset=0
```

Obtiene lista de apuestas pendientes que necesitan resolución manual.

**Respuesta:**
```json
{
  "success": true,
  "message": "Bets pending manual resolution",
  "data": [
    {
      "id": 1769939867293,
      "bet_ticket_number": "BET-1769939867293-2142",
      "status": "pending",
      "placed_at": "2024-01-31T10:00:00.000Z",
      "placed_date": "2024-01-31",
      "total_stake": "100.00",
      "total_odds": "2.50",
      "potential_win": "250.00",
      "selection_count": 1,
      "pending_count": 1
    }
  ],
  "count": 1
}
```

### 3. Obtener Audit Log

```
GET /api/settlement/audit-log?betId=1769939867293&limit=50&offset=0
```

Obtiene historial completo de resoluciones manuales para una apuesta.

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "bet_id": 1769939867293,
      "selection_id": 2142,
      "old_status": "pending",
      "new_status": "won",
      "admin_id": "admin_user_123",
      "admin_notes": "Alcaraz won vs Djokovic",
      "is_bet_resolution": false,
      "ip_address": "192.168.1.1",
      "resolved_at": "2024-02-02T14:30:00.000Z"
    },
    {
      "id": 2,
      "bet_id": 1769939867293,
      "selection_id": null,
      "old_status": "pending",
      "new_status": "won",
      "admin_id": "admin_user_123",
      "admin_notes": "Bet resolved manually: 1 selection(s)",
      "is_bet_resolution": true,
      "ip_address": "192.168.1.1",
      "resolved_at": "2024-02-02T14:30:00.000Z"
    }
  ],
  "count": 2
}
```

## Flujo de Trabajo

### Paso 1: Obtener Apuestas Pendientes
```bash
curl https://parlaybackend-production-b45e.up.railway.app/api/settlement/pending-manual
```

### Paso 2: Investigar Resultado del Evento
Visita ATP/WTA/ESPN para verificar resultados de tenis, etc.

### Paso 3: Resolver Apuesta
```bash
curl -X POST https://parlaybackend-production-b45e.up.railway.app/api/settlement/resolve-manual \
  -H "Content-Type: application/json" \
  -H "x-admin-token: admin_secure_parlay_2024" \
  -d '{
    "betId": 1769939867293,
    "selections": [
      {
        "selectionId": 2142,
        "result": "won"
      }
    ],
    "adminId": "freddy_admin",
    "adminNotes": "Alcaraz defeated Djokovic 6-3, 7-5"
  }'
```

### Paso 4: Verificar Auditoría
```bash
curl https://parlaybackend-production-b45e.up.railway.app/api/settlement/audit-log?betId=1769939867293
```

## Seguridad

⚠️ **IMPORTANTE**: 
- El `x-admin-token` se valida en cada petición
- Nunca compartas el token en logs o mensajes públicos
- Cada resolución registra la IP del requester
- El adminId identifica quién hizo la resolución
- Las notas quedan disponibles para auditoría

## Tabla de Auditoría

La tabla `settlement_audit_log` registra:

```sql
CREATE TABLE settlement_audit_log (
  id SERIAL PRIMARY KEY,
  bet_id INTEGER,              -- ID de la apuesta
  selection_id INTEGER,        -- ID de la selección (null si es resolución de apuesta completa)
  old_status VARCHAR(50),      -- Estado anterior
  new_status VARCHAR(50),      -- Nuevo estado
  admin_id VARCHAR(255),       -- Quién resolvió
  admin_notes TEXT,            -- Por qué se resolvió
  is_bet_resolution BOOLEAN,   -- Si es resolución de apuesta vs selección
  ip_address VARCHAR(45),      -- IP del requester
  resolved_at TIMESTAMP        -- Cuándo se resolvió
);
```

## Ejemplos de Uso

### Ejemplo 1: Tenis - Alcaraz ganó a Djokovic
```json
{
  "betId": 1769939867293,
  "selections": [
    {
      "selectionId": 2142,
      "result": "won"
    }
  ],
  "adminId": "freddy",
  "adminNotes": "Alcaraz defeated Djokovic 6-3, 7-5 - ATP website confirmed"
}
```

### Ejemplo 2: Parlay con 3 selecciones, una perdida
```json
{
  "betId": 1769939932886,
  "selections": [
    {
      "selectionId": 788,
      "result": "won"
    },
    {
      "selectionId": 789,
      "result": "lost"
    },
    {
      "selectionId": 790,
      "result": "won"
    }
  ],
  "adminId": "freddy",
  "adminNotes": "Parlay result: 2 won, 1 lost = Parlay lost overall"
}
```

### Ejemplo 3: Evento voided (cancelado)
```json
{
  "betId": 1769940000000,
  "selections": [
    {
      "selectionId": 999,
      "result": "void"
    }
  ],
  "adminId": "freddy",
  "adminNotes": "Match cancelled - venue issue. Refunded to player"
}
```

## Lógica de Recálculo de Estado

Después de resolver las selecciones, el sistema recalcula el estado de la apuesta:

- ✅ **GANADA**: Todas las selecciones están marcadas como "won"
- ❌ **PERDIDA**: Al menos una selección está marcada como "lost"
- ◻️ **VOID**: Todas las selecciones resueltas pero ninguna "won" y ninguna "lost"
- ⏳ **PENDING**: Todavía hay selecciones sin resolver

## Testing

Use el script incluido:
```bash
./backend/scripts/test-manual-resolution.sh pending
./backend/scripts/test-manual-resolution.sh resolve 1769939867293 freddy "Match result confirmed"
./backend/scripts/test-manual-resolution.sh audit 1769939867293
```
