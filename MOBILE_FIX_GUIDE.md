# 🚨 SOLUCIÓN: No funciona en móviles/fuera de España

## 🔍 Diagnóstico Realizado
- ✅ Backend local funciona correctamente
- ✅ CORS configurado para permitir todos los orígenes en producción
- ❓ **PROBLEMA:** Frontend en producción probablemente usa URL incorrecta del backend

## 🎯 Solución Paso a Paso

### PASO 1: Encontrar la URL Real del Backend en Railway

1. Ve a: https://railway.app/dashboard
2. Busca tu proyecto **backend** (no el frontend)
3. Click en el proyecto
4. Ve a **Settings** → **Domains** o **Networking**
5. Deberías ver una URL como:
   - `https://parlay-betting-backend-production.up.railway.app`
   - `https://web-production-xxxx.up.railway.app`
   - O cualquier otra URL que Railway te haya asignado

6. **COPIA ESA URL COMPLETA**

### PASO 2: Actualizar .env.production

Una vez que tengas la URL real, actualiza el archivo:

**Archivo:** `.env.production`

```env
# Reemplaza con TU URL real de Railway
VITE_API_URL=https://TU-URL-REAL-DE-RAILWAY.up.railway.app/api
```

**⚠️ IMPORTANTE:** 
- NO olvides agregar `/api` al final
- Usa `https://` (NO http)
- Asegúrate que sea la URL del BACKEND, no del frontend

### PASO 3: Verificar Variables en Railway (Backend)

En Railway Dashboard → Tu proyecto Backend → Variables:

```env
NODE_ENV=production
ODDS_API_KEY=b033453051de38d16886716c23e1c609
ODDS_API_BASE_URL=https://api.the-odds-api.com/v4
PORT=(Railway lo asigna automáticamente)
```

### PASO 4: Verificar Variables en Railway (Frontend)

En Railway Dashboard → Tu proyecto Frontend → Variables:

```env
VITE_API_URL=https://TU-URL-BACKEND.up.railway.app/api
```

**⚠️ Debe ser la misma URL que pusiste en .env.production**

### PASO 5: Desplegar Cambios

```bash
# 1. Actualizar .env.production con la URL correcta
# 2. Commit y push
git add .env.production
git commit -m "Fix: Update production backend URL"
git push origin main
```

### PASO 6: Verificar el Deployment

1. Espera que Railway termine de desplegar (2-5 minutos)
2. Abre tu frontend de producción
3. Abre DevTools (F12) → Console
4. Busca errores relacionados con fetch/CORS
5. Deberías ver requests a tu backend URL de Railway

### PASO 7: Test desde Móvil

1. Abre el frontend en el móvil
2. Verifica que carguen los juegos
3. Si ves errores, verifica en DevTools del móvil (Safari/Chrome mobile)

## 🧪 Verificación Rápida

### Test 1: Backend en producción
```bash
curl https://TU-URL-BACKEND.railway.app/health
```

**Respuesta esperada:**
```json
{
  "status": "OK",
  "timestamp": "2026-01-18T...",
  "environment": "production"
}
```

### Test 2: Desde móvil
Abre en el navegador móvil:
```
https://TU-URL-BACKEND.railway.app/health
```

Deberías ver el JSON con "status": "OK"

## ❓ Preguntas Frecuentes

### P: ¿Cómo sé si Railway está usando la URL correcta?

R: En Railway Dashboard:
1. Click en tu proyecto backend
2. Mira arriba a la derecha, debería aparecer la URL
3. También puedes hacer click en el botón de "Deployment" y ver los logs

### P: ¿Cómo verifico qué URL está usando mi frontend?

R: Abre el frontend en producción y en DevTools → Console ejecuta:
```javascript
console.log(import.meta.env.VITE_API_URL)
```

### P: ¿Y si tengo 2 proyectos en Railway?

R: Necesitas:
- **Proyecto 1 (Backend):** El que tiene el código de `backend/`
- **Proyecto 2 (Frontend):** El que tiene el código de `src/`

Cada uno debe tener su propia URL. El frontend debe apuntar a la URL del backend.

## 🆘 Si Sigue Sin Funcionar

1. Comparte:
   - URL del frontend en Railway
   - URL del backend en Railway
   - Screenshot de las variables de entorno en Railway
   - Screenshot de los errores en DevTools Console

2. Verifica:
   - ¿El backend responde al hacer curl?
   - ¿Hay errores en los logs de Railway?
   - ¿La URL del .env.production es correcta?

## 📊 Arquitectura Correcta

```
Usuario Móvil/Internacional
         ↓
    [Internet]
         ↓
Frontend Railway → https://parlay-betting-platform-production.up.railway.app
         ↓ (hace fetch a)
Backend Railway  → https://TU-BACKEND-URL.up.railway.app/api
         ↓
The Odds API
```

## ✅ Checklist Final

- [ ] Encontré la URL real del backend en Railway
- [ ] Actualicé `.env.production` con esa URL + `/api`
- [ ] Hice commit y push
- [ ] Railway terminó el deployment (verde)
- [ ] `curl` al backend funciona
- [ ] Frontend en producción carga los juegos
- [ ] Funciona desde móvil

---

**NOTA:** El problema NO es el código del backend (ya está arreglado). El problema es que el frontend debe saber la URL correcta del backend en producción.
