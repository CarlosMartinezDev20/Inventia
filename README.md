# Sistema de Gestión de Inventario - Frontend Desktop

Aplicación de escritorio construida con Electron, HTML, CSS y JavaScript vanilla para gestionar el inventario de productos.

## 🚀 Características

- ✅ **Autenticación** con JWT
- 📦 **Gestión de Productos** - CRUD completo con categorías
- 📊 **Control de Inventario** - Niveles de stock por almacén
- 🛒 **Órdenes de Compra** - Gestión de compras a proveedores
- 💰 **Órdenes de Venta** - Gestión de ventas a clientes
- 👥 **Clientes y Proveedores** - Directorio completo
- ⚙️ **Configuración** - Categorías, almacenes y usuarios
- 📈 **Dashboard** - Resumen general del sistema

## 🎨 Diseño

Interfaz limpia y minimalista inspirada en diseños modernos:
- Sidebar oscuro con navegación intuitiva
- Tarjetas y tablas con sombras sutiles
- Modales para formularios
- Notificaciones toast
- Diseño responsive

## 📋 Requisitos Previos

- Node.js 18+
- Backend API corriendo en `http://localhost:3000`

## 🛠️ Instalación

```bash
cd inventory-frontend
npm install
```

## 🏃 Ejecución

### Modo desarrollo (con logs)
```bash
npm run dev
```

### Modo producción
```bash
npm start
```

## 🔐 Credenciales de Prueba

Una vez que el backend esté corriendo con datos seed:

- **Admin**: `admin@local` / `Admin123!`
- **Manager**: `manager@local` / `Manager123!`

## ⚙️ Configuración

El archivo `js/config.js` contiene la configuración de la aplicación:

```javascript
const CONFIG = {
  API_BASE_URL: 'http://localhost:3000',  // Cambia si tu backend está en otra URL
  // ... otras configuraciones
};
```

## 📁 Estructura del Proyecto

```
inventory-frontend/
├── main.js                 # Proceso principal de Electron
├── preload.js              # Script de preload
├── index.html              # HTML principal
├── styles/
│   ├── main.css           # Estilos base
│   ├── sidebar.css        # Estilos del sidebar
│   └── components.css     # Componentes reutilizables
├── js/
│   ├── config.js          # Configuración
│   ├── api.js             # Cliente API
│   ├── auth.js            # Gestión de autenticación
│   ├── utils.js           # Utilidades
│   ├── router.js          # Router SPA
│   ├── app.js             # Aplicación principal
│   └── views/
│       ├── dashboard.js   # Vista Dashboard
│       ├── products.js    # Vista Productos
│       ├── inventory.js   # Vista Inventario
│       ├── purchase-orders.js
│       ├── sales-orders.js
│       ├── customers.js
│       ├── suppliers.js
│       └── settings.js
└── package.json
```

## 🔄 Flujo de Trabajo

### 1. Login
- Inicia sesión con tu usuario
- El token JWT se guarda en `localStorage`
- Redirige al Dashboard

### 2. Dashboard
- Visualiza estadísticas generales
- Productos con stock bajo
- Movimientos recientes

### 3. Productos
- CRUD completo de productos
- Filtros por categoría, nombre, SKU
- Indicador de stock bajo

### 4. Inventario
- Niveles de stock por producto y almacén
- Ajustes manuales de inventario
- Filtros por almacén y producto

### 5. Órdenes de Compra
- Crear órdenes a proveedores
- Marcar como ordenada
- Recibir mercancía (actualiza inventario automáticamente)

### 6. Órdenes de Venta
- Crear órdenes para clientes
- Confirmar órdenes
- Completar órdenes (descuenta inventario automáticamente)

### 7. Clientes y Proveedores
- Directorio completo
- CRUD según permisos

### 8. Configuración
- Gestión de categorías
- Gestión de almacenes
- Gestión de usuarios (solo ADMIN)

## 🔒 Roles y Permisos

### ADMIN
- Acceso completo a todas las funciones
- Crear/editar/eliminar usuarios
- Eliminar productos, categorías, etc.

### MANAGER
- Gestión operativa
- Crear/editar productos, órdenes, etc.
- No puede gestionar usuarios

### CLERK
- Solo lectura
- Ver productos, inventario, órdenes
- No puede crear ni editar

## 🎯 Funcionalidades Técnicas

### API Client
- Cliente REST centralizado
- Manejo automático de autenticación
- Gestión de errores
- Tokens JWT en headers

### Router SPA
- Navegación sin recargar página
- Hash-based routing
- Actualización automática del sidebar

### Componentes
- Modales reutilizables
- Notificaciones toast
- Tablas con paginación
- Filtros y búsqueda
- Confirmaciones

### Utilidades
- Formateo de moneda y números
- Formateo de fechas
- Validaciones
- Debouncing
- Helpers de UI

## 🐛 Solución de Problemas

### Error de conexión al backend
```bash
# Verifica que el backend esté corriendo
# En la carpeta inventory-backend:
npm run start:dev
```

### Puerto en uso
```powershell
# Windows PowerShell
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess
Stop-Process -Id <PID>
```

### Limpiar cache de Electron
```powershell
Remove-Item -Recurse -Force $env:APPDATA\inventory-frontend
```

## 📝 Notas de Desarrollo

- La aplicación usa JavaScript vanilla (sin frameworks)
- Electron permite empaquetarla como app nativa
- Los estilos son CSS puro con variables CSS
- El router es un sistema SPA simple pero funcional

## 🚢 Empaquetado (Futuro)

Para crear ejecutables:

```bash
npm install --save-dev electron-builder
```

Agregar a `package.json`:
```json
"build": {
  "appId": "com.inventory.app",
  "productName": "Inventario",
  "win": {
    "target": "nsis"
  }
}
```

Ejecutar:
```bash
npm run build
```

## 📄 Licencia

Uso interno - UNLICENSED

## 👨‍💻 Desarrollo

Desarrollado con ❤️ usando tecnologías web modernas y Electron.
