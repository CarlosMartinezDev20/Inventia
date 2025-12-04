// Sistema de permisos basado en roles
class PermissionsManager {
  constructor() {
    // Definición de permisos por rol
    this.rolePermissions = {
      ADMIN: {
        views: ['dashboard', 'products', 'inventory', 'purchase-orders', 'sales-orders', 'customers', 'suppliers', 'finances', 'settings'],
        actions: {
          products: ['create', 'read', 'update', 'delete'],
          inventory: ['create', 'read', 'update', 'delete', 'adjust'],
          'purchase-orders': ['create', 'read', 'update', 'delete', 'receive'],
          'sales-orders': ['create', 'read', 'update', 'delete', 'fulfill'],
          customers: ['create', 'read', 'update', 'delete'],
          suppliers: ['create', 'read', 'update', 'delete'],
          finances: ['create', 'read', 'update', 'delete', 'view-dashboard'],
          settings: ['manage-categories', 'manage-warehouses', 'manage-users'],
        }
      },
      MANAGER: {
        views: ['dashboard', 'products', 'inventory', 'purchase-orders', 'sales-orders', 'customers', 'suppliers', 'finances'],
        actions: {
          products: ['create', 'read', 'update'],
          inventory: ['read', 'adjust'],
          'purchase-orders': ['create', 'read', 'update', 'receive'],
          'sales-orders': ['create', 'read', 'update', 'fulfill'],
          customers: ['create', 'read', 'update'],
          suppliers: ['create', 'read', 'update'],
          finances: ['create', 'read', 'view-dashboard'],
        }
      },
      CLERK: {
        views: ['dashboard', 'products', 'inventory', 'sales-orders', 'customers'],
        actions: {
          products: ['read'],
          inventory: ['read'],
          'sales-orders': ['create', 'read'],
          customers: ['read'],
        }
      }
    };

    // Mensajes de error personalizados
    this.errorMessages = {
      noViewAccess: 'No tienes permiso para acceder a esta vista',
      noActionAccess: 'No tienes permiso para realizar esta acción',
      adminOnly: 'Esta función solo está disponible para administradores',
      managerOnly: 'Esta función solo está disponible para gerentes y administradores',
    };
  }

  // Obtener permisos del usuario actual
  getUserPermissions() {
    const user = auth.getCurrentUser();
    if (!user || !user.role) return null;
    return this.rolePermissions[user.role] || null;
  }

  // Verificar si el usuario puede acceder a una vista
  canAccessView(viewName) {
    const permissions = this.getUserPermissions();
    if (!permissions) return false;
    return permissions.views.includes(viewName);
  }

  // Verificar si el usuario puede realizar una acción
  canPerformAction(viewName, actionName) {
    const permissions = this.getUserPermissions();
    if (!permissions) return false;
    
    const viewActions = permissions.actions[viewName];
    if (!viewActions) return false;
    
    return viewActions.includes(actionName);
  }

  // Obtener vistas permitidas para el usuario actual
  getAllowedViews() {
    const permissions = this.getUserPermissions();
    return permissions ? permissions.views : [];
  }

  // Verificar si el usuario es admin
  isAdmin() {
    return auth.hasRole(CONFIG.ROLES.ADMIN);
  }

  // Verificar si el usuario es manager o admin
  canManage() {
    return auth.hasAnyRole([CONFIG.ROLES.ADMIN, CONFIG.ROLES.MANAGER]);
  }

  // Obtener el mensaje de error apropiado
  getErrorMessage(type = 'noViewAccess') {
    return this.errorMessages[type] || this.errorMessages.noViewAccess;
  }

  // Filtrar elementos del DOM según permisos
  applyViewPermissions() {
    const allowedViews = this.getAllowedViews();
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
      const viewName = item.dataset.view;
      if (!viewName) return;
      
      // Siempre mostrar dashboard
      if (viewName === 'dashboard') {
        item.style.display = '';
        return;
      }
      
      // Ocultar vistas no permitidas
      if (!allowedViews.includes(viewName)) {
        item.style.display = 'none';
      } else {
        item.style.display = '';
      }
    });
  }

  // Obtener descripción del rol
  getRoleDescription(role) {
    const descriptions = {
      ADMIN: 'Acceso completo al sistema',
      MANAGER: 'Gestión de operaciones y reportes',
      CLERK: 'Consulta y ventas básicas'
    };
    return descriptions[role] || 'Usuario';
  }

  // Obtener etiqueta amigable del rol
  getRoleLabel(role) {
    const labels = {
      ADMIN: 'Administrador',
      MANAGER: 'Gerente',
      CLERK: 'Vendedor'
    };
    return labels[role] || role;
  }

  // Decorador para acciones que requieren permisos
  requireAction(viewName, actionName, callback) {
    return async (...args) => {
      if (!this.canPerformAction(viewName, actionName)) {
        utils.showToast(
          this.getErrorMessage('noActionAccess'),
          'error',
          'Acceso denegado'
        );
        return;
      }
      return await callback(...args);
    };
  }

  // Verificar permisos de Settings según sección
  canAccessSettingsSection(section) {
    if (!this.canAccessView('settings')) return false;
    
    const permissions = this.getUserPermissions();
    if (!permissions) return false;
    
    const settingsActions = permissions.actions.settings || [];
    
    switch (section) {
      case 'categories':
        return settingsActions.includes('manage-categories');
      case 'warehouses':
        return settingsActions.includes('manage-warehouses');
      case 'users':
        return settingsActions.includes('manage-users');
      default:
        return false;
    }
  }

  // Obtener información completa de permisos del usuario
  getUserPermissionsInfo() {
    const user = auth.getCurrentUser();
    if (!user) return null;
    
    const permissions = this.getUserPermissions();
    if (!permissions) return null;
    
    return {
      role: user.role,
      roleLabel: this.getRoleLabel(user.role),
      description: this.getRoleDescription(user.role),
      views: permissions.views,
      actions: permissions.actions,
      isAdmin: this.isAdmin(),
      canManage: this.canManage(),
    };
  }
}

// Instancia global
window.permissions = new PermissionsManager();
