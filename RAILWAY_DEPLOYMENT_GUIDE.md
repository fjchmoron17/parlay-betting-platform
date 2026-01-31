# 🚀 Railway Deployment Guide - CORS Fix

## ✅ Changes Applied

### 1. Backend CORS Configuration
**File:** [backend/server.js](backend/server.js)

Updated CORS to allow multiple origins:
- `http://localhost:3000` - Local development
- `http://localhost:3001` - Alternative local port  
- `https://parlay-betting-platform-production.up.railway.app` - Production frontend

### 2. Environment Files Created/Updated

**[.env](..env)** (Local Development - Frontend)
```env
VITE_API_URL=http://localhost:3333/api
```

**[.env.production](.env.production)** (Production - Frontend)
```env
VITE_API_URL=https://parlay-api-prod.up.railway.app/api
```

**[backend/.env](backend/.env)** (Backend)
```env
PORT=3333
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
PRODUCTION_URL=https://parlay-betting-platform-production.up.railway.app
```

## 📋 Railway Deployment Checklist

### Backend Deployment (Railway)

1. **Environment Variables in Railway Dashboard:**
   - `NODE_ENV=production`
   - `PORT` (Railway asigna automáticamente)
   - `ODDS_API_KEY=b033453051de38d16886716c23e1c609`
   - `ODDS_API_BASE_URL=https://api.the-odds-api.com/v4`

2. **Important CORS Updates:**
   - ✅ Backend ahora permite TODOS los orígenes en producción
   - ✅ Compatible con acceso internacional y desde móviles
   - ✅ Headers optimizados para cross-origin requests
   - ✅ Escucha en `0.0.0.0` para Railway compatibility

3. **Deploy Backend:**
   ```bash
   # Push changes to Railway
   git add .
   git commit -m "Fix CORS for international and mobile access"
   git push origin main
   ```

4. **Verify Backend URL:**
   - Check Railway dashboard for your backend URL
   - Should be something like: `https://parlay-api-prod.up.railway.app`
   - Test from mobile: `curl https://YOUR-BACKEND-URL.railway.app/health`

### Frontend Deployment (Railway)

1. **Update `.env.production` if backend URL changed:**
   ```env
   VITE_API_URL=https://YOUR-BACKEND-URL.railway.app/api
   ```

2. **Environment Variables in Railway Dashboard:**
   - `VITE_API_URL=https://YOUR-BACKEND-URL.railway.app/api`

3. **Deploy Frontend:**
   ```bash
   git add .
   git commit -m "Update frontend with CORS fix"
   git push railway main
   ```

## 🧪 Testing

### Local Testing
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend  
npm run dev
```

### Production Testing
1. Open: `https://parlay-betting-platform-production.up.railway.app`
2. Open DevTools Console (F12)
3. Check for CORS errors (should be gone ✅)
4. Test creating a bet

## 🔍 Troubleshooting

### If CORS errors persist:

1. **Check backend logs in Railway:**
   - Look for startup messages
   - Verify CORS middleware is loaded

2. **Verify environment variables:**
   - Backend: Check Railway dashboard settings
   - Frontend: Ensure `VITE_API_URL` is correct

3. **Clear browser cache:**
   ```bash
   # Hard refresh
   Ctrl+Shift+R (Windows/Linux)
   Cmd+Shift+R (Mac)
   ```

4. **Check Network tab:**
   - Preflight OPTIONS request should return 200
   - Response headers should include:
     - `Access-Control-Allow-Origin: https://parlay-betting-platform-production.up.railway.app`
     - `Access-Control-Allow-Methods: GET,HEAD,PUT,PATCH,POST,DELETE`

## 📝 Files Modified

1. [backend/server.js](backend/server.js#L16-L28) - CORS configuration
2. [backend/.env](backend/.env) - Environment variables
3. [.env](.env) - **NEW** - Local development config
4. [.env.production](.env.production) - Production config

## 🎯 Next Steps

1. ✅ Backend server is running locally on port 3333
2. 🔄 Deploy changes to Railway (both backend and frontend)
3. 🧪 Test production deployment
4. 📊 Monitor Railway logs for any issues

## 🆘 Quick Commands

```bash
# Restart backend locally
cd backend && npm start

# Check backend health
curl http://localhost:3333/health

# Check production backend
curl https://YOUR-BACKEND-URL.railway.app/health

# View Railway logs
railway logs

# Check what's running on port 3333
lsof -i :3333
```

---

**Status:** ✅ Backend running locally  
**Next:** Deploy to Railway for production fix
