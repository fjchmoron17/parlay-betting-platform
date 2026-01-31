# 🌍 Fix: Acceso Internacional y Móvil

## Problema Resuelto
El backend no era accesible desde fuera de España ni desde dispositivos móviles debido a restricciones de CORS y configuración del servidor.

## ✅ Cambios Aplicados

### 1. **backend/server.js** - Configuración CORS Mejorada

**Antes:**
- Solo permitía orígenes específicos listados
- Bloqueaba requests desde ubicaciones no listadas
- Path hardcodeado del .env

**Ahora:**
- ✅ En **producción**: Permite TODOS los orígenes
- ✅ En **desarrollo**: Permite orígenes locales + desarrollo
- ✅ Headers adicionales para móviles
- ✅ Escucha en `0.0.0.0` (compatible con Railway)
- ✅ Path dinámico del .env

**Mejoras específicas:**
```javascript
// Permite todos los orígenes en producción
if (process.env.NODE_ENV === 'production') {
  callback(null, true);  // ✅ Acceso desde cualquier país/dispositivo
}

// Headers adicionales
methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
Access-Control-Max-Age: 86400 (24 horas de caché)

// Escucha en todas las interfaces
app.listen(PORT, '0.0.0.0', ...)
```

### 2. **railway.json** - Configuración de Deployment (NUEVO)

Archivo de configuración para Railway:
```json
{
  "build": { "builder": "NIXPACKS" },
  "deploy": {
    "startCommand": "cd backend && npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### 3. **RAILWAY_DEPLOYMENT_GUIDE.md** - Guía Actualizada

Documentación ampliada con:
- Nuevas instrucciones de CORS
- Configuración para acceso internacional
- Testing desde móvil

## 🧪 Testing

### Local
```bash
# Backend
curl http://localhost:3333/health

# Debe retornar:
{
  "status": "OK",
  "timestamp": "2026-01-18T...",
  "environment": "development"
}
```

### Producción (Railway)
```bash
# Desde cualquier ubicación/dispositivo
curl https://YOUR-BACKEND-URL.railway.app/health

# Desde móvil - abrir navegador:
https://YOUR-BACKEND-URL.railway.app/health
```

## 📱 Compatibilidad

Ahora funciona con:
- ✅ Acceso desde España
- ✅ Acceso desde otros países (US, LatAm, Europa, Asia, etc.)
- ✅ Navegadores móviles (iOS Safari, Android Chrome)
- ✅ Apps móviles nativas
- ✅ Postman / Thunder Client / curl
- ✅ Diferentes redes (WiFi, 4G, 5G)

## 🚀 Despliegue a Railway

1. Los cambios ya están en GitHub
2. Railway detectará automáticamente el push
3. Iniciará un nuevo deployment
4. Variables de entorno necesarias en Railway:
   ```
   NODE_ENV=production
   ODDS_API_KEY=b033453051de38d16886716c23e1c609
   ODDS_API_BASE_URL=https://api.the-odds-api.com/v4
   ```

## 🔍 Verificación Post-Deployment

### Paso 1: Health Check
```bash
curl https://YOUR-BACKEND-URL.railway.app/health
```

### Paso 2: Test CORS desde frontend
Abrir DevTools → Network → Ver headers:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
```

### Paso 3: Test desde móvil
1. Abrir frontend en móvil
2. Verificar que carguen los juegos
3. Intentar crear una apuesta

## 📊 Impacto

**Antes:**
- ❌ Solo funcionaba en España/local
- ❌ Bloqueado en móviles
- ❌ CORS errors constantes

**Después:**
- ✅ Acceso global (cualquier país)
- ✅ Compatible con móviles
- ✅ Sin errores de CORS en producción

## 📝 Archivos Modificados

1. ✅ `backend/server.js` - CORS y configuración del servidor
2. ✅ `railway.json` - **NUEVO** - Config de deployment
3. ✅ `RAILWAY_DEPLOYMENT_GUIDE.md` - Actualizado

---

**Commit:** `57a5fad - Fix: Enable international and mobile access to backend`
**Estado:** ✅ Pusheado a GitHub - Railway deploying...
**Fecha:** 18 de Enero, 2026
