// Configuración de la aplicación
const CONFIG = {
  // URL del backend - ajusta según tu configuración
  API_BASE_URL: 'https://inventory-backend-v2.onrender.com',
  
  // Configuración de la app
  APP_NAME: 'Inventia',
  APP_VERSION: '1.0.0',
  
  // Configuración de paginación
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
  
  // Configuración de toasts
  TOAST_DURATION: 4000,
  
  // Roles
  ROLES: {
    ADMIN: 'ADMIN',
    MANAGER: 'MANAGER',
    CLERK: 'CLERK'
  },
  
  // Estados de órdenes
  ORDER_STATUS: {
    PURCHASE: {
      DRAFT: 'DRAFT',
      ORDERED: 'ORDERED',
      RECEIVED: 'RECEIVED',
      CANCELLED: 'CANCELLED'
    },
    SALES: {
      DRAFT: 'DRAFT',
      CONFIRMED: 'CONFIRMED',
      FULFILLED: 'FULFILLED',
      CANCELLED: 'CANCELLED'
    }
  },
  
  // Tipos de movimientos
  MOVEMENT_TYPES: {
    IN: 'IN',
    OUT: 'OUT',
    ADJUST: 'ADJUST'
  },
  
  // Unidades de productos
  PRODUCT_UNITS: {
    EA: 'Unidad',
    BOX: 'Caja',
    KG: 'Kilogramo',
    L: 'Litro'
  }
};

// Hacer CONFIG global
window.CONFIG = CONFIG;
