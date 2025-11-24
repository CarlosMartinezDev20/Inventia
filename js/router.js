// Router para navegación SPA
class Router {
  constructor() {
    this.routes = {};
    this.currentView = null;
    this.isNavigating = false;
    
    // Escuchar cambios en el hash
    window.addEventListener('hashchange', () => this.handleRoute());
  }

  // Registrar una ruta
  register(path, viewModule) {
    this.routes[path] = viewModule;
  }

  // Manejar la navegación
  async handleRoute() {
    // Evitar navegaciones múltiples simultáneas
    if (this.isNavigating) return;
    
    // Verificar autenticación
    if (!auth.isAuthenticated()) {
      console.log('Not authenticated, skipping navigation');
      return;
    }
    
    this.isNavigating = true;
    
    try {
      // Obtener el hash actual (ej: #products)
      const hash = window.location.hash.slice(1) || 'dashboard';
      const [path] = hash.split('?');
      
      // Verificar permisos de acceso a la vista
      if (path !== 'dashboard' && !permissions.canAccessView(path)) {
        console.warn(`Access denied to view: ${path}`);
        utils.showToast(
          permissions.getErrorMessage('noViewAccess'),
          'error',
          'Acceso denegado'
        );
        // Redirigir al dashboard
        this.navigate('dashboard');
        return;
      }
      
      // Buscar la vista correspondiente
      const viewModule = this.routes[path] || this.routes['dashboard'];
      
      if (!viewModule) {
        console.error(`No view found for: ${path}`);
        return;
      }

      // Actualizar navegación activa
      this.updateActiveNav(path);
      
      // Renderizar la vista con loading minimalista
      const container = document.getElementById('view-container');
      if (!container) {
        console.error('View container not found');
        return;
      }
      
      // Mostrar loading inmediatamente
      utils.showLoading(container);
      
      // Renderizar contenido
      await viewModule.render(container);
      this.currentView = path;
      
    } catch (error) {
      console.error('Error rendering view:', error);
      const container = document.getElementById('view-container');
      if (container) {
        container.innerHTML = `
          <div class="alert alert-danger">
            <div class="alert-content">
              <div class="alert-title">Error al cargar la vista</div>
              <div>${error.message}</div>
            </div>
          </div>
        `;
      }
    } finally {
      this.isNavigating = false;
    }
  }

  // Actualizar el item activo en la navegación
  updateActiveNav(path) {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
      if (item.dataset.view === path) {
        item.classList.add('active');
      }
    });
  }

  // Navegar a una ruta
  navigate(path) {
    window.location.hash = path;
  }

  // Obtener la vista actual
  getCurrentView() {
    return this.currentView;
  }
}

// Crear instancia global del router
window.router = new Router();
