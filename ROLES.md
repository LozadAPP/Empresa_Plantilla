# Sistema de Roles - MOVICAR

> Documentación completa del sistema de roles y permisos.

---

## Resumen de Roles (17 en total)

| ID | Rol | Descripción |
|----|-----|-------------|
| 1 | `admin` | Administrador del Sistema - Acceso total |
| 2 | `director` | Director con acceso a todas las ubicaciones |
| 3 | `manager` | Gerente con acceso por ubicación |
| 4 | `seller` | Vendedor (alias inglés) |
| 5 | `accountant` | Contador (alias inglés) |
| 6 | `inventory` | Encargado de inventario (alias inglés) |
| 121 | `director_general` | Director General - Gestión completa |
| 122 | `jefe_inventarios` | Jefe de Inventarios - CRUD vehículos |
| 123 | `jefe_ventas` | Jefe de Ventas - Rentas y clientes |
| 124 | `jefe_finanzas` | Jefe de Finanzas - Contabilidad y pagos |
| 125 | `jefe_admin` | Jefe Administrativo - Usuarios y config |
| 126 | `encargado_inventario` | Encargado de Inventario básico |
| 127 | `tecnico` | Técnico de Mantenimiento |
| 128 | `contador` | Contador - Ver finanzas |
| 129 | `cajero` | Cajero - Procesar pagos |
| 130 | `asistente_admin` | Asistente Administrativo |
| 131 | `vendedor` | Vendedor - Crear rentas y clientes |

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

> **Nota:** Las operaciones tienen validación a nivel de autenticación. Se recomienda agregar roles específicos en producción.

---

### FINANZAS

| Módulo | Endpoint | Roles Permitidos |
|--------|----------|------------------|
| **Reportes** | `/api/reports/*` | `admin`, `director`, `accountant` |
| **Contabilidad** | `/api/accounting/*` | `admin`, `director`, `accountant` |
| **Alertas** | `/api/alerts/*` | Todos (autenticados) |

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
| **Lectura** | `GET /api/users/*` | `admin`, `director`, `manager` |
| **Escritura** | `POST/PUT /api/users/*` | `admin`, `director` |

#### Configuración

| Operación | Endpoint | Roles Permitidos |
|-----------|----------|------------------|
| **Todo** | `/api/config/*` | `admin`, `director_general` |

#### Auditoría

| Operación | Endpoint | Roles Permitidos |
|-----------|----------|------------------|
| **Lectura** | `GET /api/audit/*` | `admin`, `director` |

---

## Roles por Área Funcional

### Área de Inventario
- `jefe_inventarios` - Gestión completa de vehículos
- `encargado_inventario` - Operaciones básicas de inventario
- `tecnico` - Mantenimiento de vehículos

### Área de Ventas
- `jefe_ventas` - Supervisión de ventas y clientes
- `vendedor` - Crear rentas y clientes

### Área de Finanzas
- `jefe_finanzas` - Gestión financiera completa
- `contador` - Contabilidad y reportes
- `cajero` - Procesamiento de pagos

### Área Administrativa
- `jefe_admin` - Configuración y usuarios
- `asistente_admin` - Soporte administrativo (solo lectura)

### Alta Dirección
- `admin` - Acceso total al sistema
- `director_general` - Gestión completa multi-sede
- `director` - Acceso a todas las ubicaciones (alias)
- `manager` - Gerente por ubicación

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
- Ver todo
- Escribir en todo
- Eliminar registros

### `jefe_inventarios`
```json
["read:*", "write:vehicles", "write:maintenance", "read:reports"]
```
- Ver todo
- Gestionar vehículos
- Gestionar mantenimiento
- Ver reportes

### `jefe_ventas`
```json
["read:*", "write:rentals", "write:customers", "read:reports"]
```
- Ver todo
- Gestionar rentas
- Gestionar clientes
- Ver reportes

### `jefe_finanzas`
```json
["read:*", "write:payments", "write:accounting", "read:reports"]
```
- Ver todo
- Gestionar pagos
- Gestionar contabilidad
- Ver reportes

### `jefe_admin`
```json
["read:*", "write:users", "write:config", "read:audit"]
```
- Ver todo
- Gestionar usuarios
- Gestionar configuración
- Ver auditoría

### `vendedor`
```json
["read:*", "write:rentals", "write:customers"]
```
- Ver todo
- Crear/editar rentas
- Crear/editar clientes

### `tecnico`
```json
["read:vehicles", "read:maintenance", "write:maintenance"]
```
- Ver vehículos
- Ver y gestionar mantenimiento

### `contador`
```json
["read:*", "read:reports", "read:accounting"]
```
- Ver todo (solo lectura)
- Ver reportes
- Ver contabilidad

### `cajero`
```json
["read:rentals", "read:customers", "write:payments"]
```
- Ver rentas
- Ver clientes
- Procesar pagos

### `asistente_admin`
```json
["read:*"]
```
- Solo lectura en todo el sistema

---

## Notas Importantes

1. **Todos los endpoints requieren autenticación** - El usuario debe estar logueado.

2. **Roles sin restricción específica** - Dashboard, Rentas, Devoluciones, Pagos e Inventario Genérico permiten acceso a cualquier usuario autenticado.

3. **Duplicados de nombres** - Existen versiones en inglés (`seller`, `accountant`, `inventory`) y español (`vendedor`, `contador`, `encargado_inventario`) para compatibilidad.

4. **Auditoría** - Todas las acciones se registran en `audit_log` para trazabilidad.

---

**Última actualización:** Enero 2026
**Total de roles:** 17
