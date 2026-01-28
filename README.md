# MOVICAR SYSTEM

Sistema de Gestión de Renta de Vehículos - Plataforma Web Profesional

## Stack Tecnológico

### Backend
- **Node.js** + **Express.js** + **TypeScript**
- **PostgreSQL** + **Sequelize ORM**
- **JWT** para autenticación
- **bcryptjs** para encriptación

### Frontend
- **React 18** + **TypeScript**
- **Redux Toolkit** para estado global
- **Material-UI (MUI)** para componentes
- **Chart.js** para gráficos
- **Vite** como bundler

## Estructura del Proyecto

```
movicar-system/
├── backend/
│   ├── src/
│   │   ├── config/         # Configuraciones (DB, JWT)
│   │   ├── controllers/    # Controladores de rutas
│   │   ├── middleware/     # Auth, roles, errores
│   │   ├── models/         # Modelos Sequelize
│   │   ├── routes/         # Rutas API
│   │   ├── services/       # Lógica de negocio
│   │   ├── types/          # Tipos TypeScript
│   │   ├── seeders/        # Datos iniciales
│   │   ├── app.ts          # Configuración Express
│   │   └── server.ts       # Entry point
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/     # Componentes React
│   │   ├── pages/          # Páginas
│   │   ├── services/       # Llamadas API
│   │   ├── store/          # Redux store
│   │   ├── hooks/          # Custom hooks
│   │   ├── types/          # Tipos TypeScript
│   │   ├── styles/         # Tema y estilos
│   │   ├── App.tsx         # Router
│   │   └── main.tsx        # Entry point
│   └── package.json
│
└── README.md
```

## Instalación

### Requisitos Previos
- Node.js 18+
- PostgreSQL 14+
- npm o yarn

### 1. Configurar Base de Datos

```sql
CREATE DATABASE movicar_db;
```

### 2. Configurar Backend

```bash
cd backend

# Instalar dependencias
npm install

# Crear archivo .env (copiar de .env.example)
cp .env.example .env

# Editar .env con tus credenciales de PostgreSQL
```

**Contenido de `.env`:**
```env
PORT=3001
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=movicar_db
DB_USER=postgres
DB_PASSWORD=tu_password
JWT_SECRET=tu_secret_key_muy_seguro
CORS_ORIGIN=http://localhost:5173
```

```bash
# Iniciar servidor de desarrollo
npm run dev
```

### 3. Configurar Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

### 4. Acceder a la Aplicación

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001/api/v1

**Credenciales de prueba:**
- Email: `admin@movicar.com`
- Password: `admin123`

## API Endpoints

### Autenticación
```
POST   /api/v1/auth/login        # Iniciar sesión
POST   /api/v1/auth/logout       # Cerrar sesión
POST   /api/v1/auth/refresh      # Renovar token
GET    /api/v1/auth/me           # Usuario actual
```

### Vehículos
```
GET    /api/v1/vehicles          # Listar vehículos
GET    /api/v1/vehicles/:id      # Detalles de vehículo
GET    /api/v1/vehicles/available # Vehículos disponibles
GET    /api/v1/vehicles/statistics # Estadísticas
POST   /api/v1/vehicles          # Crear vehículo
PUT    /api/v1/vehicles/:id      # Editar vehículo
PATCH  /api/v1/vehicles/:id/status # Cambiar estado
DELETE /api/v1/vehicles/:id      # Eliminar vehículo
```

### Clientes
```
GET    /api/v1/customers         # Listar clientes
GET    /api/v1/customers/:id     # Detalles de cliente
GET    /api/v1/customers/active  # Clientes activos
GET    /api/v1/customers/search  # Buscar clientes
POST   /api/v1/customers         # Crear cliente
PUT    /api/v1/customers/:id     # Editar cliente
DELETE /api/v1/customers/:id     # Eliminar cliente
```

### Dashboard
```
GET    /api/v1/dashboard         # Datos principales
GET    /api/v1/dashboard/kpis    # KPIs
GET    /api/v1/dashboard/alerts  # Alertas
```

## Módulos Completados (Chat 1)

1. ✅ **Autenticación** - Login, JWT, roles, middleware
2. ✅ **Dashboard** - KPIs, gráficos, alertas
3. ✅ **Inventario** - CRUD de vehículos
4. ✅ **Clientes** - CRUD de clientes

## Módulos Pendientes

### Chat 2 - Flujo Operacional
- Rentas (crear, gestionar)
- Devoluciones
- Pagos
- PDFs (contratos, facturas)
- Emails automáticos

### Chat 3 - Administración
- Mantenimiento
- Reportes
- Contabilidad
- Configuración

## Roles de Usuario

| Rol | Descripción | Permisos |
|-----|-------------|----------|
| admin | Administrador | Acceso total |
| director | Director | Ver todas las sedes |
| manager | Gerente | Gestión de sede |
| seller | Vendedor | Crear rentas |
| accountant | Contador | Finanzas |
| inventory | Inventario | Gestión de vehículos |

## Scripts Disponibles

### Backend
```bash
npm run dev      # Desarrollo con hot-reload
npm run build    # Compilar TypeScript
npm run start    # Producción
```

### Frontend
```bash
npm run dev      # Desarrollo con Vite
npm run build    # Build para producción
npm run preview  # Preview del build
```

---

**MOVICAR SYSTEM v1.0** - Chat 1 Completado

*Siguiente: Chat 2 - Rentas, Devoluciones, Pagos*
