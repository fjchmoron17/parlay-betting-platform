# Railway Backend Deployment Instructions

## 🚀 Paso 1: Crear Nuevo Proyecto en Railway

1. Ve a https://railway.app/dashboard
2. Click en **"New Project"**
3. Selecciona **"Deploy from GitHub repo"**
4. Busca tu repo: `fjchmoron17/parlay-betting-platform`
5. Click en el repositorio

## 📂 Paso 2: Configurar el Backend

1. Una vez creado el proyecto, Railway detectará automáticamente el código
2. En **Settings** → **Root Directory**, configura:
   ```
   backend
   ```
   Esto le dice a Railway que el código del backend está en la carpeta `backend/`

## 🔧 Paso 3: Variables de Entorno

En el proyecto de Railway → **Variables**, agrega:

```env
NODE_ENV=production
ODDS_API_KEY=e9b92b60bc4085d52d1d5f8c5b33bd4c
ODDS_API_BASE_URL=https://api.the-odds-api.com/v4
```

⚠️ **NO agregues PORT** - Railway lo asigna automáticamente

## 🌐 Paso 4: Obtener la URL del Backend

1. Espera a que termine el deployment (2-5 minutos)
2. Railway te asignará una URL automáticamente
3. Ve a **Settings** → **Networking** → **Public Networking**
4. Click en **Generate Domain**
5. Copia la URL (ejemplo: `https://web-production-xxxx.up.railway.app`)

## ✅ Paso 5: Verificar que Funciona

```bash
curl https://TU-URL-BACKEND.railway.app/health
```

Deberías ver:
```json
{
  "status": "OK",
  "timestamp": "2026-01-18T...",
  "environment": "production"
}
```

## 🔄 Paso 6: Actualizar el Frontend

Una vez que tengas la URL del backend:

1. Actualiza `.env.production`:
   ```env
   VITE_API_URL=https://TU-URL-BACKEND.railway.app/api
   ```

2. En Railway → Proyecto Frontend → Variables:
   ```env
   VITE_API_URL=https://TU-URL-BACKEND.railway.app/api
   ```

3. Commit y push:
   ```bash
   git add .env.production
   git commit -m "Connect frontend to Railway backend"
   git push origin main
   ```

## 📊 Resultado Final

Tendrás DOS proyectos en Railway:

1. **parlay-betting-platform** (Frontend)
   - URL: https://parlay-betting-platform-production.up.railway.app
   - Variables: `VITE_API_URL`

2. **parlay-betting-platform-backend** (Backend)  
   - URL: https://web-production-xxxx.up.railway.app
   - Variables: `NODE_ENV`, `ODDS_API_KEY`, `ODDS_API_BASE_URL`

---

## 🆘 Alternativa Rápida: Usar el Backend Local

Si prefieres NO desplegar el backend por ahora, puedes:

1. Exponer tu backend local a internet con **ngrok**:
   ```bash
   # Instalar ngrok
   brew install ngrok
   
   # Exponer el puerto 3333
   ngrok http 3333
   ```

2. ngrok te dará una URL pública (ej: `https://abcd-1234.ngrok.io`)

3. Usar esa URL en `.env.production`:
   ```env
   VITE_API_URL=https://abcd-1234.ngrok.io/api
   ```

⚠️ **Nota:** Esta es una solución temporal. La URL de ngrok cambia cada vez que lo reinicias.

---

## ✅ Checklist

- [ ] Crear proyecto backend en Railway
- [ ] Configurar Root Directory: `backend`
- [ ] Agregar variables de entorno
- [ ] Esperar deployment
- [ ] Generar dominio público
- [ ] Verificar `/health` endpoint
- [ ] Actualizar `.env.production` del frontend
- [ ] Deploy frontend
- [ ] Probar desde móvil

¿Quieres que te ayude paso a paso a crear el proyecto backend en Railway?
