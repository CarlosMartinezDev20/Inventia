// auth.js
// Gestión de autenticación
class AuthManager {
  constructor() {
    this.currentUser = null;
    this.loadCurrentUser();
  }

  // Cargar usuario actual del localStorage
  loadCurrentUser() {
    const userJson = localStorage.getItem('currentUser');
    if (!userJson) return;
    try {
      this.currentUser = JSON.parse(userJson);
    } catch (error) {
      console.error('Error loading user:', error);
      this.logout();
    }
  }

  // Login
  async login(email, password) {
    const response = await api.login(email, password);
    localStorage.setItem('authToken', response.accessToken);
    localStorage.setItem('currentUser', JSON.stringify(response.user));
    this.currentUser = response.user;
    return response;
  }

  // Logout
  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    this.currentUser = null;

    // Limpiar vista actual
    const container = document.getElementById('view-container');
    if (container) container.innerHTML = '';

    // Mostrar pantalla de login
    const loginScreen = document.getElementById('login-screen');
    const appScreen = document.getElementById('app-screen');

    if (!loginScreen || !appScreen) return;

    // Cambiar pantallas
    appScreen.classList.remove('active');
    loginScreen.classList.add('active');

    // Reset y habilitación “agresiva”
    const loginForm = document.getElementById('login-form');
    const emailInput = loginForm?.querySelector('#email');
    const passwordInput = loginForm?.querySelector('#password');
    const submitBtn = loginForm?.querySelector('button[type="submit"]');

    if (loginForm) loginForm.reset();

    [emailInput, passwordInput, submitBtn].forEach((el) => {
      if (!el) return;
      el.disabled = false;
      el.removeAttribute('disabled');
      el.removeAttribute?.('readonly');
      el.tabIndex = 0;
    });
    if (passwordInput) passwordInput.type = 'password';

    // Limpiar errores e íconos
    const errorDiv = document.getElementById('login-error');
    if (errorDiv) {
      errorDiv.style.display = 'none';
      errorDiv.textContent = '';
    }
    const eyeIcon = document.getElementById('eye-icon');
    const eyeOffIcon = document.getElementById('eye-off-icon');
    if (eyeIcon) eyeIcon.style.display = 'block';
    if (eyeOffIcon) eyeOffIcon.style.display = 'none';

    // Reenfocar robusto (evita bug de foco tras diálogos nativos)
    const refocus = () => {
      window.focus();
      document.body?.focus?.();
      emailInput?.focus();
      emailInput?.select?.();
    };
    // Una pasada inmediata, una en el próximo frame y otra tras un pequeño delay
    refocus();
    requestAnimationFrame(refocus);
    setTimeout(refocus, 50);
    setTimeout(refocus, 150);
  }

  // Verificar si está autenticado
  isAuthenticated() {
    return !!localStorage.getItem('authToken');
  }

  // Usuario actual
  getCurrentUser() {
    return this.currentUser;
  }

  // Roles
  hasRole(role) {
    return this.currentUser && this.currentUser.role === role;
  }

  hasAnyRole(roles) {
    return this.currentUser && roles.includes(this.currentUser.role);
  }

  isAdmin() {
    return this.hasRole(CONFIG.ROLES.ADMIN);
  }

  canManage() {
    return this.hasAnyRole([CONFIG.ROLES.ADMIN, CONFIG.ROLES.MANAGER]);
  }
}

// Instancia global
window.auth = new AuthManager();
