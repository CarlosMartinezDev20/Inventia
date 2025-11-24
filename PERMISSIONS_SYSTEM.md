# Sistema de Permisos por Roles - Inventia

## Descripción General

Sistema de control de acceso basado en roles (RBAC) implementado en el frontend de Inventia para gestionar permisos de vistas y acciones según el rol del usuario.

## Roles Disponibles

### 1. ADMIN (Administrador)
- **Descripción**: Acceso completo al sistema
- **Vistas permitidas**:
  - Dashboard
  - Productos
  - Inventario
  - Órdenes de Compra
  - Órdenes de Venta
  - Clientes
  - Proveedores
  - Configuración (todas las secciones)

- **Acciones permitidas**:
  - Productos: crear, leer, actualizar, eliminar
  - Inventario: crear, leer, actualizar, eliminar, ajustar
  - Órdenes de Compra: crear, leer, actualizar, eliminar, recibir
  - Órdenes de Venta: crear, leer, actualizar, eliminar, completar
  - Clientes: crear, leer, actualizar, eliminar
  - Proveedores: crear, leer, actualizar, eliminar
  - Configuración: gestionar categorías, almacenes y usuarios

### 2. MANAGER (Gerente)
- **Descripción**: Gestión de operaciones y reportes
- **Vistas permitidas**:
  - Dashboard
  - Productos
  - Inventario
  - Órdenes de Compra
  - Órdenes de Venta
  - Clientes
  - Proveedores

- **Acciones permitidas**:
  - Productos: crear, leer, actualizar
  - Inventario: leer, ajustar
  - Órdenes de Compra: crear, leer, actualizar, recibir
  - Órdenes de Venta: crear, leer, actualizar, completar
  - Clientes: crear, leer, actualizar
  - Proveedores: crear, leer, actualizar

- **Restricciones**:
  - No puede eliminar productos, clientes o proveedores
  - No puede eliminar órdenes
  - No tiene acceso a Configuración

### 3. CLERK (Vendedor)
- **Descripción**: Consulta y ventas básicas
- **Vistas permitidas**:
  - Dashboard
  - Productos (solo lectura)
  - Inventario (solo consulta)
  - Órdenes de Venta
  - Clientes (solo lectura)

- **Acciones permitidas**:
  - Productos: leer
  - Inventario: leer
  - Órdenes de Venta: crear, leer
  - Clientes: leer

- **Restricciones**:
  - No puede modificar productos ni inventario
  - No puede crear ni modificar clientes
  - No tiene acceso a Órdenes de Compra
  - No tiene acceso a Proveedores
  - No tiene acceso a Configuración

## Implementación Técnica

### Archivo Principal: `permissions.js`

Clase `PermissionsManager` que gestiona:
- Definición de permisos por rol
- Verificación de acceso a vistas
- Verificación de acceso a acciones
- Filtrado de elementos del DOM
- Mensajes de error personalizados

### Métodos Principales

```javascript
// Verificar acceso a una vista
permissions.canAccessView('products') // true/false

// Verificar acceso a una acción específica
permissions.canPerformAction('products', 'delete') // true/false

// Verificar acceso a sección de configuración
permissions.canAccessSettingsSection('users') // true/false

// Obtener vistas permitidas
permissions.getAllowedViews() // ['dashboard', 'products', ...]

// Aplicar permisos al sidebar (ocultar items no permitidos)
permissions.applyViewPermissions()

// Obtener información completa de permisos
permissions.getUserPermissionsInfo()

// Obtener etiqueta amigable del rol
permissions.getRoleLabel('ADMIN') // 'Administrador'

// Obtener descripción del rol
permissions.getRoleDescription('CLERK') // 'Consulta y ventas básicas'
```

### Integración en el Sistema

#### 1. Router (`router.js`)
- Verifica permisos antes de renderizar cada vista
- Redirige al dashboard si el usuario no tiene acceso
- Muestra mensaje de error en toast

#### 2. App (`app.js`)
- Aplica permisos al sidebar al iniciar sesión
- Muestra etiqueta amigable del rol del usuario

#### 3. Vistas
- Ocultan botones de acción según permisos
- Verifican permisos antes de ejecutar operaciones
- Muestran solo las opciones permitidas

#### 4. Settings (`settings.js`)
- Muestra solo pestañas permitidas según el rol
- Categorías: Solo ADMIN
- Almacenes: Solo ADMIN
- Usuarios: Solo ADMIN
- Acerca de: Todos los roles

## Flujo de Verificación

```
Usuario intenta acceder a una vista
    ↓
Router verifica: permissions.canAccessView(viewName)
    ↓
¿Tiene permiso?
    ↓ Sí              ↓ No
Renderiza vista    Muestra error y redirige a dashboard
    ↓
Vista renderiza botones según permisos
    ↓
Usuario intenta realizar acción
    ↓
Vista verifica: permissions.canPerformAction(view, action)
    ↓
¿Tiene permiso?
    ↓ Sí              ↓ No
Ejecuta acción    Muestra mensaje de error
```

## Seguridad

⚠️ **IMPORTANTE**: Este sistema de permisos es solo de UI (frontend). El backend debe implementar su propia validación de permisos para garantizar la seguridad real del sistema.

El sistema frontend:
- ✅ Mejora la experiencia de usuario
- ✅ Evita confusión mostrando solo opciones permitidas
- ✅ Proporciona feedback inmediato
- ❌ NO es una medida de seguridad definitiva
- ❌ Puede ser bypasseado por usuarios técnicos

## Personalización

Para agregar nuevos permisos:

1. Modificar `rolePermissions` en `permissions.js`:
```javascript
ADMIN: {
  views: [...existentes, 'nueva-vista'],
  actions: {
    'nueva-vista': ['crear', 'leer', 'actualizar', 'eliminar']
  }
}
```

2. Usar en vistas:
```javascript
${permissions.canAccessView('nueva-vista') ? '...' : ''}
${permissions.canPerformAction('nueva-vista', 'crear') ? '...' : ''}
```

## Mensajes de Usuario

El sistema utiliza mensajes amigables:
- "No tienes permiso para acceder a esta vista"
- "No tienes permiso para realizar esta acción"
- "Esta función solo está disponible para administradores"
- "Esta función solo está disponible para gerentes y administradores"

## Etiquetas de Roles en Español

- `ADMIN` → "Administrador"
- `MANAGER` → "Gerente"
- `CLERK` → "Vendedor"

## Testing

Para probar el sistema:
1. Iniciar sesión con diferentes usuarios de cada rol
2. Verificar que solo aparecen las vistas permitidas en el sidebar
3. Verificar que los botones de acción se muestran según permisos
4. Intentar acceder directamente a vistas no permitidas (hash URL)
5. Verificar mensajes de error apropiados

## Compatibilidad

El sistema es compatible con:
- Todas las vistas existentes
- Sistema de autenticación actual
- API del backend
- Estructura de roles de Prisma

---

**Versión**: 1.0.0  
**Fecha**: Noviembre 2025  
**Autor**: Sistema Inventia
