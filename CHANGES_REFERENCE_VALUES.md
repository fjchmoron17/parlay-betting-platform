# 📊 Actualización: Valores de Referencia en Spreads y Totales

## Resumen
Se agregaron los **valores de referencia** (puntos spread, over/under) en las tarjetas de cada tipo de apuesta, mostrándolos visualmente como badges pequeños al lado de los nombres.

## ✨ Cambios Realizados

### Backend - sportsApiService.js

#### 1. **Función getOdds Mejorada**
```javascript
// ANTES:
const getOdds = (game, team, market = 'h2h') => {
  // Retornaba solo el precio
  return outcome ? outcome.price : defaultPrice;
}

// AHORA:
const getOdds = (game, team, market = 'h2h') => {
  // Retorna objeto con precio y punto
  return {
    price: outcome ? outcome.price : defaultPrice,
    point: outcome?.point || null
  };
}
```

#### 2. **Manejo especial para Totals**
```javascript
// Para mercados de totals, buscar por "Over" o "Under"
if (market === 'totals') {
  teamName = team === 'home' ? 'Over' : (team === 'away' ? 'Under' : 'Draw');
} else {
  teamName = team === 'draw' ? 'Draw' : (team === 'home' ? game.home_team : game.away_team);
}
```

#### 3. **Extracción de Puntos en Mapeo**
```javascript
const homeOdds = getOdds(game, 'home', currentMarket);
const awayOdds = getOdds(game, 'away', currentMarket);
const drawOdds = getOdds(game, 'draw', currentMarket);

return {
  id: game.id,
  // ... otros campos ...
  odds_home: homeOdds.price,
  odds_away: awayOdds.price,
  odds_draw: drawOdds.price,
  point_home: homeOdds.point,      // ← NUEVO
  point_away: awayOdds.point,      // ← NUEVO
  point_draw: drawOdds.point       // ← NUEVO
};
```

### Frontend - GroupedGameCard.jsx

#### 1. **Spreads con Valores**
```jsx
<span className="team-name">
  {marketGroups.spreads.home_team}
  {marketGroups.spreads.point_home && (
    <span className="reference-value">
      {marketGroups.spreads.point_home > 0 ? '+' : ''}{marketGroups.spreads.point_home}
    </span>
  )}
</span>
```

**Ejemplo visual:**
```
Yankees +2.5 @ 1.95
Red Sox -2.5 @ 1.85
```

#### 2. **Totales con Over/Under**
```jsx
<span className="team-name">
  Over
  {marketGroups.totals.point_home && (
    <span className="reference-value">{marketGroups.totals.point_home}</span>
  )}
</span>
```

**Ejemplo visual:**
```
Over 9.5 @ 1.85
Under 9.5 @ 2.10
```

### Frontend - index.css

#### Nuevo Estilo `.reference-value`
```css
.reference-value {
  display: block;
  font-size: 9px;
  font-weight: 700;
  color: #0f766e;
  background-color: #d1fae5;
  padding: 2px 4px;
  border-radius: 3px;
  margin-top: 2px;
}
```

**Características:**
- Fondo verde claro (#d1fae5)
- Texto verde oscuro (#0f766e)
- Pequeño y compacto
- Se muestra como badge debajo del nombre

## 📊 Ejemplos de Datos

### Antes
```
🏆 Head to Head:
Yankees @ 2.10
Red Sox @ 1.75

📊 Spreads:
Yankees @ 1.95
Red Sox @ 1.85

➕ Totales:
Over @ 1.85
Under @ 2.10
```

### Después
```
🏆 Head to Head:
Yankees @ 2.10
Red Sox @ 1.75

📊 Spreads:
Yankees        ← Verde claro
+2.5           ← Badge con punto spread
@ 1.95
Red Sox        ← Verde claro
-2.5           ← Badge con punto spread
@ 1.85

➕ Totales:
Over           ← Verde claro
9.5            ← Badge con total
@ 1.85
Under          ← Verde claro
9.5            ← Badge con total
@ 2.10
```

## 🔄 Flujo de Datos

```
The Odds API
  ├─ h2h market: { name: "Yankees", price: 2.10, point: null }
  ├─ spreads: { name: "Yankees", price: 1.95, point: 2.5 }
  └─ totals: { name: "Over", price: 1.85, point: 9.5 }
       ↓
Backend (getOdds)
  └─ Extrae: { price: 1.95, point: 2.5 }
       ↓
Backend Response
  └─ odds_home: 1.95, point_home: 2.5
       ↓
Frontend (GroupedGameCard)
  └─ Renderiza badge: "+2.5"
```

## 🎯 Diferencias Clave

### Spreads
- **Positivo (+)**: Underdog debe ganar por ese margen
- **Negativo (-)**: Favorito debe ganar por al menos ese margen
- **Ejemplo**: Yankees -2.5 significa deben ganar por 3+ puntos

### Totales (Over/Under)
- **Mismo valor** para Over y Under
- **Over**: Total de puntos/goles ARRIBA del valor
- **Under**: Total de puntos/goles ABAJO del valor
- **Ejemplo**: Over 9.5 / Under 9.5 significa si hay 10+ goles es Over

## 📱 Responsive

Los badges se adaptan a todas las pantallas:
- Desktop: Completo visible
- Tablet: Ajustado pero visible
- Mobile: Se apila debajo del nombre del equipo

## ✅ Validación

**Spread - EPL**
```bash
curl -s 'http://localhost:3333/api/games?league=soccer_epl' | \
  jq '.data[] | select(.market == "spreads") | {team: .home_team, odds: .odds_home, point: .point_home}' | head -20
```

**Totales - EPL**
```bash
curl -s 'http://localhost:3333/api/games?league=soccer_epl' | \
  jq '.data[] | select(.market == "totals") | {type: "Over", odds: .odds_home, point: .point_home}' | head -10
```

## 📝 Archivos Modificados

1. `backend/services/sportsApiService.js`
   - Función `getOdds()` ahora retorna objeto con price y point
   - Manejo especial para mercado "totals" (busca "Over"/"Under")
   - Mapeo incluye campos `point_home`, `point_away`, `point_draw`

2. `src/components/GroupedGameCard.jsx`
   - Spreads: Muestra punto con formato (+/-) al lado del equipo
   - Totales: Muestra Over/Under con punto
   - Integración de `.reference-value` badge

3. `src/index.css`
   - Nuevo estilo `.reference-value` con fondo verde y badge style

## 🚀 Resultado Final

Ahora cada card muestra:
- ✅ Tipo de apuesta (🏆 H2H, 📊 Spreads, ➕ Totales)
- ✅ Valores de referencia (spreads +/-X, totales Over/Under X.X)
- ✅ Odds (probabilidades)
- ✅ Selección interactiva con feedback visual

---

**Versión:** 2.2.0 - Reference Values Edition  
**Fecha:** 18 de Enero, 2026  
**Estado:** ✅ Completo y Funcional
