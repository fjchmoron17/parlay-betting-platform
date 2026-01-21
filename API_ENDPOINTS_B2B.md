# 🎰 API REST Endpoints - Sistema B2B de Apuestas

## Base URL
```
http://localhost:3333/api
https://parlaybackend-production-b45e.up.railway.app/api
```

---

## 🏢 CASAS DE APUESTAS (Betting Houses)

### 1. Obtener todas las casas
```bash
GET /betting-houses
```
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Casa del Juego México",
      "email": "info@casajuego.mx",
      "country": "Mexico",
      "currency": "MXN",
      "account_balance": 50000.00,
      "status": "active",
      "created_at": "2026-01-21T10:00:00Z"
    }
  ],
  "total": 1
}
```

### 2. Obtener resumen de casas
```bash
GET /betting-houses/summary
```
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Casa del Juego México",
      "account_balance": 50000.00,
      "total_bets": 150,
      "bets_won": 95,
      "bets_lost": 55,
      "status": "active"
    }
  ],
  "total": 1
}
```

### 3. Obtener una casa por ID
```bash
GET /betting-houses/:id
```

### 4. Crear una nueva casa
```bash
POST /betting-houses
Content-Type: application/json

{
  "name": "Nueva Casa de Apuestas",
  "email": "nuevacasa@example.com",
  "country": "Colombia",
  "currency": "COP"
}
```

---

## 🎲 APUESTAS (Bets)

### 1. Realizar una apuesta
```bash
POST /bets-db
Content-Type: application/json

{
  "bettingHouseId": 1,
  "betTicketNumber": "TICKET-2026-01-21-001",
  "betType": "parlay",
  "totalStake": 100.00,
  "totalOdds": 3.50,
  "selections": [
    {
      "gameId": "game123",
      "homeTeam": "Denver Broncos",
      "awayTeam": "New England Patriots",
      "league": "NFL",
      "market": "h2h",
      "selectedTeam": "Denver Broncos",
      "selectedOdds": 1.50
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "betting_house_id": 1,
    "bet_ticket_number": "TICKET-2026-01-21-001",
    "bet_type": "parlay",
    "total_stake": 100.00,
    "total_odds": 3.50,
    "potential_win": 350.00,
    "status": "pending",
    "placed_at": "2026-01-21T10:30:00Z"
  },
  "message": "Bet placed successfully"
}
```

### 2. Obtener apuestas de una casa
```bash
GET /bets-db/:bettingHouseId?limit=50&offset=0&status=pending
```

**Parámetros:**
- `limit`: Número de resultados (default: 50)
- `offset`: Desplazamiento (default: 0)
- `status`: Filtrar por estado (pending, won, lost, void, cashout)

### 3. Obtener apuestas por fecha
```bash
GET /bets-db/:bettingHouseId/date/2026-01-21
```

### 4. Obtener estadísticas de apuestas
```bash
GET /bets-db/:bettingHouseId/stats?fromDate=2026-01-01&toDate=2026-01-31
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_bets": 150,
    "bets_won": 95,
    "bets_lost": 55,
    "bets_pending": 0,
    "total_wagered": 15000.00,
    "total_winnings": 22500.00,
    "total_commissions": 450.00,
    "net_profit_loss": 7050.00
  }
}
```

### 5. Obtener una apuesta específica
```bash
GET /bets-db/detail/:betId
```

### 6. Resolver una apuesta (marcar como ganada/perdida)
```bash
PUT /bets-db/:id/settle
Content-Type: application/json

{
  "status": "won",
  "actualWin": 350.00,
  "commissionPercentage": 2
}
```

**Parámetros:**
- `status`: won | lost | void
- `actualWin`: Cantidad ganada (si aplica)
- `commissionPercentage`: Porcentaje de comisión (default: 2%)

---

## 📊 REPORTES (Reports)

### 1. Calcular reporte diario
```bash
POST /reports/:bettingHouseId/calculate
Content-Type: application/json

{
  "reportDate": "2026-01-21"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "report_date": "2026-01-21",
    "total_bets_placed": 150,
    "total_amount_wagered": 15000.00,
    "bets_won": 95,
    "bets_lost": 55,
    "total_winnings": 22500.00,
    "total_commissions": 450.00,
    "net_profit_loss": 7050.00,
    "opening_balance": 45000.00,
    "closing_balance": 52050.00
  }
}
```

### 2. Obtener reporte de una fecha
```bash
GET /reports/:bettingHouseId/date/2026-01-21
```

### 3. Obtener reportes por rango de fechas
```bash
GET /reports/:bettingHouseId/range?fromDate=2026-01-01&toDate=2026-01-31
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "report_date": "2026-01-31",
      "total_bets_placed": 150,
      ...
    }
  ],
  "totals": {
    "totalBets": 4500,
    "totalWagered": 450000.00,
    "totalWon": 2850,
    "totalLost": 1650,
    "totalCommissions": 9000.00,
    "netProfitLoss": 211000.00
  },
  "days": 31
}
```

### 4. Obtener último reporte
```bash
GET /reports/:bettingHouseId/latest
```

---

## 🎮 EJEMPLO COMPLETO DE FLUJO

### 1. Crear una casa de apuestas
```bash
curl -X POST http://localhost:3333/api/betting-houses \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mi Casa de Apuestas",
    "email": "admin@micasa.com",
    "country": "Argentina",
    "currency": "ARS"
  }'
```

### 2. Realizar una apuesta
```bash
curl -X POST http://localhost:3333/api/bets-db \
  -H "Content-Type: application/json" \
  -d '{
    "bettingHouseId": 1,
    "betTicketNumber": "TICKET-001",
    "betType": "parlay",
    "totalStake": 100,
    "totalOdds": 2.5
  }'
```

### 3. Resolver la apuesta
```bash
curl -X PUT http://localhost:3333/api/bets-db/1/settle \
  -H "Content-Type: application/json" \
  -d '{
    "status": "won",
    "actualWin": 250.00,
    "commissionPercentage": 2
  }'
```

### 4. Obtener estadísticas
```bash
curl http://localhost:3333/api/bets-db/1/stats
```

### 5. Calcular reporte diario
```bash
curl -X POST http://localhost:3333/api/reports/1/calculate \
  -H "Content-Type: application/json" \
  -d '{"reportDate": "2026-01-21"}'
```

### 6. Ver reporte
```bash
curl http://localhost:3333/api/reports/1/date/2026-01-21
```

---

## ✅ Códigos de Estado HTTP

| Código | Significado |
|--------|------------|
| 200 | OK - Solicitud exitosa |
| 201 | Created - Recurso creado |
| 400 | Bad Request - Error en los datos enviados |
| 404 | Not Found - Recurso no encontrado |
| 409 | Conflict - Duplicado (nombre/email existe) |
| 500 | Server Error - Error interno del servidor |

---

## 🔐 Próximas Fases

- [ ] Autenticación JWT para casas de apuestas
- [ ] Webhook para notificaciones de apuestas
- [ ] Dashboard de análisis en tiempo real
- [ ] Soporte para múltiples divisas y conversión
- [ ] Sistema de límites y alertas

