// login-modern.js
// Funcionalidad del login moderno animado

document.addEventListener('DOMContentLoaded', () => {
  // Toggle password visibility
  const togglePasswordBtn = document.getElementById('toggle-password');
  const passwordInput = document.getElementById('password');

  if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener('click', function(e) {
      e.preventDefault();
      
      const eyeIcon = this.querySelector('.eye-icon');
      const eyeOffIcon = this.querySelector('.eye-off-icon');
      
      if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        if (eyeIcon) eyeIcon.style.display = 'none';
        if (eyeOffIcon) eyeOffIcon.style.display = 'block';
      } else {
        passwordInput.type = 'password';
        if (eyeIcon) eyeIcon.style.display = 'block';
        if (eyeOffIcon) eyeOffIcon.style.display = 'none';
      }
    });
  }

  // Animación del botón de login al hacer submit
  const loginForm = document.getElementById('login-form');
  const loginBtn = document.getElementById('login-btn-modern');
  const btnText = loginBtn?.querySelector('.btn-text');
  const btnLoader = loginBtn?.querySelector('.btn-loader');

  if (loginForm && loginBtn && btnText && btnLoader) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Mostrar loader
      btnText.style.opacity = '0';
      btnText.style.transform = 'translateY(-20px)';
      btnLoader.style.display = 'flex';
      btnLoader.style.opacity = '0';
      btnLoader.style.transform = 'translateY(20px)';
      
      setTimeout(() => {
        btnLoader.style.opacity = '1';
        btnLoader.style.transform = 'translateY(0)';
      }, 10);
      
      loginBtn.disabled = true;

      // Petición de login usando el AuthManager existente
      try {
        const email = document.getElementById('email')?.value;
        const password = document.getElementById('password')?.value;
        const rememberSession = document.getElementById('remember-session')?.checked;

        // Usar el AuthManager global (window.auth)
        if (window.auth) {
          await window.auth.login(email, password, rememberSession);
          
          // Cambiar a la pantalla de la app
          const loginScreen = document.getElementById('login-screen');
          const appScreen = document.getElementById('app-screen');
          
          if (loginScreen && appScreen) {
            loginScreen.classList.remove('active');
            appScreen.classList.add('active');
          }
          
          // Si existe router, navegar al dashboard
          if (window.router) {
            window.router.navigate('dashboard');
          }
        } else {
          throw new Error('Sistema de autenticación no disponible');
        }
      } catch (error) {
        console.error('Error en login:', error);
        
        // Restaurar botón en caso de error
        btnLoader.style.opacity = '0';
        btnLoader.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
          btnLoader.style.display = 'none';
          btnText.style.opacity = '1';
          btnText.style.transform = 'translateY(0)';
          loginBtn.disabled = false;
        }, 200);
        
        // Mostrar error al usuario
        if (window.showToast) {
          window.showToast('Error al iniciar sesión', 'error');
        } else {
          alert('Error al iniciar sesión: ' + error.message);
        }
      }
    });
  }

  // Animaciones adicionales en los inputs al hacer focus
  const inputs = document.querySelectorAll('.input-modern');
  inputs.forEach(input => {
    input.addEventListener('focus', () => {
      input.parentElement.classList.add('input-focused');
    });
    
    input.addEventListener('blur', () => {
      input.parentElement.classList.remove('input-focused');
    });
  });

  // Animación del checkbox
  const checkbox = document.getElementById('remember-session');
  if (checkbox) {
    checkbox.addEventListener('change', () => {
      const checkboxCustom = checkbox.parentElement.querySelector('.checkbox-custom');
      if (checkboxCustom) {
        if (checkbox.checked) {
          checkboxCustom.style.transform = 'scale(1.1)';
          setTimeout(() => {
            checkboxCustom.style.transform = 'scale(1)';
          }, 200);
        }
      }
    });
  }

  // Prevenir comportamiento por defecto del enlace "¿Problemas para entrar?"
  const forgotPasswordLink = document.querySelector('.forgot-password-link');
  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', (e) => {
      e.preventDefault();
      if (window.showToast) {
        window.showToast('Funcionalidad en desarrollo', 'info');
      } else {
        alert('Contacta al administrador del sistema para recuperar tu contraseña.');
      }
    });
  }

  // Cargar credenciales guardadas solo si el usuario marcó "Recordarme"
  // Comentado para que los campos vengan vacíos por defecto
  /*
  if (window.auth) {
    const remembered = window.auth.getRememberedCredentials();
    if (remembered) {
      const emailInput = document.getElementById('email');
      const passwordInput = document.getElementById('password');
      const rememberCheckbox = document.getElementById('remember-session');
      
      if (emailInput && remembered.email) emailInput.value = remembered.email;
      if (passwordInput && remembered.password) passwordInput.value = remembered.password;
      if (rememberCheckbox) rememberCheckbox.checked = true;
    }
  }
  */
});

// Exportar funciones para uso global
window.loginModern = {
  togglePassword: () => {
    const btn = document.getElementById('toggle-password');
    if (btn) btn.click();
  },
  
  focusEmail: () => {
    const email = document.getElementById('email');
    if (email) email.focus();
  },
  
  focusPassword: () => {
    const password = document.getElementById('password');
    if (password) password.focus();
  }
};
