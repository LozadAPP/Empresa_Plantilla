# MOVICAR - Sistema de Gestión de Renta de Vehículos

> Proyecto plantilla para empresa de renta de vehículos con gestión completa de inventario, rentas, clientes, pagos y facturación.

## 📋 Información General

- **Nombre del Proyecto**: MOVICAR
- **Tipo**: Sistema ERP para renta de vehículos y gestión de inventario genérico
- **Estado**: Chat 5 en progreso - Correcciones y validaciones completas
- **Desarrollador**: Cesar
- **Última actualización**: Enero 2026

---

## 🏗️ Arquitectura del Proyecto

### Stack Tecnológico

#### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **UI Library**: Material-UI v5 (MUI)
- **Routing**: React Router DOM v6
- **State Management**: Redux Toolkit
- **HTTP Client**: Axios
- **Notificaciones**: Notistack
- **Temas**: Sistema dual Dark/Light Mode con localStorage
- **Mapas**: @react-google-maps/api (Google Maps)
- **Gráficos**: Chart.js + react-chartjs-2

#### Backend
- **Runtime**: Node.js + Express.js + TypeScript
- **Base de Datos**: PostgreSQL 16
- **ORM**: Sequelize
- **Autenticación**: JWT (HTTP-only cookies) + Token Blacklist
- **Validación**: Express Validator
- **CORS**: Configurado para desarrollo
- **PDF Generation**: PDFKit

---

## 📁 Estructura del Proyecto

```
Empresas_platilla/
├── frontend/                    # Aplicación React
│   ├── src/
│   │   ├── components/         # Componentes reutilizables
│   │   │   ├── common/         # Layout, Header, Sidebar
│   │   │   ├── forms/          # VehicleForm, CustomerForm, etc.
│   │   │   ├── styled/         # StyledKPI, StyledSection
│   │   │   └── maps/           # InventoryMap, MapView
│   │   ├── contexts/           # ThemeContext
│   │   ├── hooks/              # useAuth, useThemeStyles
│   │   ├── pages/              # Todas las páginas
│   │   ├── services/           # API Services (axios)
│   │   ├── store/              # Redux Store
│   │   ├── theme/              # darkTheme, lightTheme
│   │   ├── types/              # TypeScript interfaces
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
│
├── backend/                     # API Express
│   ├── src/
│   │   ├── config/             # database.ts
│   │   ├── controllers/        # Controladores
│   │   ├── middleware/         # authMiddleware, roleMiddleware
│   │   ├── models/             # Modelos Sequelize (30+)
│   │   ├── routes/             # Rutas API
│   │   ├── services/           # Lógica de negocio
│   │   ├── seeders/            # Datos iniciales
│   │   ├── utils/              # vinValidator, etc.
│   │   └── server.ts
│   └── package.json
│
├── mcp-postgres-read.js        # MCP Server solo lectura
├── mcp-postgres-write.js       # MCP Server con escritura
├── .mcp.json                   # Config MCP (project-level)
└── CLAUDE.md                   # Este archivo
```

---

## 🔐 Autenticación y Usuarios

### Credenciales de Prueba (12 Usuarios - Todos los Roles)

| Email | Password | Rol |
|-------|----------|-----|
| `admin@movicar.com` | `Admin123!` | admin |
| `director@movicar.com` | `Test123!` | director_general |
| `jefe.inventarios@movicar.com` | `Test123!` | jefe_inventarios |
| `jefe.ventas@movicar.com` | `Test123!` | jefe_ventas |
| `jefe.finanzas@movicar.com` | `Test123!` | jefe_finanzas |
| `jefe.admin@movicar.com` | `Test123!` | jefe_admin |
| `encargado@movicar.com` | `Test123!` | encargado_inventario |
| `tecnico@movicar.com` | `Test123!` | tecnico |
| `contador@movicar.com` | `Test123!` | contador |
| `cajero@movicar.com` | `Test123!` | cajero |
| `asistente@movicar.com` | `Test123!` | asistente_admin |
| `vendedor@movicar.com` | `Test123!` | vendedor |

### Sistema de Autenticación

- JWT almacenado en HTTP-only cookies (no localStorage)
- Token Blacklist con SHA-256 para logout seguro
- Middleware de autenticación en backend
- Protected routes en frontend
- Auto-redirect a login si no autenticado
- Role-based access control (RBAC) con 12 roles

### Sistema de 12 Roles

| # | Rol | Descripción | Permisos |
|---|-----|-------------|----------|
| 1 | `admin` | Administrador del Sistema | Acceso total |
| 2 | `director_general` | Director General | Ver todas las sedes, gestión completa |
| 3 | `jefe_inventarios` | Jefe de Inventarios | CRUD vehículos, estadísticas |
| 4 | `jefe_ventas` | Jefe de Ventas | Rentas, clientes, reportes ventas |
| 5 | `jefe_finanzas` | Jefe de Finanzas | Contabilidad, pagos, reportes |
| 6 | `jefe_admin` | Jefe Administrativo | Usuarios, configuración, auditoría |
| 7 | `encargado_inventario` | Encargado de Inventario | CRUD vehículos básico |
| 8 | `tecnico` | Técnico de Mantenimiento | Órdenes de mantenimiento |
| 9 | `vendedor` | Vendedor | Crear rentas y clientes |
| 10 | `contador` | Contador | Ver finanzas, reportes |
| 11 | `cajero` | Cajero | Procesar pagos |
| 12 | `asistente_admin` | Asistente Administrativo | Soporte administrativo |

---

## 🗄️ Base de Datos

### Configuración PostgreSQL

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=movicar_db
DB_USER=postgres
DB_PASSWORD=postgres123
```

### Modelos Principales (30+ tablas)

**Core:**
- `users` - Usuarios del sistema
- `roles` - Roles disponibles
- `user_roles` - Asignación usuario-rol
- `locations` - Sedes/ubicaciones
- `vehicle_types` - Tipos de vehículos
- `vehicles` - Inventario de vehículos
- `customers` - Clientes

**Operacional:**
- `rentals` - Rentas activas/completadas
- `returns` - Devoluciones
- `payments` - Pagos
- `invoices` - Facturas

**Inventario Genérico:**
- `item_categories` - Categorías (vehículos, equipo, etc.)
- `inventory_items` - Artículos genéricos
- `inventory_movements` - Historial de movimientos

**Administración:**
- `maintenance_orders` - Órdenes de mantenimiento
- `accounts` - Plan de cuentas contable
- `transactions` - Transacciones contables
- `alerts` - Sistema de alertas
- `audit_logs` - Auditoría

---

## 🚀 Funcionalidades por Chat

### ✅ Chat 1 - Fundamentos
- [x] Autenticación completa (Login/Logout con JWT)
- [x] Dashboard principal con métricas reales
- [x] Gestión de Inventario (Vehículos) con daily_rate
- [x] Gestión de Clientes con validaciones
- [x] Sistema de temas Dark/Light Mode
- [x] Layout responsive con sidebar y 12 roles

### ✅ Chat 2 - Flujo Operacional
- [x] Módulo de Rentas (CRUD completo)
- [x] Formulario de Nueva Renta
- [x] Detalle de Renta
- [x] Módulo de Devoluciones
- [x] Módulo de Pagos
- [x] Módulo de Facturas/Invoices

### ✅ Chat 3 - Sistema de Inventario Genérico
- [x] Multi-categoría (Vehículos, Equipos, Herramientas)
- [x] Tracking en tiempo real con Google Maps
- [x] Auto-generación de documentos PDF
- [x] Historial completo de movimientos
- [x] Timeline visual de ubicaciones
- [x] Coordenadas GPS en todas las ubicaciones

### ✅ Chat 4 - Sidebar y Roles
- [x] Sistema de submenús expandibles
- [x] 12 roles específicos implementados
- [x] Filtrado por roles en navegación
- [x] Arquitectura multi-sede preparada

### ✅ Chat 5 - Correcciones y Validaciones (COMPLETADO)

**Fase 2 - Funcionalidad Core:**
- [x] Campo `daily_rate` en VehicleForm con validación
- [x] Sistema de 12 roles actualizado en rutas
- [x] Dashboard conectado a datos reales (0% hardcoded)
- [x] Estadísticas globales de vehículos (no solo página actual)

**Fase 3 - Validaciones y UX:**
- [x] VIN duplicado validado en UPDATE (no solo CREATE)
- [x] Formulario de edición pre-poblado con datos existentes
- [x] Estados de error en Dashboard con retry
- [x] Búsqueda de vehículos incluye VIN
- [x] Validación de status antes de eliminar vehículo
- [x] Validación de rentas activas antes de eliminar cliente

---

## 🎨 Sistema de Temas

### Paleta de Colores

**Dark Mode (por defecto):**
- Background: `#13131f`
- Cards: `#1c1c2e`
- Primary: `#8b5cf6` (Purple)
- Text: `rgba(255, 255, 255, 0.95)`

**Light Mode:**
- Background: `#f8f9fa`
- Cards: `#ffffff`
- Primary: `#8b5cf6` (Purple)
- Text: `#1f2937`

### Colores Semánticos
- **Success**: `#10b981` (Green)
- **Error**: `#ef4444` (Red)
- **Warning**: `#f59e0b` (Orange)
- **Info**: `#3b82f6` (Blue)

### Typography
- **Font**: "Poppins", system-ui, sans-serif
- **Border Radius**: Cards 24px, Buttons 12px, Inputs 12px

---

## 📡 API Endpoints

### Autenticación
```
POST   /api/auth/login          # Login (retorna JWT en cookie)
POST   /api/auth/logout         # Logout (invalida token)
POST   /api/auth/refresh        # Renovar token
GET    /api/auth/me             # Usuario actual
```

### Dashboard
```
GET    /api/dashboard           # Datos principales + KPIs
GET    /api/dashboard/recent-rentals    # Últimas 5 rentas
GET    /api/dashboard/top-customers     # Top 5 clientes por revenue
GET    /api/dashboard/critical-alerts   # Alertas críticas
GET    /api/dashboard/performance-data  # Datos de gráfica por periodo
GET    /api/dashboard/maintenance-schedule  # Mantenimientos pendientes
```

### Vehículos
```
GET    /api/vehicles            # Listar (paginado, filtros)
GET    /api/vehicles/:id        # Detalle
GET    /api/vehicles/available  # Solo disponibles
GET    /api/vehicles/statistics # Estadísticas globales
GET    /api/vehicles/by-type    # Agrupados por tipo
GET    /api/vehicles/types      # Lista de tipos
POST   /api/vehicles            # Crear (roles: inventory team)
PUT    /api/vehicles/:id        # Actualizar (valida VIN único)
PATCH  /api/vehicles/:id/status # Cambiar estado
DELETE /api/vehicles/:id        # Eliminar (valida rentas activas)
```

### Clientes
```
GET    /api/customers           # Listar (paginado)
GET    /api/customers/:id       # Detalle
GET    /api/customers/active    # Solo activos
GET    /api/customers/search    # Búsqueda
POST   /api/customers           # Crear
PUT    /api/customers/:id       # Actualizar
PATCH  /api/customers/:id/toggle-active   # Activar/Desactivar
PATCH  /api/customers/:id/credit-limit    # Cambiar límite crédito
DELETE /api/customers/:id       # Eliminar (valida rentas/pagos)
```

### Rentas
```
GET    /api/rentals             # Listar
GET    /api/rentals/:id         # Detalle
POST   /api/rentals             # Crear nueva renta
PUT    /api/rentals/:id         # Actualizar
PATCH  /api/rentals/:id/status  # Cambiar estado
```

### Pagos
```
GET    /api/payments            # Listar
POST   /api/payments            # Registrar pago
```

### Inventario Genérico
```
GET    /api/inventory/items     # Todos los artículos
GET    /api/inventory/items/:id # Detalle con movimientos
POST   /api/inventory/items     # Crear artículo
GET    /api/inventory/movements # Historial de movimientos
POST   /api/inventory/movements # Registrar movimiento
GET    /api/inventory/categories # Categorías
GET    /api/inventory/locations  # Ubicaciones
GET    /api/inventory/documents/:id/download # Descargar PDF
```

---

## 🛠️ Comandos de Desarrollo

### Frontend
```bash
cd frontend
npm install           # Instalar dependencias
npm run dev          # Servidor desarrollo (http://localhost:5173)
npm run build        # Build producción
```

### Backend
```bash
cd backend
npm install           # Instalar dependencias
npm run dev          # Servidor desarrollo (http://localhost:3000)
npm run build        # Compilar TypeScript
npm start            # Servidor producción
```

### Base de Datos
```bash
# Crear base de datos
psql -U postgres
CREATE DATABASE movicar_db;

# Las tablas se crean automáticamente con Sequelize sync
# El seeder crea usuarios y datos de prueba al iniciar
```

---

## 🔧 Variables de Entorno

### Backend (.env)
```env
# Server
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=movicar_db
DB_USER=postgres
DB_PASSWORD=postgres123

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173

# Business Rules
DEFAULT_TAX_PERCENTAGE=16
DEFAULT_LATE_FEE_MULTIPLIER=1.5
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3000/api
VITE_GOOGLE_MAPS_API_KEY=tu_api_key_aqui
```

---

## 🔌 MCP Servers (Claude Code)

### Servidores Disponibles

**postgres-movicar-readonly** - Solo lectura
```
Tools: query, list_tables, describe_table, get_schema_info
Uso: Exploración de datos, reportes, debugging
```

**postgres-movicar-write** - Lectura/Escritura
```
Tools: execute_sql, execute_transaction, insert_with_return, update_with_return
Uso: Desarrollo, migraciones, operaciones CRUD
```

### Configuración
Archivo `.mcp.json` en raíz del proyecto con credenciales de PostgreSQL.

### Uso en Claude Code
```bash
cd "c:\Users\Cesar\PROYECTOS PERSONALES\Empresas_platilla"
claude
> /mcp   # Verificar servidores activos
```

---

## 📐 Estructura del Sidebar

```
PRINCIPAL
├── Dashboard
├── Inventario ▼
│   ├── Dashboard de Inventario
│   └── Gestión de Inventario
└── Clientes

OPERACIONES
├── Rentas
├── Devoluciones
├── Pagos
└── Facturas

FINANZAS
├── Reportes
├── Contabilidad
└── Alertas

ADMINISTRACIÓN
├── Mantenimiento
├── Usuarios
├── Configuración
└── Auditoría
```

**Total**: 13 módulos principales + 2 submenús = 15 opciones navegables

---

## ✅ Validaciones Implementadas

### Vehículos
- VIN con checksum ISO 3779 (17 caracteres, sin I/O/Q)
- VIN único en CREATE y UPDATE
- Tarifa diaria (daily_rate) requerida y > 0
- No eliminar si status = 'rented'
- No eliminar si tiene rentas activas en BD

### Clientes
- Email único
- No eliminar si tiene rentas activas
- No eliminar si tiene pagos pendientes

### Dashboard
- Manejo de errores con notificación toast
- Botón de retry si falla la carga
- Fallbacks a datos demo si backend no responde

---

## 🌐 URLs y Puertos

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000/api |
| PostgreSQL | localhost:5432 |

---

## 📝 Notas de Desarrollo

### Filosofía del Proyecto
- **Profesional y correcto** sobre rápido y temporal
- Validar completamente antes de continuar
- Datos reales sobre hardcoded
- Testing en cada fase

### Convenciones de Código
- TypeScript estricto
- Sequelize ORM para queries
- Express Validator para validaciones de request
- Mensajes de error en español

### Archivos Críticos

**Backend:**
- `server.ts` - Entry point, llama seeders
- `middleware/authMiddleware.ts` - JWT validation
- `middleware/roleMiddleware.ts` - RBAC
- `services/*Service.ts` - Lógica de negocio
- `routes/*.ts` - Definición de endpoints

**Frontend:**
- `App.tsx` - Rutas y providers
- `components/common/Layout.tsx` - Sidebar + Header
- `contexts/ThemeContext.tsx` - Dark/Light mode
- `services/*.ts` - Llamadas API
- `types/index.ts` - Interfaces TypeScript

---

**Última actualización**: Enero 2026
**Versión**: 2.0.0 (Chat 5 - Correcciones y validaciones completas)
