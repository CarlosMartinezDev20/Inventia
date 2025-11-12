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

  // Mostrar toast notification
  showToast(message, type = 'info', title = '') {
    const container = document.getElementById('toast-container');
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
      success: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 11L12 14L22 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M21 12V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      error: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><path d="M15 9L9 15M9 9L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
      info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><path d="M12 16V12M12 8H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'
    };
    
    toast.innerHTML = `
      <div class="toast-icon ${type}">${icons[type] || icons.info}</div>
      <div class="toast-content">
        ${title ? `<div class="toast-title">${title}</div>` : ''}
        <div class="toast-message">${message}</div>
      </div>
    `;
    
    container.appendChild(toast);
    
    // Auto-remove después de 4 segundos
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, CONFIG.TOAST_DURATION);
  },

  // Confirmar acción
  async confirm(message, title = '¿Estás seguro?') {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      
      overlay.innerHTML = `
        <div class="modal modal-sm">
          <div class="modal-header">
            <h3 class="modal-title">${title}</h3>
          </div>
          <div class="modal-body">
            <p>${message}</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" id="cancel-btn">Cancelar</button>
            <button class="btn btn-danger" id="confirm-btn">Confirmar</button>
          </div>
        </div>
      `;
      
      document.body.appendChild(overlay);
      
      overlay.querySelector('#cancel-btn').addEventListener('click', () => {
        overlay.remove();
        resolve(false);
      });
      
      overlay.querySelector('#confirm-btn').addEventListener('click', () => {
        overlay.remove();
        resolve(true);
      });
      
      // Click fuera del modal
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.remove();
          resolve(false);
        }
      });
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

  // Loading spinner
  showLoading(container) {
    container.innerHTML = `
      <div class="loading">
        <div class="spinner"></div>
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
