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


  _encode(str) {
    return btoa(encodeURIComponent(str));
  }

  _decode(str) {
    try {
      return decodeURIComponent(atob(str));
    } catch {
      return null;
    }
  }

  // Guardar credenciales para recordar sesión
  saveRememberedCredentials(email, password) {
    localStorage.setItem('rememberedEmail', this._encode(email));
    localStorage.setItem('rememberedPass', this._encode(password));
    localStorage.setItem('rememberSession', 'true');
  }

  // Obtener credenciales guardadas
  getRememberedCredentials() {
    const remember = localStorage.getItem('rememberSession');
    if (remember !== 'true') return null;

    const email = localStorage.getItem('rememberedEmail');
    const pass = localStorage.getItem('rememberedPass');

    if (!email || !pass) return null;

    return {
      email: this._decode(email),
      password: this._decode(pass)
    };
  }

  // Limpiar credenciales guardadas
  clearRememberedCredentials() {
    localStorage.removeItem('rememberedEmail');
    localStorage.removeItem('rememberedPass');
    localStorage.removeItem('rememberSession');
  }

  // Login
  async login(email, password, rememberSession = false) {
    const response = await api.login(email, password);
    localStorage.setItem('authToken', response.accessToken);
    localStorage.setItem('currentUser', JSON.stringify(response.user));
    this.currentUser = response.user;

    // Guardar credenciales si se marcó recordar
    if (rememberSession) {
      this.saveRememberedCredentials(email, password);
    } else {
      this.clearRememberedCredentials();
    }

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

    // Reset y habilitación "agresiva"
    const loginForm = document.getElementById('login-form');
    const emailInput = loginForm?.querySelector('#email');
    const passwordInput = loginForm?.querySelector('#password');
    const rememberCheckbox = loginForm?.querySelector('#remember-session');
    const submitBtn = loginForm?.querySelector('button[type="submit"]');

    if (loginForm) loginForm.reset();

    // Restaurar credenciales si el usuario tenía "Recordarme" activado
    const remembered = this.getRememberedCredentials();
    if (remembered && remembered.email) {
      if (emailInput) emailInput.value = remembered.email;
      if (passwordInput) passwordInput.value = remembered.password;
      if (rememberCheckbox) rememberCheckbox.checked = true;
    }

    [emailInput, passwordInput, submitBtn].forEach((el) => {
      if (!el) return;
      el.disabled = false;
      el.removeAttribute('disabled');
      el.removeAttribute?.('readonly');
      el.tabIndex = 0;
    });
    if (passwordInput) passwordInput.type = 'password';

    // Limpiar íconos de contraseña (soporte para diseño antiguo y moderno)
    const eyeIcon = document.getElementById('eye-icon') || document.querySelector('.eye-icon');
    const eyeOffIcon = document.getElementById('eye-off-icon') || document.querySelector('.eye-off-icon');
    if (eyeIcon) eyeIcon.style.display = 'block';
    if (eyeOffIcon) eyeOffIcon.style.display = 'none';

    // NO hacer autofocus tras logout - dejar que el usuario haga clic cuando quiera
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
