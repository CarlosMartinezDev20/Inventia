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
        if (roleEl) roleEl.textContent = user.role || '';
      }

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
    const errorDiv = document.getElementById('login-error');
    const submitBtn = form.querySelector('button[type="submit"]');
    const emailInput = form.email;
    const passwordInput = form.password;

    // Deshabilitar temporalmente
    submitBtn.disabled = true;
    emailInput.disabled = true;
    passwordInput.disabled = true;
    submitBtn.textContent = 'Iniciando sesión...';
    if (errorDiv) errorDiv.style.display = 'none';

    try {
      await auth.login(email, password);

      const user = auth.getCurrentUser();
      if (user) {
        const nameEl = document.getElementById('user-name');
        const roleEl = document.getElementById('user-role');
        if (nameEl) nameEl.textContent = user.fullName || '';
        if (roleEl) roleEl.textContent = user.role || '';
        utils.showToast(`¡Bienvenido, ${user.fullName}!`, 'success');
      }

      // Resetear formulario antes de cambiar pantalla
      form.reset();

      // Mostrar app y navegar
      this.checkAuth();
      router.navigate('dashboard');
    } catch (error) {
      console.error('Login error:', error);
      if (errorDiv) {
        errorDiv.textContent =
          error?.message || 'Error al iniciar sesión. Verifica tus credenciales.';
        errorDiv.style.display = 'block';
      }
      emailInput.focus();
    } finally {
      // Rehabilitar siempre
      submitBtn.disabled = false;
      emailInput.disabled = false;
      passwordInput.disabled = false;
      submitBtn.textContent = 'Iniciar Sesión';
    }
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
