# 📋 RESUMEN DE CORRECIÓN DE INCONSISTENCIAS EN APUESTAS

## 🎯 Problema Descubierto

**Inconsistencia Crítica:** Las apuestas tienen selecciones resueltas (won/lost) pero el estado de la apuesta sigue siendo "pending"

### Ejemplo
- **Apuesta 28 (BET-1769939932886-788):**
  - status: `pending` ❌ (incorrecto)
  - selections: `[won, lost]` ✅ (correcto)
  - **Debería ser:** status: `lost` (porque una selección perdió)

**Impacto:** El sistema **no es confiable** porque los datos mostrados al usuario no coinciden con lo que la BD realmente tiene

---

## ✅ Solución Implementada

### 1️⃣ Nuevo Endpoint
- **Ruta:** `POST /api/bets-db/validate-all`
- **Función:** Recalcula el estado de TODAS las apuestas basándose en sus selecciones
- **Ubicación:**
  - Ruta: `backend/routes/betsDB.js` (línea agregada)
  - Controlador: `backend/controllers/betsDBController.js` (nueva función `validateAndFixBets()`)

### 2️⃣ Lógica de Corrección
Para cada apuesta:
```
if cualquier_selección = "lost" → status = "lost", actual_win = 0
else if todas_selecciones = "won" → status = "won", actual_win = potential_win
else if hay_pending → status = "pending", actual_win = 0
```

### 3️⃣ Script Ejecutable
- **Ubicación:** `scripts/validate-and-fix-bets.sh`
- **Uso:** `bash scripts/validate-and-fix-bets.sh`
- **Características:**
  - Ejecuta validación
  - Muestra estadísticas
  - Reporta qué se corrigió

---

## 📊 Respuesta Esperada

Cuando se ejecute:

```json
{
  "total_bets": 29,
  "fixed_count": X,           ← Cuántas se corrigieron
  "errors_count": 0,
  "results": [
    { "bet_id": 28, "old_status": "pending", "new_status": "lost", "action": "FIXED" },
    { "bet_id": 1, "status": "pending", "selection_statuses": ["pending", "pending"], "action": "OK" }
  ]
}
```

---

## 🚀 Próximo Paso

Cuando PostgreSQL esté disponible y el servidor corriendo:

```bash
# Ejecutar validación y corrección
bash /Users/fjchmoron/Documents/PARLAY_SITE/scripts/validate-and-fix-bets.sh

# O con curl directo
curl -X POST http://localhost:3333/api/bets-db/validate-all
```

---

## 📁 Archivos Modificados/Creados

1. ✅ `backend/routes/betsDB.js` - Agregada ruta POST /validate-all
2. ✅ `backend/controllers/betsDBController.js` - Agregada función validateAndFixBets()
3. ✅ `scripts/validate-and-fix-bets.sh` - Script de ejecución
4. ✅ `BET_STATUS_FIX.md` - Documentación detallada

---

## 🎓 Contexto

- **Root Cause:** Después de actualizar selecciones con game_commence_time y selection_status, el estado de las apuestas NO se recalculó
- **Estado Actual:** Sistema con inconsistencias (selecciones ok, apuestas mal)
- **Solución:** Endpoint que recalcula automáticamente el estado de cada apuesta
- **Confiabilidad:** Tras ejecutar esto, los datos serán consistentes y confiables

---

**Estado:** ✅ LISTO PARA EJECUTAR
**Dependencia:** PostgreSQL disponible y servidor corriendo
**Seguridad:** Idempotente (seguro ejecutar múltiples veces)
