# MOVICAR - Documentacion Central del Proyecto

> Sistema ERP completo para gestion de renta de vehiculos con inventario, rentas, clientes, pagos, facturacion y contabilidad.

---

## INFORMACION DEL PROYECTO

| Campo | Valor |
|-------|-------|
| **Nombre** | MOVICAR |
| **Tipo** | Sistema ERP Renta de Vehiculos |
| **Estado** | Chat 5 en progreso - Correccion de issues |
| **Desarrollador** | Cesar |
| **Ultima actualizacion** | Enero 2026 |

---

## ARQUITECTURA TECNOLOGICA

### Frontend
| Tecnologia | Version | Proposito |
|------------|---------|-----------|
| React | 18.x | Framework UI |
| TypeScript | 5.x | Tipado estatico |
| Vite | 5.x | Build tool |
| Material-UI | 5.x | Componentes UI |
| React Router | 6.x | Navegacion |
| Redux Toolkit | 2.x | Estado global |
| Axios | 1.x | HTTP Client |
| Notistack | 3.x | Notificaciones toast |
| Google Maps API | - | Mapas de inventario |

### Backend
| Tecnologia | Version | Proposito |
|------------|---------|-----------|
| Node.js | 20.x | Runtime |
| Express.js | 4.x | Framework HTTP |
| TypeScript | 5.x | Tipado estatico |
| Sequelize | 6.x | ORM |
| PostgreSQL | 16.x | Base de datos |
| JWT | 9.x | Autenticacion |
| Bcrypt | 2.x | Hash passwords |
| PDFKit | - | Generacion documentos |
| Express Validator | 7.x | Validacion inputs |

---

## ESTRUCTURA DEL PROYECTO

```
Empresas_platilla/
|
+-- frontend/                    # Aplicacion React
|   +-- src/
|   |   +-- components/          # Componentes reutilizables
|   |   |   +-- common/          # Layout, Header, Sidebar
|   |   |   +-- forms/           # VehicleForm, CustomerForm, etc.
|   |   +-- contexts/            # ThemeContext
|   |   +-- hooks/               # useAuth, custom hooks
|   |   +-- pages/               # Paginas principales (ver lista abajo)
|   |   +-- services/            # API services (axios)
|   |   +-- store/               # Redux store
|   |   +-- theme/               # darkTheme, lightTheme
|   |   +-- types/               # TypeScript interfaces
|   |   +-- App.tsx
|   |   +-- main.tsx
|   +-- .env                     # Variables de entorno
|   +-- package.json
|
+-- backend/                     # API Express
|   +-- src/
|   |   +-- config/              # database.ts
|   |   +-- controllers/         # Controladores HTTP
|   |   +-- middleware/          # auth, roles, cors
|   |   +-- models/              # Modelos Sequelize
|   |   +-- routes/              # Rutas API
|   |   +-- services/            # Logica de negocio
|   |   +-- seeders/             # Datos iniciales
|   |   +-- types/               # TypeScript types
|   |   +-- utils/               # Utilidades (vinValidator, etc.)
|   |   +-- server.ts
|   +-- .env                     # Variables de entorno
|   +-- package.json
|
+-- docs/                        # Documentacion por chat
+-- CLAUDE.md                    # Contexto para Claude AI
+-- DOCUMENTACION_CENTRAL.md     # Este archivo
```

### Paginas del Frontend

| Pagina | Ruta | Descripcion |
|--------|------|-------------|
| Login | `/login` | Autenticacion |
| Dashboard | `/` | Metricas principales |
| Inventory | `/inventory` | Dashboard de vehiculos |
| InventoryManagement | `/inventory/management` | Gestion inventario generico |
| Customers | `/customers` | Gestion de clientes |
| Rentals | `/rentals` | Lista de rentas |
| RentalForm | `/rentals/new` | Nueva renta |
| RentalDetail | `/rentals/:id` | Detalle de renta |
| Returns | `/returns` | Devoluciones |
| ReturnForm | `/returns/new` | Nueva devolucion |
| Payments | `/payments` | Pagos |
| PaymentForm | `/payments/new` | Nuevo pago |
| Invoices | `/invoices` | Facturas |
| Maintenance | `/maintenance` | Mantenimiento |
| Reports | `/reports` | Reportes |
| Accounting | `/accounting` | Contabilidad |
| Alerts | `/alerts` | Alertas del sistema |
| Settings | `/settings` | Configuracion |
| Users | `/users` | Gestion usuarios |
| AuditLog | `/audit` | Log de auditoria |

---

## BASE DE DATOS

### Conexion
```
Host: localhost
Port: 5432
Database: movicar_db
User: postgres
Password: postgres123
```

### Modelos Principales (21 tablas)

#### Core (8 tablas)
| Tabla | Descripcion |
|-------|-------------|
| `users` | Usuarios del sistema (staff) |
| `roles` | 12 roles del sistema |
| `user_roles` | Relacion usuarios-roles |
| `locations` | Sedes (Mexico, Bogota, Lima) |
| `customers` | Clientes que rentan |
| `vehicles` | Inventario de vehiculos |
| `vehicle_types` | Tipos (Sedan, SUV, etc.) |
| `audit_logs` | Auditoria de acciones |

#### Operacional (5 tablas)
| Tabla | Descripcion |
|-------|-------------|
| `rentals` | Rentas de vehiculos |
| `returns` | Devoluciones |
| `payments` | Pagos realizados |
| `invoices` | Facturas |
| `incomes` | Registro de ingresos |

#### Administracion (5 tablas)
| Tabla | Descripcion |
|-------|-------------|
| `maintenance_types` | Tipos de mantenimiento |
| `maintenance_orders` | Ordenes de mantenimiento |
| `accounts` | Plan de cuentas contable |
| `transactions` | Transacciones contables |
| `alerts` | Sistema de alertas |

#### Configuracion (2 tablas)
| Tabla | Descripcion |
|-------|-------------|
| `system_configs` | Configuracion general |
| `price_configs` | Precios por sede/tipo |

#### Inventario Generico (3 tablas)
| Tabla | Descripcion |
|-------|-------------|
| `item_categories` | Categorias (vehiculos, equipo, etc.) |
| `inventory_items` | Articulos de inventario |
| `inventory_movements` | Movimientos (entrada/salida/transfer) |

### Relaciones Principales

```
User (1) -----> (N) Rental
Customer (1) --> (N) Rental
Vehicle (1) ---> (N) Rental
Rental (1) ----> (N) Payment
Rental (1) ----> (1) Invoice
Rental (1) ----> (1) Return
Location (1) --> (N) Vehicle
Location (1) --> (N) User
VehicleType (1) -> (N) Vehicle
```

---

## SISTEMA DE AUTENTICACION

### Credenciales de Prueba

| Usuario | Email | Password | Rol |
|---------|-------|----------|-----|
| Admin | admin@movicar.com | Admin123! | admin |
| Usuario | user@movicar.com | User123! | vendedor |

### Flujo de Autenticacion

1. **Login**: `POST /api/v1/auth/login`
   - Recibe email + password
   - Valida credenciales con bcrypt
   - Genera JWT (24h expiracion)
   - Retorna token + refresh token + user data

2. **Almacenamiento**:
   - JWT en HTTP-only cookies (mas seguro)
   - Refresh token para renovacion automatica

3. **Proteccion de Rutas**:
   - `authMiddleware` valida JWT en cada request
   - `requireRole()` valida permisos por rol

4. **Logout**: `POST /api/v1/auth/logout`
   - Token agregado a blacklist (SHA-256)
   - Cookie eliminada

### Token Blacklist
- Implementado en `backend/src/utils/tokenBlacklist.ts`
- Usa SHA-256 para hashear tokens
- Limpieza automatica de tokens expirados

---

## SISTEMA DE 12 ROLES

| # | Rol | Nombre Display | Descripcion |
|---|-----|----------------|-------------|
| 1 | `admin` | Administrador del Sistema | Acceso total |
| 2 | `director_general` | Director General | Gestion ejecutiva |
| 3 | `jefe_inventarios` | Jefe de Inventarios | Gestion de flota |
| 4 | `jefe_ventas` | Jefe de Ventas | Supervision ventas |
| 5 | `jefe_finanzas` | Jefe de Finanzas | Contabilidad y reportes |
| 6 | `jefe_admin` | Jefe Administrativo | Administracion general |
| 7 | `encargado_inventario` | Encargado de Inventario | Operaciones de inventario |
| 8 | `tecnico` | Tecnico de Mantenimiento | Mantenimiento vehiculos |
| 9 | `vendedor` | Vendedor | Rentas y clientes |
| 10 | `contador` | Contador | Contabilidad |
| 11 | `cajero` | Cajero | Pagos y facturas |
| 12 | `asistente_admin` | Asistente Administrativo | Soporte administrativo |

### Permisos por Modulo

| Modulo | Roles con Acceso |
|--------|------------------|
| Dashboard | Todos |
| Inventario | admin, director_general, jefe_inventarios, encargado_inventario |
| Clientes | admin, director_general, jefe_ventas, vendedor |
| Rentas | admin, director_general, jefe_ventas, vendedor |
| Devoluciones | admin, director_general, jefe_ventas, vendedor |
| Pagos | admin, director_general, jefe_finanzas, contador, cajero |
| Facturas | admin, director_general, jefe_finanzas, contador, cajero |
| Reportes | admin, director_general, jefe_finanzas |
| Contabilidad | admin, director_general, jefe_finanzas, contador |
| Alertas | admin, director_general, jefe_admin |
| Mantenimiento | admin, director_general, jefe_inventarios, tecnico |
| Usuarios | admin, director_general, jefe_admin |
| Configuracion | admin, director_general |
| Auditoria | admin, director_general, jefe_admin |

---

## API ENDPOINTS

### Base URL
```
http://localhost:3000/api/v1
```

### Autenticacion
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| POST | `/auth/login` | Login |
| POST | `/auth/logout` | Logout |
| POST | `/auth/refresh` | Renovar token |
| GET | `/auth/me` | Usuario actual |

### Vehiculos
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/vehicles` | Listar (paginado) |
| GET | `/vehicles/:id` | Obtener uno |
| GET | `/vehicles/available` | Disponibles |
| GET | `/vehicles/statistics` | Estadisticas |
| POST | `/vehicles` | Crear |
| PUT | `/vehicles/:id` | Actualizar |
| PATCH | `/vehicles/:id/status` | Cambiar estado |
| DELETE | `/vehicles/:id` | Eliminar |

### Clientes
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/customers` | Listar (paginado) |
| GET | `/customers/:id` | Obtener uno |
| GET | `/customers/search` | Buscar |
| POST | `/customers` | Crear |
| PUT | `/customers/:id` | Actualizar |
| PATCH | `/customers/:id/toggle-active` | Activar/desactivar |
| DELETE | `/customers/:id` | Eliminar |

### Rentas
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/rentals` | Listar |
| GET | `/rentals/:id` | Obtener una |
| POST | `/rentals` | Crear |
| PUT | `/rentals/:id` | Actualizar |
| PATCH | `/rentals/:id/status` | Cambiar estado |

### Dashboard
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/dashboard/main` | KPIs principales |
| GET | `/dashboard/financial` | Metricas financieras |
| GET | `/dashboard/fleet` | Estado de flota |

### Inventario Generico
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/inventory/items` | Listar items |
| GET | `/inventory/items/:id` | Obtener item |
| POST | `/inventory/items` | Crear item |
| PUT | `/inventory/items/:id` | Actualizar item |
| GET | `/inventory/movements` | Listar movimientos |
| POST | `/inventory/movements` | Crear movimiento |
| GET | `/inventory/categories` | Categorias |
| GET | `/inventory/locations` | Ubicaciones |

---

## ESTRUCTURA DEL SIDEBAR

```
PRINCIPAL
+-- Dashboard
+-- Inventario (expandible)
|   +-- Dashboard de Inventario
|   +-- Gestion de Inventario
+-- Clientes

OPERACIONES
+-- Rentas
+-- Devoluciones
+-- Pagos
+-- Facturas

FINANZAS
+-- Reportes
+-- Contabilidad
+-- Alertas

ADMINISTRACION
+-- Mantenimiento
+-- Usuarios
+-- Configuracion
+-- Auditoria
```

---

## SISTEMA DE TEMAS

### Configuracion
- Archivo: `frontend/src/contexts/ThemeContext.tsx`
- Persistencia: localStorage key `movicar-theme-mode`
- Default: Dark mode

### Paleta de Colores

#### Dark Mode
| Elemento | Color |
|----------|-------|
| Background | #13131f |
| Cards | #1c1c2e |
| Primary | #8b5cf6 |
| Text | rgba(255,255,255,0.95) |

#### Light Mode
| Elemento | Color |
|----------|-------|
| Background | #f8f9fa |
| Cards | #ffffff |
| Primary | #8b5cf6 |
| Text | #1f2937 |

### Implementacion
```typescript
// Toggle en Layout.tsx
<Switch
  checked={isDarkMode}
  onChange={toggleTheme}
  icon={<LightModeIcon />}
  checkedIcon={<DarkModeIcon />}
/>
```

---

## VALIDACIONES IMPLEMENTADAS

### Vehiculos

| Campo | Validacion |
|-------|------------|
| VIN | 17 caracteres, checksum ISO 3779, unico |
| license_plate | Requerido, unico |
| year | 1990 - año actual + 1 |
| purchase_price | > 0 |
| current_value | > 0 |
| daily_rate | > 0 |
| status | available, rented, maintenance |

### Clientes

| Campo | Validacion |
|-------|------------|
| name | Requerido, min 2 caracteres |
| email | Formato valido, unico |
| phone | Formato valido |
| identification_number | Unico |

### Reglas de Negocio

1. **Eliminacion de Vehiculos**:
   - No se puede eliminar si status = 'rented'
   - No se puede eliminar si tiene rentas activas

2. **Eliminacion de Clientes**:
   - No se puede eliminar si tiene rentas activas
   - No se puede eliminar si tiene pagos pendientes

3. **Busqueda de Vehiculos**:
   - Busca en: make, model, license_plate, VIN, color

---

## COMANDOS DE DESARROLLO

### Frontend
```bash
cd frontend
npm install        # Instalar dependencias
npm run dev        # Servidor desarrollo (localhost:5173)
npm run build      # Build produccion
npm run preview    # Preview build
```

### Backend
```bash
cd backend
npm install        # Instalar dependencias
npm run dev        # Servidor desarrollo (localhost:3000)
npm run build      # Compilar TypeScript
npm run seed       # Ejecutar seeders
npm start          # Servidor produccion
```

### Base de Datos
```bash
# Crear base de datos
psql -U postgres
CREATE DATABASE movicar_db;

# Las tablas se crean automaticamente con Sequelize sync
```

---

## VARIABLES DE ENTORNO

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
DEFAULT_CLEANING_COST=50
DEFAULT_INVOICE_DUE_DAYS=7
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_GOOGLE_MAPS_API_KEY=tu_api_key_aqui
```

---

## MCP SERVERS (CLAUDE CODE)

### Servidores Disponibles
| Servidor | Proposito |
|----------|-----------|
| postgres-movicar-readonly | Solo lectura (SELECT) |
| postgres-movicar-write | Lectura/Escritura (CRUD) |

### Configuracion (.mcp.json)
```json
{
  "mcpServers": {
    "postgres-movicar-readonly": {
      "command": "node",
      "args": [
        "mcp-postgres-read.js",
        "postgresql://postgres:postgres123@localhost:5432/movicar_db"
      ]
    }
  }
}
```

### Herramientas MCP
- `query` - Ejecutar SELECT
- `list_tables` - Listar tablas
- `describe_table` - Estructura de tabla
- `execute_sql` - Ejecutar cualquier SQL
- `execute_transaction` - Transacciones

---

## HISTORIAL DE DESARROLLO

### Chat 1 - Fundamentos
- Autenticacion (Login/Logout)
- Dashboard principal
- Gestion de Vehiculos
- Gestion de Clientes
- Sistema de temas Dark/Light
- Layout responsive

### Chat 2 - Flujo Operacional
- Modulo de Rentas (CRUD)
- Modulo de Devoluciones
- Modulo de Pagos
- Modulo de Facturas

### Chat 3 - Inventario Generico
- Sistema multi-categoria
- Tracking GPS con Google Maps
- Generacion de documentos PDF
- Historial de movimientos
- Timeline visual

### Chat 4 - Sidebar y Roles
- Submenus expandibles
- 12 roles especificos
- Filtrado por roles
- Modulo Usuarios

### Chat 5 - Correcciones (En Progreso)
- Fase 1: Desbloqueadores auth (completado)
- Fase 2: Funcionalidad core (completado)
- Fase 3: Validaciones UX (completado)
- Fase 4: Mejoras polish (pendiente)

---

## GUIA DE ESTILO

### Colores Principales
| Color | Hex | Uso |
|-------|-----|-----|
| Purple Primary | #8b5cf6 | Acciones principales |
| Purple Light | #a78bfa | Hover states |
| Purple Dark | #7c3aed | Active states |
| Success | #10b981 | Confirmaciones |
| Error | #ef4444 | Errores |
| Warning | #f59e0b | Advertencias |
| Info | #3b82f6 | Informacion |

### Tipografia
- Font: "Poppins", sans-serif
- H1: 2.5rem / 700 weight
- H2: 2rem / 700 weight
- H3: 1.75rem / 700 weight
- Body: 0.875rem / 400 weight

### Bordes
- Cards: 24px radius
- Buttons: 12px radius
- Inputs: 12px radius

---

## CHECKLIST DE VERIFICACION

### Autenticacion
- [x] Login con credenciales correctas
- [x] Token en HTTP-only cookies
- [x] Logout invalida tokens
- [x] Refresh token funcional

### Dashboard
- [x] KPIs muestran datos reales
- [x] Graficas funcionales
- [x] Estado de error con retry
- [x] Loading states

### Vehiculos
- [x] CRUD completo
- [x] Validacion VIN unico
- [x] Formulario edicion pre-poblado
- [x] Busqueda incluye VIN
- [x] No eliminar si rentado

### Clientes
- [x] CRUD completo
- [x] Roles actualizados (12 roles)
- [x] No eliminar con rentas activas
- [x] No eliminar con pagos pendientes

### Temas
- [x] Dark mode funcional
- [x] Light mode funcional
- [x] Persistencia en localStorage
- [x] Toggle en header

---

## CONTACTO

**Desarrollador**: Cesar
**Proyecto**: MOVICAR ERP
**Ultima Actualizacion**: Enero 2026

---

*Este documento contiene toda la documentacion consolidada del proyecto MOVICAR.*
