# Sistema de Roles - MOVICAR

> Documentación del sistema de 12 roles y permisos.

---

## Resumen de Roles (12 en total)

| ID | Rol | Descripción | Área |
|----|-----|-------------|------|
| 1 | `admin` | Administrador del Sistema - Acceso total | Alta Dirección |
| 121 | `director_general` | Director General - Gestión completa multi-sede | Alta Dirección |
| 122 | `jefe_inventarios` | Jefe de Inventarios - CRUD vehículos | Inventario |
| 123 | `jefe_ventas` | Jefe de Ventas - Rentas y clientes | Ventas |
| 124 | `jefe_finanzas` | Jefe de Finanzas - Contabilidad y pagos | Finanzas |
| 125 | `jefe_admin` | Jefe Administrativo - Usuarios y config | Administración |
| 126 | `encargado_inventario` | Encargado de Inventario básico | Inventario |
| 127 | `tecnico` | Técnico de Mantenimiento | Inventario |
| 128 | `contador` | Contador - Ver finanzas | Finanzas |
| 129 | `cajero` | Cajero - Procesar pagos | Finanzas |
| 130 | `asistente_admin` | Asistente Administrativo | Administración |
| 131 | `vendedor` | Vendedor - Crear rentas y clientes | Ventas |

---

## Matriz de Acceso por Módulo

### PRINCIPAL

| Módulo | Endpoint | Operación | Roles Permitidos |
|--------|----------|-----------|------------------|
| **Dashboard** | `/api/dashboard/*` | Lectura | Todos (autenticados) |
| **Inventario Genérico** | `/api/inventory/*` | Lectura/Escritura | Todos (autenticados) |

### VEHÍCULOS

| Operación | Endpoint | Roles Permitidos |
|-----------|----------|------------------|
| Listar/Ver | `GET /api/vehicles` | Todos (autenticados) |
| Disponibles | `GET /api/vehicles/available` | Todos (autenticados) |
| Estadísticas | `GET /api/vehicles/statistics` | Todos (autenticados) |
| **Crear** | `POST /api/vehicles` | `admin`, `director_general`, `jefe_inventarios`, `encargado_inventario` |
| **Actualizar** | `PUT /api/vehicles/:id` | `admin`, `director_general`, `jefe_inventarios`, `encargado_inventario` |
| **Cambiar estado** | `PATCH /api/vehicles/:id/status` | `admin`, `director_general`, `jefe_inventarios`, `encargado_inventario`, `jefe_ventas`, `vendedor` |
| **Eliminar** | `DELETE /api/vehicles/:id` | `admin`, `director_general`, `jefe_admin` |

### CLIENTES

| Operación | Endpoint | Roles Permitidos |
|-----------|----------|------------------|
| Listar/Ver | `GET /api/customers` | Todos (autenticados) |
| Buscar | `GET /api/customers/search` | Todos (autenticados) |
| Estadísticas | `GET /api/customers/statistics` | Todos (autenticados) |
| **Crear** | `POST /api/customers` | `admin`, `director_general`, `jefe_ventas`, `vendedor` |
| **Actualizar** | `PUT /api/customers/:id` | `admin`, `director_general`, `jefe_ventas`, `vendedor` |
| **Activar/Desactivar** | `PATCH /api/customers/:id/toggle-active` | `admin`, `director_general`, `jefe_ventas`, `jefe_admin` |
| **Cambiar límite crédito** | `PATCH /api/customers/:id/credit-limit` | `admin`, `director_general`, `jefe_finanzas`, `contador` |
| **Eliminar** | `DELETE /api/customers/:id` | `admin`, `director_general`, `jefe_admin` |

---

### OPERACIONES

| Módulo | Endpoint | Operación | Roles Permitidos |
|--------|----------|-----------|------------------|
| **Rentas** | `/api/rentals/*` | CRUD completo | Todos (autenticados) |
| **Devoluciones** | `/api/returns/*` | CRUD completo | Todos (autenticados) |
| **Pagos** | `/api/payments/*` | CRUD completo | Todos (autenticados) |
| **Facturas** | `/api/invoices/*` | CRUD completo | Todos (autenticados) |

---

### FINANZAS

| Módulo | Endpoint | Roles Permitidos |
|--------|----------|------------------|
| **Reportes** | `/api/reports/*` | `admin`, `director_general`, `jefe_finanzas`, `jefe_ventas`, `contador` |
| **Contabilidad** | `/api/accounting/*` | `admin`, `director_general`, `jefe_finanzas`, `contador` |
| **Alertas (lectura)** | `GET /api/alerts/*` | `admin`, `director_general`, `jefe_finanzas`, `jefe_admin`, `contador`, `jefe_ventas` |
| **Alertas (escritura)** | `POST /api/alerts/*` | `admin`, `director_general`, `jefe_finanzas`, `jefe_admin` |

---

### ADMINISTRACIÓN

#### Mantenimiento

| Operación | Endpoint | Roles Permitidos |
|-----------|----------|------------------|
| **Lectura** | `GET /api/maintenance/*` | `admin`, `director_general`, `jefe_inventarios`, `jefe_admin`, `tecnico`, `encargado_inventario` |
| **Escritura** | `POST/PUT /api/maintenance/*` | `admin`, `director_general`, `jefe_inventarios`, `jefe_admin`, `tecnico` |
| **Admin** | `DELETE /api/maintenance/*` | `admin`, `director_general`, `jefe_inventarios`, `jefe_admin` |

#### Usuarios

| Operación | Endpoint | Roles Permitidos |
|-----------|----------|------------------|
| **Lectura** | `GET /api/users/*` | `admin`, `director_general`, `jefe_admin` |
| **Escritura** | `POST/PUT /api/users/*` | `admin`, `director_general` |

#### Configuración

| Operación | Endpoint | Roles Permitidos |
|-----------|----------|------------------|
| **Todo** | `/api/config/*` | `admin`, `director_general` |

#### Auditoría

| Operación | Endpoint | Roles Permitidos |
|-----------|----------|------------------|
| **Lectura** | `GET /api/audit/*` | `admin`, `director_general`, `jefe_admin` |

---

## Roles por Área Funcional

### Alta Dirección
- `admin` - Acceso total al sistema
- `director_general` - Gestión completa multi-sede

### Área de Inventario
- `jefe_inventarios` - Gestión completa de vehículos
- `encargado_inventario` - Operaciones básicas de inventario
- `tecnico` - Mantenimiento de vehículos

### Área de Ventas
- `jefe_ventas` - Supervisión de ventas y clientes
- `vendedor` - Crear rentas y clientes

### Área de Finanzas
- `jefe_finanzas` - Gestión financiera completa
- `contador` - Contabilidad y reportes (solo lectura)
- `cajero` - Procesamiento de pagos

### Área Administrativa
- `jefe_admin` - Configuración y usuarios
- `asistente_admin` - Soporte administrativo (solo lectura)

---

## Permisos por Rol (Detalle)

### `admin`
```json
["*"]
```
- Acceso total a todas las funciones del sistema

### `director_general`
```json
["read:*", "write:*", "delete:*"]
```
- Ver todo, escribir en todo, eliminar registros

### `jefe_inventarios`
```json
["read:*", "write:vehicles", "write:maintenance", "read:reports"]
```

### `jefe_ventas`
```json
["read:*", "write:rentals", "write:customers", "read:reports"]
```

### `jefe_finanzas`
```json
["read:*", "write:payments", "write:accounting", "read:reports"]
```

### `jefe_admin`
```json
["read:*", "write:users", "write:config", "read:audit"]
```

### `encargado_inventario`
```json
["read:vehicles", "write:vehicles", "read:maintenance"]
```

### `tecnico`
```json
["read:vehicles", "read:maintenance", "write:maintenance"]
```

### `vendedor`
```json
["read:*", "write:rentals", "write:customers"]
```

### `contador`
```json
["read:*", "read:reports", "read:accounting"]
```

### `cajero`
```json
["read:rentals", "read:customers", "write:payments"]
```

### `asistente_admin`
```json
["read:*"]
```
- Solo lectura en todo el sistema

---

## Usuarios de Prueba

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

---

## Notas Importantes

1. **Todos los endpoints requieren autenticación** - El usuario debe estar logueado.

2. **Auditoría** - Todas las acciones se registran en `audit_log` para trazabilidad.

3. **Admin siempre pasa** - El middleware de roles permite a `admin` acceder a cualquier ruta.

---

**Última actualización:** Febrero 2026
**Total de roles:** 12
