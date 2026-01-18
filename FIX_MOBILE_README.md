# 🚨 PROBLEMA: No funciona en móviles ni fuera de España

## ⚡ SOLUCIÓN RÁPIDA

El backend ya está configurado correctamente. **El problema es que el frontend no sabe dónde está el backend en producción.**

### 🎯 Usa el script automático:

```bash
./setup-backend-url.sh
```

El script te pedirá la URL de tu backend en Railway y configurará todo automáticamente.

---

## 📖 O sigue estos pasos manualmente:

### 1️⃣ Encuentra tu URL de Railway Backend

1. Ve a https://railway.app/dashboard
2. Click en tu **proyecto backend**
3. Ve a **Settings** → **Domains**
4. Copia la URL (ejemplo: `https://web-production-abcd.up.railway.app`)

### 2️⃣ Actualiza .env.production

Edita el archivo `.env.production`:

```env
VITE_API_URL=https://TU-URL-DE-RAILWAY.up.railway.app/api
```

**⚠️ NO olvides agregar `/api` al final**

### 3️⃣ Deploy

```bash
git add .env.production
git commit -m "Fix: Update production backend URL"
git push origin main
```

### 4️⃣ Configura Railway Frontend

1. Ve a Railway → Tu proyecto **frontend**
2. Ve a **Variables**
3. Agrega:
   ```
   VITE_API_URL=https://TU-URL-BACKEND.up.railway.app/api
   ```

### 5️⃣ Verifica

Espera 2-5 minutos y prueba desde móvil o desde otro país.

---

## 🧪 Test Rápido

```bash
# Verifica que el backend responda
curl https://TU-URL-BACKEND.railway.app/health
```

Debe retornar:
```json
{"status":"OK","timestamp":"...","environment":"production"}
```

---

## 📚 Documentación Completa

Lee [MOBILE_FIX_GUIDE.md](MOBILE_FIX_GUIDE.md) para más detalles.

---

## ✅ Checklist

- [ ] Encontré la URL del backend en Railway
- [ ] Actualicé `.env.production`
- [ ] Configuré la variable en Railway Frontend
- [ ] Hice commit y push
- [ ] Esperé el deployment
- [ ] Probé desde móvil

---

**¿Sigues con problemas?** Comparte:
- URL del frontend en Railway
- URL del backend en Railway  
- Screenshot de errores en DevTools Console
