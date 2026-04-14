# 🥔 CosechaApp - Sistema de Gestión de Cosechas de Papa

Sistema web profesional para la gestión de cosechas de papa enfocado en agricultores colombianos.
Permite trazabilidad completa, control financiero y análisis de producción.

## Stack Tecnológico

- **Frontend:** React 18 + Vite + Tailwind CSS + Recharts + Lucide Icons
- **Backend:** Node.js + Express + PostgreSQL
- **Auth:** JWT (JSON Web Tokens) + bcrypt

---

## 🚀 Instalación y Ejecución Local

### Prerrequisitos

- **Node.js** v18+ → [https://nodejs.org](https://nodejs.org)
- **PostgreSQL** 14+ → [https://postgresql.org](https://postgresql.org)
- **Git** (opcional)

### Paso 1: Crear la base de datos

Abre **pgAdmin** o la terminal de PostgreSQL:

```sql
CREATE DATABASE cosecha_app;
```

Luego ejecuta el esquema:

```bash
psql -U postgres -d cosecha_app -f database/schema.sql
```

O si prefieres, usa el script automático (Paso 3).

### Paso 2: Configurar variables de entorno

**Backend** — crea `backend/.env`:
```env
DATABASE_URL=postgresql://postgres:TU_PASSWORD@localhost:5432/cosecha_app
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cosecha_app
DB_USER=postgres
DB_PASSWORD=TU_PASSWORD
JWT_SECRET=clave_secreta_super_segura_123
JWT_EXPIRES_IN=7d
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

**Frontend** — crea `frontend/.env`:
```env
VITE_API_URL=http://localhost:3000/api
```

### Paso 3: Instalar dependencias

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### Paso 4: Inicializar base de datos (automático)

```bash
cd backend
npm run db:create
```

Esto crea la BD, aplica el esquema y los datos de prueba.

### Paso 5: Ejecutar

Abre **dos terminales**:

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
```
→ API corriendo en `http://localhost:3000`

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```
→ App corriendo en `http://localhost:5173`

---

## 📁 Estructura del Proyecto

```
cosecha-app/
├── backend/
│   ├── src/
│   │   ├── config/         # Conexión DB
│   │   ├── controllers/    # Lógica HTTP
│   │   ├── middlewares/     # Auth, validación, errores
│   │   ├── models/          # Modelos de datos (BaseModel + entidades)
│   │   ├── routes/          # Definición de rutas API
│   │   ├── services/        # Lógica de negocio
│   │   ├── utils/           # Helpers y utilidades
│   │   ├── app.js           # Configuración Express
│   │   └── server.js        # Entry point
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/      # AppLayout (sidebar + bottom nav)
│   │   │   └── ui/          # Componentes reutilizables
│   │   ├── context/         # AuthContext
│   │   ├── hooks/           # useApi, useForm
│   │   ├── pages/           # Páginas de la app
│   │   ├── routes/          # Guards (protected/public)
│   │   ├── services/        # API client
│   │   ├── utils/           # Helpers, constantes
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
└── database/
    ├── schema.sql           # Esquema completo
    ├── seed.sql             # Datos de prueba
    └── migrations/
```

## 🔌 API Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | /api/auth/registro | Crear cuenta |
| POST | /api/auth/login | Iniciar sesión |
| GET | /api/auth/perfil | Obtener perfil |
| GET/POST | /api/fincas | Listar / Crear fincas |
| GET/PUT/DELETE | /api/fincas/:id | CRUD finca |
| GET | /api/fincas/:id/lotes | Lotes de una finca |
| POST | /api/lotes | Crear lote |
| GET/POST | /api/cosechas | Listar / Crear cosechas |
| GET | /api/cosechas/dashboard | Dashboard completo |
| GET | /api/cosechas/estadisticas | Estadísticas globales |
| GET/PUT/DELETE | /api/cosechas/:id | CRUD cosecha |
| GET/POST | /api/cosechas/:id/actividades | Actividades por cosecha |
| GET/POST | /api/cosechas/:id/gastos | Gastos por cosecha |
| GET/POST | /api/cosechas/:id/ventas | Ventas por cosecha |
| PUT/DELETE | /api/actividades/:id | Editar/eliminar actividad |
| PUT/DELETE | /api/gastos/:id | Editar/eliminar gasto |
| PUT/DELETE | /api/ventas/:id | Editar/eliminar venta |

## 🧮 Cálculos Automáticos

- **Costo total** = Σ gastos + Σ costos de actividades
- **Producción total** = primera + segunda + tercera + descarte
- **Ingreso total** = Σ ventas
- **Utilidad neta** = ingresos - costos
- **Costo por kg** = costo_total / producción_total
- **Rendimiento/ha** = producción_total / área_sembrada

## 🚀 Deploy (producción)

### Backend → Railway o Render
1. Sube el repo a GitHub
2. Conecta Railway/Render al repo
3. Configura las variables de entorno
4. Build command: `npm install`
5. Start command: `node src/server.js`

### Frontend → Vercel
1. Conecta Vercel al repo
2. Root directory: `frontend`
3. Build command: `npm run build`
4. Output directory: `dist`
5. Variable: `VITE_API_URL=https://tu-api.railway.app/api`

---

**Desarrollado para agricultores colombianos** 🇨🇴
