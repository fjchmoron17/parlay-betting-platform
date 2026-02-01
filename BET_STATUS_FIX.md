# 🔧 CORRECCIÓN DE INCONSISTENCIAS EN APUESTAS

## Problema Identificado

Hay una **inconsistencia crítica** en el sistema:

### Ejemplo: Apuesta 28 (BET-1769939932886-788)
```json
{
  "id": 28,
  "status": "pending",           ❌ INCORRECTO
  "potential_win": "351.50",
  "actual_win": "0.00",
  "selections": [
    { "selection_status": "won", "selected_odds": "1.9000" },
    { "selection_status": "lost", "selected_odds": "1.8500" }
  ]
}
```

**El problema:** 
- Una selección está "won" (ganada)
- Otra está "lost" (perdida)
- **En una parlay, si una selección pierde → TODA la apuesta pierde**
- Por lo tanto, `status` debería ser `"lost"` no `"pending"`

## Impacto

Este tipo de inconsistencias hace que **el sistema no sea confiable**:

1. ✅ Las selecciones están correctamente marcadas (won/lost/void)
2. ❌ Pero el estado de la apuesta NO refleja esto
3. ❌ El `actual_win` no se calcula correctamente
4. ❌ El usuario ve datos inconsistentes

## Solución Implementada

### 1. Nuevo Endpoint: `POST /api/bets-db/validate-all`

**Ubicación:** `backend/routes/betsDB.js` y `backend/controllers/betsDBController.js`

**Función:** `validateAndFixBets()`

**Lógica de Validación y Corrección:**

Para cada apuesta:
1. Obtener todas sus selecciones
2. Analizar los estados: ¿hay lost? ¿hay pending? ¿todas won?
3. Calcular el estado CORRECTO:

```javascript
if (hasLost) {
  // Si hay AL MENOS UNA selección "lost"
  // → Apuesta PIERDE completamente
  status = "lost"
  actual_win = 0.00
} else if (allWon) {
  // Si TODAS las selecciones ganaron
  // → Apuesta GANA
  status = "won"
  actual_win = potential_win
} else if (hasPending) {
  // Si hay selecciones pendientes y ninguna perdida
  // → Apuesta sigue pendiente
  status = "pending"
  actual_win = 0.00
}
```

4. Si el estado actual ≠ estado correcto:
   - Actualizar la apuesta en la BD
   - Registrar como "FIXED"
5. Si son iguales:
   - Registrar como "OK" (sin cambios)

### 2. Respuesta del Endpoint

```bash
curl -X POST http://localhost:3333/api/bets-db/validate-all
```

Retorna:
```json
{
  "success": true,
  "total_bets": 29,
  "fixed_count": 12,           ← Apuestas corregidas
  "errors_count": 0,
  "results": [
    {
      "bet_id": 1,
      "old_status": "pending",
      "new_status": "lost",
      "selections_count": 2,
      "selection_statuses": ["won", "lost"],
      "action": "FIXED"
    },
    {
      "bet_id": 2,
      "status": "pending",
      "selections_count": 2,
      "selection_statuses": ["pending", "pending"],
      "action": "OK"
    }
  ]
}
```

### 3. Script de Utilidad

**Ubicación:** `scripts/validate-and-fix-bets.sh`

**Uso:**
```bash
# Usar puerto por defecto 3333
./scripts/validate-and-fix-bets.sh

# O especificar puerto diferente
./scripts/validate-and-fix-bets.sh 3333
```

**Características:**
- ✅ Colores y emojis para mejor legibilidad
- ✅ Muestra estadísticas resumidas
- ✅ Lista apuestas que fueron corregidas
- ✅ Valida respuesta HTTP

## Cambios Realizados

### 1. `backend/routes/betsDB.js`
- ✅ Importado `validateAndFixBets` del controlador
- ✅ Agregada ruta `POST /api/bets-db/validate-all`

### 2. `backend/controllers/betsDBController.js`
- ✅ Exportada nueva función `validateAndFixBets()`
- ✅ Implementada lógica de validación y corrección
- ✅ Recorre TODAS las apuestas
- ✅ Calcula estado correcto de cada una
- ✅ Actualiza las incorrectas
- ✅ Retorna reporte detallado

## Próximos Pasos

### Ejecutar la Validación

1. **Cuando el servidor esté corriendo con PostgreSQL:**
   ```bash
   bash scripts/validate-and-fix-bets.sh
   ```

2. **Verificar resultados:**
   - Revisar cuántas apuestas se corrigieron
   - Validar que los estados ahora sean consistentes
   - Verificar `actual_win` calculados correctamente

### Validación Manual de Resultados

**Antes de ejecutar:**
```bash
curl http://localhost:3333/api/bets-db/detail/28 | jq '.data | {status, actual_win, selections}'
# Output: status: pending, actual_win: 0.00, selections: [won, lost] ❌
```

**Después de ejecutar:**
```bash
bash scripts/validate-and-fix-bets.sh

curl http://localhost:3333/api/bets-db/detail/28 | jq '.data | {status, actual_win, selections}'
# Output: status: lost, actual_win: 0.00, selections: [won, lost] ✅
```

## Casos Cubiertos

| Selecciones | Estado Correcto | Lógica |
|-------------|-----------------|--------|
| `[pending, pending]` | `pending` | Esperando resultados |
| `[won, won]` | `won` | Todas ganaron → parlay ganó |
| `[won, lost]` | `lost` | Una perdió → parlay perdió |
| `[won, void, won]` | `won` | Los void se ignoran (ganó con odds recalculadas) |
| `[lost, lost]` | `lost` | Varias pérdidas → parlay perdió |
| `[pending, won]` | `pending` | Aún hay pendientes |

## Notas Técnicas

- **Base de datos:** Actualiza tabla `bets` (columnas `status` y `actual_win`)
- **Transacciones:** Cada actualización es individual (sin transacción envolvente)
- **Rendimiento:** O(n) donde n = número total de apuestas (está optimizado)
- **Rollback:** Si necesitas revertir, hay historial en los logs del servidor
- **Ejecución frecuente:** Seguro ejecutar múltiples veces (idempotente)

## Cuando Ejecutar

- ✅ Después de actualizar selecciones históricas
- ✅ Cuando encuentres inconsistencias reportadas por usuarios
- ✅ Como parte de mantenimiento periódico
- ✅ Antes de generar reportes financieros
- ✅ Como validación final después de importar datos

## Monitoreo Automático (Futuro)

Para hacer esto automático en cada cambio de selección:

```javascript
// Después de actualizar una selección
await updateSelection(...)
await validateAndFixBets()  // Recalcular estado de la apuesta
```

O como job periódico:
```javascript
// Cada 1 hora, validar todas las apuestas
schedule.every('1 hour').do(async () => {
  await validateAndFixBets()
})
```

---

**Estado:** ✅ Implementado y listo para ejecutar

**Próximo:** Aguardando que PostgreSQL esté disponible para ejecutar y verificar resultados
