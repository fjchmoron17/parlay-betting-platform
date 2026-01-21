# 🏠 Módulo de Login para Casas de Apuestas

## 📋 Descripción

Sistema completo de autenticación y gestión de apuestas para que las casas de apuestas puedan:
- Iniciar sesión con sus credenciales
- Ver su balance en tiempo real
- Seleccionar juegos y crear apuestas
- Consultar historial de apuestas
- Ver reportes diarios

## 🚀 Cómo Usar

### 1. Acceder al Portal

Desde la aplicación principal, haz clic en el botón **"🏠 Portal Casa"** en la navegación superior.

### 2. Iniciar Sesión

**Credenciales de Demo:**
- **ID de Casa**: 1, 2, 3, o 4 (cualquier casa registrada)
- **Usuario**: `admin`
- **Contraseña**: `demo123`

> ⚠️ **Nota**: En producción, estas credenciales se validarán contra la tabla `betting_house_users` en la base de datos.

### 3. Navegar por el Portal

Una vez autenticado, tendrás acceso a 3 vistas:

#### 🎲 Apostar
- Visualiza todos los juegos disponibles
- Filtra por deporte y región
- Selecciona juegos para crear apuestas
- Crea apuestas simples o parlays

**Flujo de Apuesta:**
1. Haz clic en las cuotas de los juegos que quieres apostar
2. Verás una barra verde con el contador de selecciones
3. Haz clic en "Crear Apuesta"
4. Ingresa el monto a apostar
5. Revisa la ganancia potencial
6. Confirma la apuesta

#### 📋 Mis Apuestas
- Consulta todas las apuestas de tu casa
- Filtra por estado: Todas / Pendientes / Ganadas / Perdidas
- Liquida apuestas pendientes (✓ Ganada / ✗ Perdida)
- Ve estadísticas resumidas

#### 📊 Reportes
- Selecciona rango de fechas
- Ve totales: apuestas, montos apostados, ganancias, comisiones
- Calcula reporte diario con el botón "Calcular Reporte de Hoy"
- Exporta datos para análisis

## 🔧 Arquitectura Técnica

### Componentes Creados

```
src/
├── context/
│   └── AuthContext.jsx          # Manejo de sesión y autenticación
├── components/
│   ├── LoginForm.jsx            # Formulario de login
│   ├── LoginForm.css
│   ├── PlaceBetForm.jsx         # Formulario para crear apuestas
│   └── PlaceBetForm.css
└── pages/
    ├── HousePortal.jsx          # Portal principal post-login
    └── HousePortal.css
```

### AuthContext API

```javascript
const { 
  user,              // Datos del usuario autenticado
  house,             // Datos de la casa (balance, moneda, etc)
  isAuthenticated,   // Boolean
  loading,           // Estado de carga inicial
  login,             // (houseId, username, password) => Promise
  logout,            // () => void
  refreshHouseData   // () => Promise (actualiza balance)
} = useAuth();
```

### Flujo de Datos

1. **Login**: `LoginForm` → `AuthContext.login()` → `localStorage` + state
2. **Session**: `AuthProvider` verifica `localStorage` al iniciar
3. **Apuestas**: `PlaceBetForm` → `b2bApi.placeBet()` → `refreshHouseData()`
4. **Logout**: Limpia `localStorage` y state

## 🔐 Seguridad

### Implementación Actual (Demo)
- Autenticación simulada (solo valida que exista la casa)
- Sesión guardada en `localStorage`
- Sin validación de contraseñas reales

### Para Producción:
1. **Backend Authentication Endpoint**:
```javascript
POST /api/auth/login
Body: { betting_house_id, username, password }
Response: { success, token, user, house }
```

2. **Modificar AuthContext.login()**:
```javascript
const login = async (houseId, username, password) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      betting_house_id: houseId, 
      username, 
      password 
    })
  });
  
  const data = await response.json();
  
  if (data.success) {
    localStorage.setItem('authToken', data.token);
    setUser(data.user);
    setHouse(data.house);
  }
  
  return data;
};
```

3. **JWT Tokens**: Implementar tokens JWT para autenticación en cada request
4. **Password Hashing**: Usar bcrypt para hashear contraseñas en BD
5. **Rate Limiting**: Limitar intentos de login
6. **HTTPS**: Asegurar que la app corra sobre HTTPS en producción

## 📊 Base de Datos

### Tabla: betting_house_users (Existe en schema)

```sql
CREATE TABLE betting_house_users (
  id SERIAL PRIMARY KEY,
  betting_house_id INTEGER REFERENCES betting_houses(id),
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,  -- bcrypt hash
  role VARCHAR(50) DEFAULT 'operator',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

### Crear Usuario (SQL Manual - Temporal)

```sql
INSERT INTO betting_house_users 
  (betting_house_id, username, email, password_hash, role)
VALUES 
  (1, 'admin', 'admin@casadeljuego.mx', 'demo123', 'admin');
```

> ⚠️ En producción, usar bcrypt para el password_hash

## 🎯 Features Implementadas

- ✅ Sistema de login con credenciales
- ✅ Sesión persistente (localStorage)
- ✅ Portal post-login con navegación
- ✅ Selección múltiple de juegos
- ✅ Creación de apuestas simples y parlays
- ✅ Cálculo automático de ganancias potenciales
- ✅ Visualización de balance en tiempo real
- ✅ Historial de apuestas con filtros
- ✅ Liquidación de apuestas (ganadas/perdidas)
- ✅ Reportes diarios con filtros de fecha
- ✅ Logout y limpieza de sesión
- ✅ Responsive design

## 🚧 Pendiente para Producción

1. **Backend Auth Endpoint** - Validación real de usuarios
2. **JWT Implementation** - Tokens de autenticación
3. **Password Reset** - Recuperación de contraseña
4. **User Management** - CRUD de usuarios por casa
5. **Roles y Permisos** - Admin, Operador, Viewer
6. **Two-Factor Auth** - Seguridad adicional
7. **Audit Log** - Registro de acciones críticas
8. **Session Timeout** - Expiración automática

## 🧪 Testing

### Test Manual - Login Flow

1. Inicia la app: `npm run dev`
2. Haz clic en "🏠 Portal Casa"
3. Ingresa:
   - ID: 1
   - Usuario: admin
   - Password: demo123
4. Deberías ver el portal con:
   - Nombre de la casa en header
   - Balance actual
   - 3 tabs de navegación
5. Ve a "Apostar" → selecciona juegos → crea apuesta
6. Verifica en "Mis Apuestas" que aparezca
7. Cierra sesión y verifica que vuelve al login

### Test Backend API

```bash
# Crear una apuesta desde el portal
# Luego verificar en backend:

curl https://parlaybackend-production-b45e.up.railway.app/api/bets-db?betting_house_id=1

# Debe mostrar la apuesta creada
```

## 📝 Variables de Entorno

Asegúrate de tener configurado en Railway (backend):

```env
DATABASE_URL=postgresql://postgres:...@tramway.proxy.rlwy.net:42212/railway
ODDS_API_KEY=3709555baab96669fb03ff0afbe6c873
NODE_ENV=production
PORT=3333
GAMES_CACHE_TTL_MS=300000
```

## 🎨 UI/UX

- **Login Page**: Gradiente púrpura, card centrado, info de demo
- **Portal Header**: Gradiente púrpura, balance destacado, logout visible
- **Navigation**: 3 tabs con iconos, highlight en activo
- **Selection Bar**: Verde con contador, botón "Crear Apuesta"
- **Bet Form**: Modal con resumen de selecciones, cálculos en tiempo real
- **Responsive**: Funciona en mobile, tablet y desktop

## 🔗 Integración con Sistema Existente

Este módulo se integra con:
- ✅ `src/services/b2bApi.js` - Para llamadas API
- ✅ `backend/routes/bets.js` - Endpoints de apuestas
- ✅ `src/components/BetsList.jsx` - Historial de apuestas
- ✅ `src/components/DailyReports.jsx` - Reportes
- ✅ `src/pages/Home.jsx` - Visualización de juegos (reutilizado)

## 📞 Soporte

Para cualquier duda o issue:
1. Revisa los logs del navegador (F12 → Console)
2. Verifica que el backend esté corriendo en Railway
3. Confirma que la base de datos esté conectada
4. Revisa que exista la casa de apuestas en la BD

---

**Desarrollado**: Enero 2026  
**Versión**: 1.0.0  
**Commit**: 1974f48
