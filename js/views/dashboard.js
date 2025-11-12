// Vista del Dashboard
const dashboardView = {
  async render(container) {
    const currentUser = auth.getCurrentUser();
    const greeting = this.getGreeting();
    
    container.innerHTML = `
      <div style="margin-bottom: 32px;">
        <h1 style="font-size: 24px; font-weight: 600; color: #111827; margin-bottom: 4px;">${greeting}, ${utils.escapeHtml(currentUser?.fullName || 'Usuario')}</h1>
        <p style="font-size: 14px; color: #6b7280;">Resumen de tu inventario</p>
      </div>

      <div class="dashboard-stats-grid" id="stats-container">
        <div class="loading">
          <div class="spinner"></div>
        </div>
      </div>

      <div class="dashboard-grid">
        <div class="dashboard-card" style="border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
          <div style="padding: 20px; border-bottom: 1px solid #f3f4f6; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h3 style="font-size: 16px; font-weight: 600; color: #111827; margin-bottom: 2px;">Stock Bajo</h3>
              <p style="font-size: 13px; color: #6b7280;">Productos que requieren atención</p>
            </div>
            <button class="btn btn-sm btn-secondary" onclick="router.navigate('products')">Ver todos</button>
          </div>
          <div style="padding: 16px;">
            <div id="low-stock-container">
              <div class="loading">
                <div class="spinner"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="dashboard-card" style="border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
          <div style="padding: 20px; border-bottom: 1px solid #f3f4f6;">
            <h3 style="font-size: 16px; font-weight: 600; color: #111827; margin-bottom: 2px;">Actividad Reciente</h3>
            <p style="font-size: 13px; color: #6b7280;">Últimos movimientos de inventario</p>
          </div>
          <div style="padding: 16px;">
            <div id="recent-movements-container">
              <div class="loading">
                <div class="spinner"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="dashboard-card" style="border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
          <div style="padding: 20px; border-bottom: 1px solid #f3f4f6;">
            <h3 style="font-size: 16px; font-weight: 600; color: #111827; margin-bottom: 2px;">Resumen General</h3>
            <p style="font-size: 13px; color: #6b7280;">Datos del sistema</p>
          </div>
          <div style="padding: 16px;">
            <div id="quick-summary-container">
              <div class="loading">
                <div class="spinner"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Cargar datos
    await Promise.all([
      this.loadStats(),
      this.loadLowStockProducts(),
      this.loadRecentMovements(),
      this.loadQuickSummary()
    ]);
  },

  getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  },

  getCurrentDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString('es-ES', options);
  },

  async loadStats() {
    try {
      // Cargar estadísticas
      const [productsRes, inventoryRes, purchaseOrdersRes, salesOrdersRes] = await Promise.all([
        api.getProducts({ limit: 1 }),
        api.getInventoryLevels({ limit: 1 }),
        api.getPurchaseOrders({ limit: 1, status: 'ORDERED' }),
        api.getSalesOrders({ limit: 1, status: 'CONFIRMED' })
      ]);

      const products = utils.normalizeResponse(productsRes);
      const inventory = utils.normalizeResponse(inventoryRes);
      const purchaseOrders = utils.normalizeResponse(purchaseOrdersRes);
      const salesOrders = utils.normalizeResponse(salesOrdersRes);

      const statsHtml = `
        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; transition: box-shadow 0.2s;" onmouseover="this.style.boxShadow='0 4px 12px rgba(0,0,0,0.08)'" onmouseout="this.style.boxShadow='none'">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 48px; height: 48px; border-radius: 10px; background: linear-gradient(135deg, #ff6b2c 0%, #ff8f5c 100%); display: flex; align-items: center; justify-content: center; color: white;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 7L12 3L4 7M20 7L12 11M20 7V17L12 21M12 11L4 7M12 11V21M4 7V17L12 21"/>
              </svg>
            </div>
            <div style="flex: 1;">
              <div style="font-size: 13px; color: #6b7280; margin-bottom: 2px;">Productos</div>
              <div style="font-size: 28px; font-weight: 700; color: #111827;">${products.meta?.total || products.length || 0}</div>
            </div>
          </div>
        </div>

        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; transition: box-shadow 0.2s;" onmouseover="this.style.boxShadow='0 4px 12px rgba(0,0,0,0.08)'" onmouseout="this.style.boxShadow='none'">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 48px; height: 48px; border-radius: 10px; background: linear-gradient(135deg, #10b981 0%, #34d399 100%); display: flex; align-items: center; justify-content: center; color: white;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 3H21V8H3V3ZM3 10H21V15H3V10ZM3 17H21V22H3V17Z"/>
              </svg>
            </div>
            <div style="flex: 1;">
              <div style="font-size: 13px; color: #6b7280; margin-bottom: 2px;">Inventario</div>
              <div style="font-size: 28px; font-weight: 700; color: #111827;">${inventory.meta?.total || (Array.isArray(inventory) ? inventory.length : inventory.data?.length || 0)}</div>
            </div>
          </div>
        </div>

        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; transition: box-shadow 0.2s;" onmouseover="this.style.boxShadow='0 4px 12px rgba(0,0,0,0.08)'" onmouseout="this.style.boxShadow='none'">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 48px; height: 48px; border-radius: 10px; background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%); display: flex; align-items: center; justify-content: center; color: white;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 7V12M9 12V17M9 12H14M14 12H19M14 12V7M14 12V17"/>
                <rect x="3" y="3" width="18" height="18" rx="2"/>
              </svg>
            </div>
            <div style="flex: 1;">
              <div style="font-size: 13px; color: #6b7280; margin-bottom: 2px;">Compras</div>
              <div style="font-size: 28px; font-weight: 700; color: #111827;">${purchaseOrders.meta?.total || (Array.isArray(purchaseOrders) ? purchaseOrders.length : 0)}</div>
            </div>
          </div>
        </div>

        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; transition: box-shadow 0.2s;" onmouseover="this.style.boxShadow='0 4px 12px rgba(0,0,0,0.08)'" onmouseout="this.style.boxShadow='none'">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 48px; height: 48px; border-radius: 10px; background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%); display: flex; align-items: center; justify-content: center; color: white;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 11L12 14L22 4"/>
                <path d="M21 12V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H16"/>
              </svg>
            </div>
            <div style="flex: 1;">
              <div style="font-size: 13px; color: #6b7280; margin-bottom: 2px;">Ventas</div>
              <div style="font-size: 28px; font-weight: 700; color: #111827;">${salesOrders.meta?.total || (Array.isArray(salesOrders) ? salesOrders.length : 0)}</div>
            </div>
          </div>
        </div>
      `;

      document.getElementById('stats-container').innerHTML = statsHtml;
    } catch (error) {
      console.error('Error loading stats:', error);
      utils.showToast('Error al cargar estadísticas', 'error');
    }
  },

  async loadLowStockProducts() {
    try {
      const response = await api.getProducts({ minStockAlert: true, limit: 5 });
      const normalized = utils.normalizeResponse(response);
      const container = document.getElementById('low-stock-container');
      
      const products = normalized.data || [];

      if (products.length === 0) {
        container.innerHTML = `
          <div class="empty-state-small">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <path d="M9 11L12 14L22 4" stroke="currentColor" stroke-width="2"/>
              <path d="M21 12V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H16" stroke="currentColor" stroke-width="2"/>
            </svg>
            <p>¡Excelente! No hay productos con stock bajo</p>
          </div>
        `;
        return;
      }

      const html = `
        <div class="product-list">
          ${products.map(product => `
            <div class="product-item">
              <div class="product-item-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M20 7L12 3L4 7M20 7L12 11M20 7V17L12 21M12 11L4 7M12 11V21M4 7V17L12 21" stroke="currentColor" stroke-width="2"/>
                </svg>
              </div>
              <div class="product-item-content">
                <div class="product-item-name">${utils.escapeHtml(product.name)}</div>
                <div class="product-item-sku">SKU: ${utils.escapeHtml(product.sku)}</div>
              </div>
              <div class="product-item-badge">
                <span class="badge danger">Stock: ${utils.formatNumber(product.minStock, 0)}</span>
              </div>
            </div>
          `).join('')}
        </div>
      `;

      container.innerHTML = html;
    } catch (error) {
      console.error('Error loading low stock products:', error);
      document.getElementById('low-stock-container').innerHTML = 
        '<div class="empty-state-small"><p>Error al cargar productos</p></div>';
    }
  },

  async loadRecentMovements() {
    try {
      const response = await api.getStockMovements({ limit: 6, sort: 'createdAt:desc' });
      const normalized = utils.normalizeResponse(response);
      const container = document.getElementById('recent-movements-container');
      
      const movements = normalized.data || [];

      if (movements.length === 0) {
        container.innerHTML = `
          <div class="empty-state-small">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" stroke-width="2"/>
            </svg>
            <p>No hay movimientos recientes</p>
          </div>
        `;
        return;
      }

      const typeIcons = {
        IN: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 5V19M12 5L6 11M12 5L18 11" stroke="currentColor" stroke-width="2"/></svg>',
        OUT: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 19V5M12 19L18 13M12 19L6 13" stroke="currentColor" stroke-width="2"/></svg>',
        ADJUST: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 6V12M12 12V18M12 12H18M12 12H6" stroke="currentColor" stroke-width="2"/></svg>'
      };

      const typeColors = {
        IN: 'success',
        OUT: 'danger',
        ADJUST: 'warning'
      };

      const typeLabels = {
        IN: 'Entrada',
        OUT: 'Salida',
        ADJUST: 'Ajuste'
      };

      const html = `
        <div class="activity-list">
          ${movements.map(movement => `
            <div class="activity-item">
              <div class="activity-icon ${typeColors[movement.type]}">
                ${typeIcons[movement.type]}
              </div>
              <div class="activity-content">
                <div class="activity-title">${typeLabels[movement.type]}</div>
                <div class="activity-meta">${utils.formatNumber(movement.quantity, 0)} unidades • ${this.getTimeAgo(movement.createdAt)}</div>
              </div>
            </div>
          `).join('')}
        </div>
      `;

      container.innerHTML = html;
    } catch (error) {
      console.error('Error loading recent movements:', error);
      document.getElementById('recent-movements-container').innerHTML = 
        '<div class="empty-state-small"><p>Error al cargar movimientos</p></div>';
    }
  },

  async loadQuickSummary() {
    try {
      const container = document.getElementById('quick-summary-container');
      
      const [warehousesRes, suppliersRes, customersRes] = await Promise.all([
        api.getWarehouses({ limit: 1 }),
        api.getSuppliers({ limit: 1 }),
        api.getCustomers({ limit: 1 })
      ]);

      const warehouses = utils.normalizeResponse(warehousesRes);
      const suppliers = utils.normalizeResponse(suppliersRes);
      const customers = utils.normalizeResponse(customersRes);

      const html = `
        <div class="summary-list">
          <div class="summary-item">
            <div class="summary-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" stroke-width="2"/>
                <path d="M9 22V12H15V22" stroke="currentColor" stroke-width="2"/>
              </svg>
            </div>
            <div class="summary-info">
              <div class="summary-label">Almacenes</div>
              <div class="summary-value">${warehouses.meta?.total || 0}</div>
            </div>
          </div>

          <div class="summary-item">
            <div class="summary-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" stroke-width="2"/>
                <circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2"/>
              </svg>
            </div>
            <div class="summary-info">
              <div class="summary-label">Proveedores</div>
              <div class="summary-value">${suppliers.meta?.total || 0}</div>
            </div>
          </div>

          <div class="summary-item">
            <div class="summary-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" stroke-width="2"/>
                <circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="2"/>
                <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" stroke-width="2"/>
                <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" stroke-width="2"/>
              </svg>
            </div>
            <div class="summary-info">
              <div class="summary-label">Clientes</div>
              <div class="summary-value">${customers.meta?.total || 0}</div>
            </div>
          </div>
        </div>
      `;

      container.innerHTML = html;
    } catch (error) {
      console.error('Error loading quick summary:', error);
      document.getElementById('quick-summary-container').innerHTML = 
        '<div class="empty-state-small"><p>Error al cargar resumen</p></div>';
    }
  },

  getTimeAgo(date) {
    const now = new Date();
    const past = new Date(date);
    const diffInSeconds = Math.floor((now - past) / 1000);
    
    if (diffInSeconds < 60) return 'Hace un momento';
    if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)} h`;
    return `Hace ${Math.floor(diffInSeconds / 86400)} días`;
  }
};

window.dashboardView = dashboardView;
