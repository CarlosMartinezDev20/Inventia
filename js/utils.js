// Utilidades y funciones helper
const utils = {
  // Normalizar respuestas del API
  // El API client desenvuelve las respuestas, pero algunas vistas esperan {data, meta}
  // Esta función normaliza para que siempre tengamos una estructura consistente
  normalizeResponse(response) {
    // Si ya tiene la estructura {data, meta}, devolverla tal cual
    if (response && typeof response === 'object' && 'data' in response) {
      return response;
    }
    // Si es un array o un objeto plano, envolverlo en {data}
    return { data: response, meta: null };
  },

  // Formatear moneda (USD)
  formatCurrency(value) {
    if (value === null || value === undefined) return '$0.00 USD';
    try {
      const num = parseFloat(value);
      return '$' + num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' USD';
    } catch (error) {
      console.error('Error formatting currency:', error);
      return '$0.00 USD';
    }
  },

  // Formatear número
  formatNumber(value, decimals = 2) {
    if (value === null || value === undefined) return '0';
    try {
      const num = parseFloat(value);
      return num.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    } catch (error) {
      console.error('Error formatting number:', error);
      return '0';
    }
  },

  // Formatear fecha
  formatDate(date) {
    if (!date) return 'N/A';
    try {
      const d = new Date(date);
      const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
      return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  },

  // Formatear fecha y hora
  formatDateTime(date) {
    if (!date) return 'N/A';
    try {
      const d = new Date(date);
      const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}, ${hours}:${minutes}`;
    } catch (error) {
      console.error('Error formatting datetime:', error);
      return 'N/A';
    }
  },

  // Formatear fecha para input
  formatDateForInput(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  // Mostrar toast notification mejorado
  showToast(message, type = 'info', title = '', duration = null) {
    const container = document.getElementById('toast-container');
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icons = {
      success: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      error: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
      warning: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 9V13M12 17H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
      info: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 16V12M12 8H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'
    };
    
    const autoDuration = duration || CONFIG.TOAST_DURATION;
    
    toast.innerHTML = `
      <div class="toast-icon toast-icon-${type}">${icons[type] || icons.info}</div>
      <div class="toast-content">
        ${title ? `<div class="toast-title">${utils.escapeHtml(title)}</div>` : ''}
        <div class="toast-message">${utils.escapeHtml(message)}</div>
      </div>
      <button class="toast-close" onclick="this.parentElement.remove()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
    `;
    
    container.appendChild(toast);
    
    // Auto-remove después del tiempo especificado
    const removeTimeout = setTimeout(() => {
      if (toast.parentElement) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(20px)';
        setTimeout(() => toast.remove(), 200);
      }
    }, autoDuration);
    
    // Pausar auto-remove al hacer hover
    toast.addEventListener('mouseenter', () => {
      clearTimeout(removeTimeout);
    });
    
    // Reanudar al salir del hover
    toast.addEventListener('mouseleave', () => {
      setTimeout(() => {
        if (toast.parentElement) {
          toast.style.opacity = '0';
          toast.style.transform = 'translateX(20px)';
          setTimeout(() => toast.remove(), 200);
        }
      }, 1000);
    });
  },

  // Confirmar acción
  async confirm(message, title = '¿Estás seguro?', type = 'warning') {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay confirm-modal-overlay';
      
      const icons = {
        danger: `
          <svg class="confirm-icon confirm-icon-danger" width="56" height="56" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>
            <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        `,
        warning: `
          <svg class="confirm-icon confirm-icon-warning" width="56" height="56" viewBox="0 0 24 24" fill="none">
            <path d="M12 9V13M12 17H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M10.29 3.86L1.82 18C1.64537 18.3024 1.55296 18.6453 1.55199 18.9945C1.55101 19.3437 1.64151 19.6871 1.81445 19.9905C1.98738 20.2939 2.23673 20.5467 2.53771 20.7239C2.83868 20.901 3.18084 20.9962 3.53 21H20.47C20.8192 20.9962 21.1613 20.901 21.4623 20.7239C21.7633 20.5467 22.0126 20.2939 22.1856 19.9905C22.3585 19.6871 22.449 19.3437 22.448 18.9945C22.447 18.6453 22.3546 18.3024 22.18 18L13.71 3.86C13.5317 3.56611 13.2807 3.32312 12.9812 3.15448C12.6817 2.98585 12.3437 2.89725 12 2.89725C11.6563 2.89725 11.3183 2.98585 11.0188 3.15448C10.7193 3.32312 10.4683 3.56611 10.29 3.86Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        `
      };
      
      const icon = type === 'danger' ? icons.danger : icons.warning;
      
      overlay.innerHTML = `
        <div class="modal modal-sm confirm-modal">
          <div class="modal-body confirm-modal-body">
            <div class="confirm-icon-container">
              ${icon}
            </div>
            <h3 class="confirm-title">${title}</h3>
            <p class="confirm-message">${message}</p>
          </div>
          <div class="modal-footer confirm-modal-footer">
            <button class="btn btn-secondary" id="cancel-btn">Cancelar</button>
            <button class="btn btn-danger" id="confirm-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M3 6H5H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <path d="M19 6V20C19 21.1046 18.1046 22 17 22H7C5.89543 22 5 21.1046 5 20V6M8 6V4C8 2.89543 8.89543 2 10 2H14C15.1046 2 16 2.89543 16 4V6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Eliminar
            </button>
          </div>
        </div>
      `;
      
      document.body.appendChild(overlay);
      
      // Animación de entrada
      requestAnimationFrame(() => {
        overlay.style.opacity = '1';
        const modal = overlay.querySelector('.confirm-modal');
        modal.style.animation = 'confirmModalIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
      });
      
      const closeModal = (result) => {
        overlay.style.opacity = '0';
        setTimeout(() => {
          overlay.remove();
          resolve(result);
        }, 150);
      };
      
      overlay.querySelector('#cancel-btn').addEventListener('click', () => closeModal(false));
      overlay.querySelector('#confirm-btn').addEventListener('click', () => closeModal(true));
      
      // Click fuera del modal
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal(false);
      });
      
      // ESC key
      const escHandler = (e) => {
        if (e.key === 'Escape') {
          closeModal(false);
          document.removeEventListener('keydown', escHandler);
        }
      };
      document.addEventListener('keydown', escHandler);
      
      // Focus en el botón de confirmar
      setTimeout(() => {
        overlay.querySelector('#confirm-btn').focus();
      }, 100);
    });
  },

  // Obtener badge HTML según estado
  getStatusBadge(status, type = 'purchase') {
    const badges = {
      purchase: {
        DRAFT: '<span class="badge gray">Borrador</span>',
        ORDERED: '<span class="badge primary">Ordenada</span>',
        RECEIVED: '<span class="badge success">Recibida</span>',
        CANCELLED: '<span class="badge danger">Cancelada</span>'
      },
      sales: {
        DRAFT: '<span class="badge gray">Borrador</span>',
        CONFIRMED: '<span class="badge primary">Confirmada</span>',
        FULFILLED: '<span class="badge success">Completada</span>',
        CANCELLED: '<span class="badge danger">Cancelada</span>'
      }
    };
    
    return badges[type]?.[status] || `<span class="badge gray">${status}</span>`;
  },

  // Obtener nombre de unidad
  getUnitName(unit) {
    return CONFIG.PRODUCT_UNITS[unit] || unit;
  },

  // Escapar HTML
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  // Debounce para búsquedas
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Generar ID único
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },

  // Validar email
  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  // Obtener parámetros de URL
  getUrlParams() {
    const params = {};
    const searchParams = new URLSearchParams(window.location.hash.split('?')[1]);
    for (const [key, value] of searchParams) {
      params[key] = value;
    }
    return params;
  },

  // Loading spinner minimalista
  showLoading(container) {
    container.innerHTML = `
      <div class="loading-minimal">
        <div class="spinner-minimal"></div>
      </div>
    `;
  },

  // Empty state
  showEmptyState(container, message, icon = '') {
    container.innerHTML = `
      <div class="empty-state">
        ${icon ? `<div>${icon}</div>` : ''}
        <p>${message}</p>
      </div>
    `;
  },

  // Calcular total de items de orden
  calculateOrderTotal(items) {
    return items.reduce((sum, item) => {
      const subtotal = parseFloat(item.qty || item.qtyOrdered) * parseFloat(item.unitPrice);
      const discount = parseFloat(item.discount || 0);
      return sum + subtotal - discount;
    }, 0);
  }
};

// Hacer utils global
window.utils = utils;

// Agregar estilos para animación slideOut
const style = document.createElement('style');
style.textContent = `
  @keyframes slideOut {
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);
