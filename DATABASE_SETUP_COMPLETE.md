# 🚀 Base de Datos PostgreSQL - Implementación Completada

## ✅ Archivos Creados en el Proyecto

### 1. **DATABASE_SCHEMA.sql** (369 líneas)
Archivo SQL completo con:
- ✅ 7 tablas principales
- ✅ 3 vistas SQL para reportes
- ✅ 1 función almacenada para cálculo de reportes diarios
- ✅ Datos de ejemplo

### 2. **SETUP_DATABASE.md**
Guía paso a paso con:
- ✅ Cómo crear PostgreSQL en Railway
- ✅ 3 opciones para ejecutar el script SQL
- ✅ Verificación de instalación
- ✅ Instrucciones de backup

### 3. **backend/db/dbConfig.js**
Configuración de conexión con:
- ✅ Pool de conexiones automático
- ✅ Manejo de errores
- ✅ Helpers para queries

### 4. **backend/db/models/index.js**
Modelos de datos con:
- ✅ BettingHouse - Casas de apuestas
- ✅ Bet - Gestión de apuestas
- ✅ DailyReport - Reportes diarios
- ✅ Transaction - Historial de transacciones

### 5. **backend/package.json** (actualizado)
Agregados:
- ✅ Driver PostgreSQL: `pg ^8.11.0`
- ✅ Scripts: `db:setup`, `db:migrate`

---

## 📊 Estructura de Base de Datos

### **Tablas (7)**
```
betting_houses              // Casas de apuestas
betting_house_users        // Usuarios únicos por casa
bets                       // Apuestas realizadas
bet_selections            // Selecciones en cada apuesta
daily_reports             // Reportes diarios calculados
account_transactions      // Historial de movimientos
user_activity_log         // Auditoría de acciones
```

### **Vistas (3)**
```
v_betting_summary         // Resumen por casa
v_daily_pnl               // Ganancias/Pérdidas diarias
v_last_7_days_performance // Performance últimos 7 días
```

### **Función Almacenada (1)**
```
calculate_daily_report()   // Calcula reportes automáticamente
```

---

## 🔧 Próximos Pasos para Railway

### 1. Crear PostgreSQL en Railway
```
1. Ve a https://railway.app/dashboard
2. Click en "+ New" → "Database" → "PostgreSQL"
3. Espera a que se cree (2-3 minutos)
4. Copia el DATABASE_URL
```

### 2. Agregar DATABASE_URL al Backend
```
1. Backend service en Railway → Variables
2. Agregar: DATABASE_URL = [valor copiado]
3. Guardar cambios
```

### 3. Ejecutar Migraciones
```
# Opción rápida (recomendada):
railway run psql < DATABASE_SCHEMA.sql

# O en el backend, cuando se inicie:
npm run db:migrate
```

---

## 💻 Uso en el Backend

### Importar modelos
```javascript
import { BettingHouse, Bet, DailyReport, Transaction } from './db/models/index.js';

// Obtener todas las casas
const houses = await BettingHouse.findAll();

// Obtener apuestas de una casa
const bets = await Bet.findAll(bettingHouseId);

// Calcular reporte diario
await DailyReport.calculate(bettingHouseId, '2026-01-21');

// Registrar transacción
await Transaction.create(bettingHouseId, 'bet_placed', -100, 5000, 4900);
```

---

## 🔐 Características de Seguridad

✅ **Integridad referencial**: FK con CASCADE  
✅ **Validaciones**: CHECK constraints  
✅ **Auditoría completa**: user_activity_log  
✅ **Balance tracking**: Transacciones registradas  
✅ **SSL en Railway**: Conexión encriptada  

---

## 📈 Capacidades B2B

✅ **N casas de apuestas** - Multitenancy total  
✅ **1 usuario por casa** - Autenticación única  
✅ **N apuestas por usuario** - Sin límite  
✅ **Reportes diarios automáticos** - Con P&L  
✅ **Comisiones automáticas** - Configurables  
✅ **Balance en tiempo real** - Actualizado  

---

## 📝 Archivos en el Proyecto

```
PARLAY_SITE/
├── DATABASE_SCHEMA.sql          ← Script SQL completo
├── SETUP_DATABASE.md            ← Guía de configuración
└── backend/
    ├── package.json             ← Con pg driver
    ├── db/
    │   ├── dbConfig.js          ← Conexión
    │   ├── models/
    │   │   └── index.js         ← Modelos B2B
    │   └── migrations/
    └── scripts/
        └── migrate.js           ← Script de migración
```

---

## ⚡ Próximo: Endpoints REST

Crearemos:
- POST `/api/betting-houses` - Registrar casa
- POST `/api/bets` - Realizar apuesta
- GET `/api/daily-report` - Reportes diarios
- GET `/api/balance` - Saldo actual

**¿Quieres que implementemos los endpoints ahora?**
