// app.js
// Aplicación principal
class App {
  constructor() {
    this.initialized = false;
    this.handleLoginBound = null;
    this.handleLogoutBound = null;
    this.keydownBound = null;
    this.routes = {};
  }

  // Inicializar la aplicación
  async init() {
    if (this.initialized) return;

    this.registerRoutes();
    this.checkAuth();
    this.setupEventListeners();

    this.initialized = true;
    console.log('App initialized');
  }

  // Verificar autenticación
  checkAuth() {
    const loginScreen = document.getElementById('login-screen');
    const appScreen = document.getElementById('app-screen');

    // Siempre cerrar sesión al iniciar la app
    if (!this.initialized) {
      auth.logout();
    }

    if (auth.isAuthenticated()) {
      // Mostrar aplicación
      loginScreen.classList.remove('active');
      appScreen.classList.add('active');

      // Info de usuario
      const user = auth.getCurrentUser();
      if (user) {
        const nameEl = document.getElementById('user-name');
        const roleEl = document.getElementById('user-role');
        if (nameEl) nameEl.textContent = user.fullName || '';
        if (roleEl) roleEl.textContent = permissions.getRoleLabel(user.role) || user.role;
      }

      // Aplicar permisos al sidebar
      permissions.applyViewPermissions();

      // Navegación
      const hash = window.location.hash.slice(1);
      if (hash && this.routes && this.routes[hash]) {
        router.handleRoute();
      } else {
        router.navigate('dashboard');
      }
    } else {
      // Mostrar login
      appScreen.classList.remove('active');
      loginScreen.classList.add('active');
      // Limpiar hash
      if (window.location.hash) window.location.hash = '';
      // Reenfocar login
      const loginForm = document.getElementById('login-form');
      const emailInput = loginForm?.querySelector('#email');
      requestAnimationFrame(() => {
        setTimeout(() => {
          emailInput?.focus();
          emailInput?.select?.();
        }, 0);
      });
    }
  }

  // Configurar event listeners globales
  setupEventListeners() {
    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      if (this.handleLoginBound) {
        loginForm.removeEventListener('submit', this.handleLoginBound);
      }
      this.handleLoginBound = async (e) => {
        e.preventDefault();
        await this.handleLogin(e.target);
      };
      loginForm.addEventListener('submit', this.handleLoginBound);
    }

    // Toggle password
    const togglePasswordBtn = document.getElementById('toggle-password');
    if (togglePasswordBtn && !togglePasswordBtn._bound) {
      togglePasswordBtn.addEventListener('click', () => {
        const passwordInput = document.getElementById('password');
        const eyeIcon = document.getElementById('eye-icon');
        const eyeOffIcon = document.getElementById('eye-off-icon');

        if (!passwordInput) return;
        if (passwordInput.type === 'password') {
          passwordInput.type = 'text';
          if (eyeIcon) eyeIcon.style.display = 'none';
          if (eyeOffIcon) eyeOffIcon.style.display = 'block';
        } else {
          passwordInput.type = 'password';
          if (eyeIcon) eyeIcon.style.display = 'block';
          if (eyeOffIcon) eyeOffIcon.style.display = 'none';
        }
        passwordInput.focus();
      });
      togglePasswordBtn._bound = true;
    }

    // Logout button (usar utils.confirm en lugar de window.confirm)
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      if (this.handleLogoutBound) {
        logoutBtn.removeEventListener('click', this.handleLogoutBound);
      }
      this.handleLogoutBound = async () => {
        const ok = await utils.confirm('¿Deseas cerrar sesión?', 'Cerrar sesión');
        if (ok) {
          auth.logout();
          this.checkAuth();
        }
      };
      logoutBtn.addEventListener('click', this.handleLogoutBound);
    }

    // Atajo teclado para cerrar sesión (Ctrl+Shift+L)
    if (this.keydownBound) {
      document.removeEventListener('keydown', this.keydownBound);
    }
    this.keydownBound = async (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'L') {
        e.preventDefault();
        if (auth.isAuthenticated()) {
          const ok = await utils.confirm('¿Deseas cerrar sesión?', 'Cerrar sesión');
          if (ok) {
            auth.logout();
            this.checkAuth();
          }
        }
      }
    };
    document.addEventListener('keydown', this.keydownBound);
  }

  // Manejar login
  async handleLogin(form) {
    const email = form.email.value;
    const password = form.password.value;
    const submitBtn = form.querySelector('button[type="submit"]');
    const emailInput = form.email;
    const passwordInput = form.password;

    // Validación básica
    if (!email || !password) {
      utils.showToast('Por favor completa todos los campos', 'warning', 'Campos requeridos');
      return;
    }

    // Deshabilitar temporalmente
    submitBtn.disabled = true;
    emailInput.disabled = true;
    passwordInput.disabled = true;
    const originalText = submitBtn.textContent;
    submitBtn.innerHTML = '<div class="btn-spinner"></div> Iniciando sesión...';

    try {
      await auth.login(email, password);

      const user = auth.getCurrentUser();
      if (user) {
        const nameEl = document.getElementById('user-name');
        const roleEl = document.getElementById('user-role');
        if (nameEl) nameEl.textContent = user.fullName || '';
        if (roleEl) roleEl.textContent = user.role || '';
        
        // Mensaje de bienvenida mejorado
        const greeting = this.getGreeting();
        utils.showToast(
          `Has iniciado sesión correctamente como ${user.role}`,
          'success',
          `${greeting}, ${user.fullName}!`,
          5000
        );
      }

      // Resetear formulario antes de cambiar pantalla
      form.reset();

      // Mostrar app y navegar
      this.checkAuth();
      router.navigate('dashboard');
    } catch (error) {
      console.error('Login error:', error);
      
      // Manejar diferentes tipos de errores
      let errorMessage = 'Error al iniciar sesión. Verifica tus credenciales.';
      let errorTitle = 'Error de autenticación';
      
      if (error?.message) {
        const msg = error.message.toLowerCase();
        
        if (msg.includes('unauthorized') || msg.includes('invalid credentials') || msg.includes('credenciales inválidas')) {
          errorMessage = 'Correo o contraseña incorrectos. Por favor verifica tus datos.';
          errorTitle = 'Credenciales incorrectas';
        } else if (msg.includes('not found') || msg.includes('no encontrado')) {
          errorMessage = 'No existe una cuenta con este correo electrónico.';
          errorTitle = 'Usuario no encontrado';
        } else if (msg.includes('network') || msg.includes('conexión')) {
          errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión.';
          errorTitle = 'Error de conexión';
        } else if (msg.includes('timeout')) {
          errorMessage = 'La solicitud tardó demasiado. Intenta nuevamente.';
          errorTitle = 'Tiempo agotado';
        } else {
          errorMessage = error.message;
        }
      }
      
      // Solo mostrar toast de error (sin mensaje en el formulario)
      utils.showToast(errorMessage, 'error', errorTitle, 6000);
      
      // Limpiar contraseña y enfocar
      passwordInput.value = '';
      passwordInput.focus();
    } finally {
      // Rehabilitar siempre
      submitBtn.disabled = false;
      emailInput.disabled = false;
      passwordInput.disabled = false;
      submitBtn.textContent = originalText;
    }
  }

  // Obtener saludo según hora del día
  getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return '¡Buenos días';
    if (hour < 19) return '¡Buenas tardes';
    return '¡Buenas noches';
  }

  // Registrar rutas
  registerRoutes() {
    this.routes = {
      dashboard: window.dashboardView,
      products: window.productsView,
      inventory: window.inventoryView,
      'purchase-orders': window.purchaseOrdersView,
      'sales-orders': window.salesOrdersView,
      customers: window.customersView,
      suppliers: window.suppliersView,
      settings: window.settingsView,
    };

    Object.keys(this.routes).forEach((path) => {
      router.register(path, this.routes[path]);
    });
  }
}

// Instancia global
window.app = new App();

// DOM listo
document.addEventListener('DOMContentLoaded', () => {
  window.app.init();
});
