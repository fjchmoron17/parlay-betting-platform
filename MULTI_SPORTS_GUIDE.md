# 🎮 Frontend Multi-Liga y Multi-Deportes - Guía de Implementación

## ✅ Cambios Completados en el Backend

### 1. **Nuevos Endpoints Disponibles**

#### `GET /api/games/sports` 
Obtiene lista de **74 deportes disponibles** en The Odds API
```json
{
  "success": true,
  "data": [
    { "key": "americanfootball_nfl", "group": "American Football", "title": "NFL", "active": true },
    { "key": "basketball_nba", "group": "Basketball", "title": "NBA", "active": true },
    { "key": "soccer_epl", "group": "Soccer", "title": "English Premier League", "active": true }
    // ... 71 más
  ],
  "total": 74
}
```

#### `GET /api/games?market=h2h&region=us`
Obtiene juegos con filtros
- **market**: `h2h` (Head to Head), `spreads`, `totals`
- **region**: `us`, `uk`, `eu`, `au`

#### Ejemplo con Soccer (incluye opción de empate):
```json
{
  "id": "...",
  "league": "SOCCER",
  "home_team": "Manchester United",
  "away_team": "Liverpool",
  "odds_home": 2.10,
  "odds_away": 1.75,
  "odds_draw": 3.50,  // ← Nueva opción para Soccer
  "status": "upcoming",
  "market": "h2h"
}
```

### 2. **Tipos de Apuestas Disponibles**

| Tipo | Descripción | Deportes |
|------|-------------|----------|
| **h2h** | Head to Head (Ganador) | Todos |
| **spreads** | Margen de puntos | NBA, NFL, MLB |
| **totals** | Over/Under | Todos |

### 3. **Deportes Soportados**

**Americanos:**
- NFL (American Football)
- NBA (Basketball)
- MLB (Baseball)
- NHL (Ice Hockey)

**Soccer:**
- English Premier League (EPL)
- La Liga (España)
- Bundesliga (Alemania)
- Serie A (Italia)
- Ligue 1 (Francia)
- Championship (Inglaterra)
- Primeira Liga (Portugal)

**Otros:**
- ATP/WTA (Tennis)
- Cricket (Test, ODI)
- Rugby Union
- Golf (PGA)

## 📱 Implementación Frontend Recomendada

### 1. **Componente de Selector de Ligas**
```jsx
<FilterPanel>
  <SportSelector onChange={(sport) => setSelectedSport(sport)} />
  <MarketSelector onChange={(market) => setSelectedMarket(market)} />
  <RegionSelector onChange={(region) => setSelectedRegion(region)} />
</FilterPanel>
```

### 2. **Componente de Juegos**
- Mostrar `odds_draw` como tercera opción cuando existe
- Colorear tarjetas por deporte
- Filtrar por mercado

### 3. **Tipos de Opciones de Apuesta**
```javascript
// Para Soccer (con empate)
const soccerOptions = [
  { name: game.home_team, odds: game.odds_home, type: 'home' },
  { name: 'Empate', odds: game.odds_draw, type: 'draw' },
  { name: game.away_team, odds: game.odds_away, type: 'away' }
];

// Para Otros (solo ganador)
const otherOptions = [
  { name: game.home_team, odds: game.odds_home, type: 'home' },
  { name: game.away_team, odds: game.odds_away, type: 'away' }
];
```

## 🔄 Flujo de Datos

```
Frontend UI
    ↓
[Selector: Deporte, Mercado, Región]
    ↓
gamesAPI.getAll(league, market, region)
    ↓
Backend: /api/games?market=h2h&region=us&league=SOCCER
    ↓
The Odds API (74 deportes)
    ↓
Respuesta con juegos + odds_draw para Soccer
    ↓
Renderizar GameCard con opciones dinámicas
```

## 🎯 Endpoints del Frontend

### En Home.jsx implementar:

```javascript
const [selectedSport, setSelectedSport] = useState(null);
const [selectedMarket, setSelectedMarket] = useState('h2h');
const [selectedRegion, setSelectedRegion] = useState('us');
const [sports, setSports] = useState([]);

// Cargar deportes disponibles
useEffect(() => {
  sportsAPI.getAll().then(res => setSports(res.data));
}, []);

// Cargar juegos con filtros
useEffect(() => {
  gamesAPI.getAll(selectedSport, selectedMarket, selectedRegion)
    .then(res => setGames(res.data));
}, [selectedSport, selectedMarket, selectedRegion]);
```

## 📊 Datos en Vivo Actualmente

✅ **44 juegos disponibles:**
- 2 NFL
- 6 NBA
- 13 NHL
- 23 Soccer (Premier League)

## 🚀 Próximos Pasos

1. Crear componente `SportFilters.jsx` con selectores
2. Actualizar `GameCard.jsx` para mostrar `odds_draw`
3. Implementar tabs por deporte
4. Agregar historial de cambios de odds

---

**Estado**: ✅ Backend completamente funcional
**Juegos**: 74 deportes disponibles
**Última actualización**: 2026-01-18
