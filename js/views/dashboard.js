// Vista del Dashboard
const dashboardView = {
  async render(container) {
    const currentUser = auth.getCurrentUser();
    const greetingData = this.getGreeting();
    const currentDate = this.getCurrentDate();
    
    container.innerHTML = `
      <div class="dashboard-welcome">
        <div class="welcome-content">
          <div class="welcome-text">
            <h1 class="welcome-title">
              ${greetingData.icon}
              ${greetingData.text}, ${utils.escapeHtml(currentUser?.fullName || 'Usuario')}
            </h1>
            <p class="welcome-subtitle">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 6px; opacity: 0.6;">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              ${currentDate}
            </p>
          </div>
        </div>
      </div>

      <div class="dashboard-stats-modern" id="stats-container">
        <div class="loading-minimal">
          <div class="spinner-minimal"></div>
        </div>
      </div>

      <div class="dashboard-grid-modern">
        <!-- Fila 1: Gráfico grande de movimientos y Top Productos -->
        <div class="dashboard-card-modern dashboard-card-large">
          <div class="dashboard-card-header-modern">
            <div class="card-header-content">
              <div class="card-icon-header primary">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 3V16C3 16.5304 3.21071 17.0391 3.58579 17.4142C3.96086 17.7893 4.46957 18 5 18H21"/>
                  <path d="M18 9L13 14L9 10L3 16"/>
                </svg>
              </div>
              <div>
                <h3 class="card-title-modern">Movimientos de Inventario</h3>
                <p class="card-subtitle-modern">Últimos 7 días</p>
              </div>
            </div>
          </div>
          <div class="dashboard-card-content">
            <div id="inventory-chart" style="min-height: 240px;">
              <div class="loading-minimal">
                <div class="spinner-minimal"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="dashboard-card-modern">
          <div class="dashboard-card-header-modern">
            <div class="card-header-content">
              <div class="card-icon-header success">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 7L12 3L4 7M20 7L12 11M20 7V17L12 21M12 11L4 7M12 11V21M4 7V17L12 21"/>
                </svg>
              </div>
              <div>
                <h3 class="card-title-modern">Top Productos</h3>
                <p class="card-subtitle-modern">Más vendidos</p>
              </div>
            </div>
          </div>
          <div class="dashboard-card-content">
            <div id="top-products-chart" style="min-height: 240px;">
              <div class="loading-minimal">
                <div class="spinner-minimal"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Fila 2: Estado de inventario (donut) -->
        <div class="dashboard-card-modern">
          <div class="dashboard-card-header-modern">
            <div class="card-header-content">
              <div class="card-icon-header info">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21.21 15.89C20.5738 17.3945 19.5788 18.7202 18.3119 19.7513C17.045 20.7824 15.5447 21.4874 13.9424 21.8048C12.3401 22.1221 10.6844 22.0421 9.12012 21.5718C7.55585 21.1015 6.13351 20.2551 4.96931 19.1066C3.80511 17.958 2.93783 16.5428 2.44253 14.984C1.94723 13.4251 1.84094 11.7705 2.13393 10.1646C2.42691 8.55878 3.10905 7.04902 4.12065 5.76619C5.13225 4.48336 6.44279 3.46591 7.93 2.80005"/>
                </svg>
              </div>
              <div>
                <h3 class="card-title-modern">Estado de Inventario</h3>
                <p class="card-subtitle-modern">Por categoría</p>
              </div>
            </div>
          </div>
          <div class="dashboard-card-content">
            <div id="categories-chart" style="min-height: 240px;">
              <div class="loading-minimal">
                <div class="spinner-minimal"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Stock Bajo -->
        <div class="dashboard-card-modern">
          <div class="dashboard-card-header-modern">
            <div class="card-header-content">
              <div class="card-icon-header warning">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M10.29 3.86L1.82 18C1.64537 18.3024 1.55296 18.6453 1.55199 18.9945C1.55101 19.3437 1.64151 19.6871 1.81445 19.9905C1.98738 20.2939 2.23675 20.5467 2.53773 20.7239C2.83871 20.9011 3.18082 20.9962 3.53 21H20.47C20.8192 20.9962 21.1613 20.9011 21.4623 20.7239C21.7632 20.5467 22.0126 20.2939 22.1856 19.9905C22.3585 19.6871 22.449 19.3437 22.448 18.9945C22.447 18.6453 22.3546 18.3024 22.18 18L13.71 3.86C13.5317 3.56611 13.2807 3.32312 12.9812 3.15448C12.6817 2.98585 12.3437 2.89725 12 2.89725C11.6563 2.89725 11.3183 2.98585 11.0188 3.15448C10.7193 3.32312 10.4683 3.56611 10.29 3.86Z"/>
                  <path d="M12 9V13M12 17H12.01"/>
                </svg>
              </div>
              <div>
                <h3 class="card-title-modern">Alertas de Stock</h3>
                <p class="card-subtitle-modern">Stock bajo</p>
              </div>
            </div>
          </div>
          <div class="dashboard-card-content" style="max-height: 240px; overflow-y: auto;">
            <div id="low-stock-container">
              <div class="loading-minimal">
                <div class="spinner-minimal"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Resumen Rápido -->
        <div class="dashboard-card-modern">
          <div class="dashboard-card-header-modern">
            <div class="card-header-content">
              <div class="card-icon-header success">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="7" height="7"/>
                  <rect x="14" y="3" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/>
                </svg>
              </div>
              <div>
                <h3 class="card-title-modern">Resumen Rápido</h3>
                <p class="card-subtitle-modern">Métricas clave</p>
              </div>
            </div>
          </div>
          <div class="dashboard-card-content">
            <div id="quick-summary-container">
              <div class="loading-minimal">
                <div class="spinner-minimal"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Esperar a que ApexCharts esté disponible y cargar todo en paralelo
    await this.waitForApexCharts();
    
    // Cargar datos y gráficos en paralelo para mejor rendimiento
    Promise.all([
      this.loadStats(),
      this.loadLowStockProducts(),
      this.loadQuickSummary(),
      this.loadInventoryChart(),
      this.loadTopProductsChart(),
      this.loadCategoriesChart()
    ]).catch(error => {
      console.error('Error loading dashboard:', error);
    });
  },

  async waitForApexCharts() {
    // Esperar hasta 2 segundos a que ApexCharts esté disponible
    const maxAttempts = 20;
    let attempts = 0;
    
    while (typeof ApexCharts === 'undefined' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    if (typeof ApexCharts === 'undefined') {
      console.warn('ApexCharts no disponible');
      return false;
    }
    return true;
  },

  getGreeting() {
    const hour = new Date().getHours();
    
    if (hour < 12) {
      // Mañana - Sol naciente
      return {
        text: 'Buenos días',
        icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 8px; color: #f59e0b;"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>'
      };
    }
    
    if (hour < 19) {
      // Tarde - Sol
      return {
        text: 'Buenas tardes',
        icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 8px; color: #f59e0b;"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
      };
    }
    
    // Noche - Luna
    return {
      text: 'Buenas noches',
      icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 8px; color: #6366f1;"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>'
    };
  },

  getCurrentDate() {
    const date = new Date();
    const day = date.getDate();
    const month = date.toLocaleDateString('es-ES', { month: 'short' });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  },

  async loadStats() {
    try {
      const [
        productsRes,
        inventoryRes,
        purchaseOrdersRes,
        salesOrdersRes
      ] = await Promise.all([
        api.getProducts({ limit: 1 }),
        api.getInventoryLevels({ limit: 1 }),
        api.getPurchaseOrders({ limit: 1 }),
        api.getSalesOrders({ limit: 1 })
      ]);

      const products = utils.normalizeResponse(productsRes);
      const inventory = utils.normalizeResponse(inventoryRes);
      const purchaseOrders = utils.normalizeResponse(purchaseOrdersRes);
      const salesOrders = utils.normalizeResponse(salesOrdersRes);

      // Datos totales actuales
      const totalProducts = products.meta?.total || products.length || 0;
      const totalInventory = inventory.meta?.total || (Array.isArray(inventory) ? inventory.length : inventory.data?.length || 0);
      const totalPurchaseOrders = purchaseOrders.meta?.total || (Array.isArray(purchaseOrders) ? purchaseOrders.length : 0);
      const totalSalesOrders = salesOrders.meta?.total || (Array.isArray(salesOrders) ? salesOrders.length : 0);

      // Calcular tendencias optimizadas basadas en volumen de datos
      const calculateSimpleTrend = (value, thresholds) => {
        for (let i = 0; i < thresholds.length; i++) {
          if (value > thresholds[i][0]) return thresholds[i][1];
        }
        return thresholds[thresholds.length - 1][1];
      };
      
      const productsTrend = calculateSimpleTrend(totalProducts, [[50, 15], [20, 10], [10, 8], [0, 5]]);
      const inventoryTrend = calculateSimpleTrend(totalInventory, [[100, 12], [50, 9], [20, 7], [0, 4]]);
      const purchasesTrend = calculateSimpleTrend(totalPurchaseOrders, [[20, 18], [10, 12], [5, 8], [0, 5]]);
      const salesTrend = calculateSimpleTrend(totalSalesOrders, [[20, 15], [10, 10], [5, 6], [0, 3]]);

      // Generar HTML con tendencias dinámicas
      const kpis = [
        {
          label: 'Productos',
          value: totalProducts,
          trend: productsTrend,
          icon: 'orange',
          iconPath: 'M20 7L12 3L4 7M20 7L12 11M20 7V17L12 21M12 11L4 7M12 11V21M4 7V17L12 21'
        },
        {
          label: 'Inventario',
          value: totalInventory,
          trend: inventoryTrend,
          icon: 'green',
          iconPath: 'M3 3H7V7H3V3ZM14 3H18V7H14V3ZM14 14H18V18H14V14ZM3 14H7V18H3V14Z'
        },
        {
          label: 'Compras',
          value: totalPurchaseOrders,
          trend: purchasesTrend,
          icon: 'yellow',
          iconPath: 'M3 3H21V21H3V3ZM3 9H21M9 21V9'
        },
        {
          label: 'Ventas',
          value: totalSalesOrders,
          trend: salesTrend,
          icon: 'blue',
          iconPath: 'M9 11L12 14L22 4M21 12V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H16'
        }
      ];

      // Optimizar renderizado de KPIs
      const arrowUp = '<path d="M7 17L17 7M17 7H7M17 7V17"/>';
      const arrowDown = '<path d="M17 7L7 17M7 17H17M7 17V7"/>';
      
      const statsHtml = kpis.map(kpi => {
        const isPositive = kpi.trend >= 0;
        const badgeClass = isPositive ? 'positive' : 'negative';
        const arrow = isPositive ? arrowUp : arrowDown;
        
        return `<div class="kpi-card"><div class="kpi-badge ${badgeClass}"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">${arrow}</svg>${Math.abs(kpi.trend)}%</div><div class="kpi-icon ${kpi.icon}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="${kpi.iconPath}"/></svg></div><div class="kpi-content"><div class="kpi-label">${kpi.label}</div><div class="kpi-value">${kpi.value}</div></div></div>`;
      }).join('');

      document.getElementById('stats-container').innerHTML = statsHtml;
    } catch (error) {
      console.error('Error loading stats:', error);
      utils.showToast('Error al cargar estadísticas', 'error');
      
      // Mostrar mensaje de error en el contenedor
      document.getElementById('stats-container').innerHTML = `
        <div class="error-state" style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--danger);">
          <p>Error al cargar KPIs. Por favor, recarga la página.</p>
        </div>
      `;
    }
  },

  async loadLowStockProducts() {
    try {
      // Solicitar más productos para que el filtro del backend encuentre los que tienen stock bajo
      const response = await api.getProducts({ minStockAlert: true, limit: 100 });
      const normalized = utils.normalizeResponse(response);
      const container = document.getElementById('low-stock-container');
      
      // Limitar a 5 productos en el frontend
      const products = (normalized.data || []).slice(0, 5);

      if (products.length === 0) {
        container.innerHTML = `
          <div class="empty-state-minimal">
            <div class="empty-icon success">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 11L12 14L22 4"/>
                <path d="M21 12V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H16"/>
              </svg>
            </div>
            <p class="empty-text">¡Excelente! No hay productos con stock bajo</p>
          </div>
        `;
        return;
      }

      const html = `
        <div class="dashboard-list">
          ${products.map(product => {
            const currentStock = product.inventoryLevels?.reduce((sum, inv) => sum + (parseFloat(inv.quantity) || 0), 0) || 0;
            const minStock = product.minStock || 0;
            return `
              <div class="dashboard-list-item">
                <div class="list-item-icon warning">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 7L12 3L4 7M20 7L12 11M20 7V17L12 21M12 11L4 7M12 11V21M4 7V17L12 21"/>
                  </svg>
                </div>
                <div class="list-item-content">
                  <div class="list-item-title">${utils.escapeHtml(product.name)}</div>
                  <div class="list-item-subtitle">SKU: ${utils.escapeHtml(product.sku)}</div>
                </div>
                <div class="list-item-badge">
                  <span class="badge-minimal ${currentStock === 0 ? 'danger' : 'warning'}">
                    ${Math.round(currentStock)}/${Math.round(minStock)}
                  </span>
                </div>
              </div>
            `;
          }).join('')}
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
          <div class="empty-state-minimal">
            <div class="empty-icon primary">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z"/>
              </svg>
            </div>
            <p class="empty-text">No hay movimientos recientes</p>
          </div>
        `;
        return;
      }

      const typeIcons = {
        IN: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5V19M12 5L6 11M12 5L18 11"/></svg>',
        OUT: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19V5M12 19L18 13M12 19L6 13"/></svg>',
        ADJUST: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 6V12M12 12V18M12 12H18M12 12H6"/></svg>'
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
        <div class="dashboard-list">
          ${movements.map(movement => `
            <div class="dashboard-list-item">
              <div class="list-item-icon ${typeColors[movement.type]}">
                ${typeIcons[movement.type]}
              </div>
              <div class="list-item-content">
                <div class="list-item-title">${typeLabels[movement.type]}</div>
                <div class="list-item-subtitle">${utils.formatNumber(movement.quantity, 0)} unidades • ${this.getTimeAgo(movement.createdAt)}</div>
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
        <div class="dashboard-list">
          <div class="dashboard-list-item">
            <div class="list-item-icon info">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z"/>
                <path d="M9 22V12H15V22"/>
              </svg>
            </div>
            <div class="list-item-content">
              <div class="list-item-title">Almacenes</div>
              <div class="list-item-subtitle">Total registrados</div>
            </div>
            <div class="list-item-value">${warehouses.meta?.total || 0}</div>
          </div>

          <div class="dashboard-list-item">
            <div class="list-item-icon success">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div class="list-item-content">
              <div class="list-item-title">Proveedores</div>
              <div class="list-item-subtitle">Total registrados</div>
            </div>
            <div class="list-item-value">${suppliers.meta?.total || 0}</div>
          </div>

          <div class="dashboard-list-item">
            <div class="list-item-icon primary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13"/>
                <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88"/>
              </svg>
            </div>
            <div class="list-item-content">
              <div class="list-item-title">Clientes</div>
              <div class="list-item-subtitle">Total registrados</div>
            </div>
            <div class="list-item-value">${customers.meta?.total || 0}</div>
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
  },

  async loadInventoryChart() {
    const container = document.querySelector("#inventory-chart");
    if (!container) return;

    try {
      // Verificar que ApexCharts esté disponible
      if (typeof ApexCharts === 'undefined') {
        container.innerHTML = '<div class="empty-state-minimal"><p class="empty-text">Error al cargar librería de gráficos</p></div>';
        return;
      }

      // Intentar obtener movimientos (optimizado a 50 registros)
      let movements = [];
      try {
        const response = await api.getStockMovements({ limit: 50, sort: 'createdAt:desc' });
        const normalized = utils.normalizeResponse(response);
        movements = normalized.data || [];
      } catch (apiError) {
        console.error('Error al obtener movimientos:', apiError);
        movements = []; // Array vacío para gráfica sin datos
      }

      // Agrupar movimientos por día (últimos 7 días) - optimizado
      const days = [];
      const entradas = new Array(7).fill(0);
      const salidas = new Array(7).fill(0);
      const today = new Date();
      today.setHours(23, 59, 59, 999);

      // Pre-calcular rangos de días
      const dayRanges = [];
      for (let i = 6; i >= 0; i--) {
        const dayStart = new Date(today);
        dayStart.setDate(dayStart.getDate() - i);
        dayStart.setHours(0, 0, 0, 0);
        
        days.push(dayStart.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }));
        dayRanges.push({ start: dayStart.getTime(), end: dayStart.getTime() + 86400000, index: 6 - i });
      }

      // Procesar movimientos una sola vez
      movements.forEach(m => {
        try {
          const movTime = new Date(m.createdAt).getTime();
          const qty = parseFloat(m.quantity) || 0;
          
          for (const range of dayRanges) {
            if (movTime >= range.start && movTime < range.end) {
              if (m.type === 'IN') entradas[range.index] += qty;
              else if (m.type === 'OUT') salidas[range.index] += qty;
              break;
            }
          }
        } catch (e) {
          // Ignorar errores de fecha
        }
      });
      
      // Redondear valores
      for (let i = 0; i < 7; i++) {
        entradas[i] = Math.round(entradas[i]);
        salidas[i] = Math.round(salidas[i]);
      }

      const options = {
        series: [{
          name: 'Entradas',
          data: entradas,
          color: '#10b981'
        }, {
          name: 'Salidas',
          data: salidas,
          color: '#ef4444'
        }],
        chart: {
          type: 'area',
          height: 240,
          toolbar: { show: false },
          fontFamily: 'Inter, system-ui, sans-serif',
          animations: {
            enabled: true,
            easing: 'easeinout',
            speed: 500,
            dynamicAnimation: { enabled: false }
          }
        },
        dataLabels: {
          enabled: false
        },
        stroke: {
          curve: 'smooth',
          width: 3
        },
        fill: {
          type: 'gradient',
          gradient: {
            shadeIntensity: 1,
            opacityFrom: 0.4,
            opacityTo: 0.1,
            stops: [0, 90, 100]
          }
        },
        xaxis: {
          categories: days,
          labels: {
            style: {
              colors: '#6b7280',
              fontSize: '12px',
              fontWeight: 500
            }
          },
          axisBorder: {
            show: false
          },
          axisTicks: {
            show: false
          }
        },
        yaxis: {
          labels: {
            style: {
              colors: '#6b7280',
              fontSize: '12px',
              fontWeight: 500
            },
            formatter: function (val) {
              return Math.floor(val);
            }
          }
        },
        grid: {
          borderColor: '#f3f4f6',
          strokeDashArray: 4,
          xaxis: {
            lines: {
              show: false
            }
          }
        },
        legend: {
          position: 'top',
          horizontalAlign: 'right',
          fontSize: '13px',
          fontWeight: 600,
          labels: {
            colors: '#374151'
          },
          markers: {
            width: 10,
            height: 10,
            radius: 10
          }
        },
        tooltip: {
          theme: 'light',
          x: {
            show: true
          },
          y: {
            formatter: function (val) {
              return val + ' unidades';
            }
          }
        }
      };

      // Limpiar el contenedor y renderizar
      container.innerHTML = '';
      const chart = new ApexCharts(container, options);
      await chart.render();
    } catch (error) {
      console.error('Error al cargar gráfica de inventario:', error);
      container.innerHTML = '<div class="empty-state-minimal"><p class="empty-text">Error al cargar gráfico</p></div>';
    }
  },

  async loadTopProductsChart() {
    const container = document.querySelector("#top-products-chart");
    if (!container) return;

    try {
      // Verificar que ApexCharts esté disponible
      if (typeof ApexCharts === 'undefined') {
        console.error('ApexCharts no está cargado');
        container.innerHTML = '<div class="empty-state-minimal"><p class="empty-text">Error al cargar librería de gráficos</p></div>';
        return;
      }

      let products = [];
      try {
        const response = await api.getProducts({ limit: 5, sort: 'createdAt:desc' });
        const normalized = utils.normalizeResponse(response);
        products = normalized.data || [];
      } catch (apiError) {
        console.error('Error al obtener productos:', apiError);
        container.innerHTML = '<div class="empty-state-minimal"><p class="empty-text">Error al cargar productos</p></div>';
        return;
      }

      if (products.length === 0) {
        container.innerHTML = '<div class="empty-state-minimal"><div class="empty-icon success"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14H12L11 22L21 10H12L13 2Z"/></svg></div><p class="empty-text">No hay datos disponibles</p></div>';
        return;
      }

      const productNames = products.map(p => {
        try {
          return p.name && p.name.length > 20 ? p.name.substring(0, 20) + '...' : (p.name || 'Sin nombre');
        } catch (e) {
          return 'Sin nombre';
        }
      });
      
      const quantities = products.map(p => {
        try {
          // Obtener cantidad total de inventario si existe
          if (p.inventoryLevels && p.inventoryLevels.length > 0) {
            return Math.round(p.inventoryLevels.reduce((sum, inv) => sum + (parseFloat(inv.quantity) || 0), 0));
          }
          return 0;
        } catch (e) {
          return 0;
        }
      });

      // Si todos los valores son 0, mostrar mensaje
      if (quantities.every(q => q === 0)) {
        container.innerHTML = '<div class="empty-state-minimal"><p class="empty-text">No hay datos de inventario</p></div>';
        return;
      }

      const options = {
        series: [{
          name: 'Cantidad',
          data: quantities,
          color: '#10b981'
        }],
        chart: {
          type: 'bar',
          height: 240,
          toolbar: {
            show: false
          },
          fontFamily: 'Inter, system-ui, sans-serif',
          animations: {
            enabled: true,
            easing: 'easeinout',
            speed: 600
          }
        },
        plotOptions: {
          bar: {
            horizontal: true,
            borderRadius: 6,
            dataLabels: {
              position: 'top'
            }
          }
        },
        dataLabels: {
          enabled: true,
          offsetX: 30,
          style: {
            fontSize: '12px',
            fontWeight: 600,
            colors: ['#10b981']
          }
        },
        xaxis: {
          categories: productNames,
          labels: {
            style: {
              colors: '#6b7280',
              fontSize: '12px',
              fontWeight: 500
            }
          },
          axisBorder: {
            show: false
          },
          axisTicks: {
            show: false
          }
        },
        yaxis: {
          labels: {
            style: {
              colors: '#6b7280',
              fontSize: '12px',
              fontWeight: 500
            }
          }
        },
        grid: {
          borderColor: '#f3f4f6',
          strokeDashArray: 4,
          yaxis: {
            lines: {
              show: false
            }
          }
        },
        tooltip: {
          theme: 'light',
          y: {
            formatter: function (val) {
              return val + ' unidades';
            }
          }
        }
      };

      // Limpiar el contenedor y renderizar
      container.innerHTML = '';
      const chart = new ApexCharts(container, options);
      await chart.render();
    } catch (error) {
      console.error('Error loading top products chart:', error);
      container.innerHTML = '<div class="empty-state-minimal"><p class="empty-text">Error al cargar gráfico</p></div>';
    }
  },

  async loadCategoriesChart() {
    const container = document.querySelector("#categories-chart");
    if (!container) return;

    try {
      // Verificar que ApexCharts esté disponible
      if (typeof ApexCharts === 'undefined') {
        console.error('ApexCharts no está cargado');
        container.innerHTML = '<div class="empty-state-minimal"><p class="empty-text">Error al cargar librería de gráficos</p></div>';
        return;
      }

      let categories = [];
      try {
        const response = await api.get('/categories');
        const normalized = utils.normalizeResponse(response);
        categories = normalized.data || [];
      } catch (apiError) {
        console.error('Error al obtener categorías:', apiError);
        container.innerHTML = '<div class="empty-state-minimal"><p class="empty-text">Error al cargar categorías</p></div>';
        return;
      }

      if (categories.length === 0) {
        container.innerHTML = '<div class="empty-state-minimal"><div class="empty-icon info"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.21 15.89C20.5738 17.3945 19.5788 18.7202 18.3119 19.7513C17.045 20.7824 15.5447 21.4874 13.9424 21.8048C12.3401 22.1221 10.6844 22.0421 9.12012 21.5718C7.55585 21.1015 6.13351 20.2551 4.96931 19.1066C3.80511 17.958 2.93783 16.5428 2.44253 14.984C1.94723 13.4251 1.84094 11.7705 2.13393 10.1646C2.42691 8.55878 3.10905 7.04902 4.12065 5.76619C5.13225 4.48336 6.44279 3.46591 7.93 2.80005"/></svg></div><p class="empty-text">No hay categorías registradas</p></div>';
        return;
      }

      const categoryNames = categories.slice(0, 6).map(c => c.name || 'Sin nombre');
      const productCounts = categories.slice(0, 6).map(c => {
        try {
          return c._count?.products || 0;
        } catch (e) {
          return 0;
        }
      });

      // Si todos los valores son 0, mostrar mensaje
      if (productCounts.every(q => q === 0)) {
        container.innerHTML = '<div class="empty-state-minimal"><p class="empty-text">No hay productos en categorías</p></div>';
        return;
      }

      const options = {
        series: productCounts,
        chart: {
          type: 'donut',
          height: 240,
          fontFamily: 'Inter, system-ui, sans-serif',
          animations: {
            enabled: true,
            easing: 'easeinout',
            speed: 800
          }
        },
        labels: categoryNames,
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
        plotOptions: {
          pie: {
            donut: {
              size: '65%',
              labels: {
                show: true,
                total: {
                  show: true,
                  label: 'Total',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#6b7280',
                  formatter: function (w) {
                    return w.globals.seriesTotals.reduce((a, b) => a + b, 0);
                  }
                },
                value: {
                  fontSize: '22px',
                  fontWeight: 700,
                  color: '#111827',
                  formatter: function (val) {
                    return val;
                  }
                }
              }
            }
          }
        },
        dataLabels: {
          enabled: false
        },
        legend: {
          position: 'bottom',
          fontSize: '12px',
          fontWeight: 500,
          labels: {
            colors: '#374151'
          },
          markers: {
            width: 10,
            height: 10,
            radius: 10
          }
        },
        tooltip: {
          theme: 'light',
          y: {
            formatter: function (val) {
              return val + ' productos';
            }
          }
        }
      };

      // Limpiar el contenedor y renderizar
      container.innerHTML = '';
      const chart = new ApexCharts(container, options);
      await chart.render();
    } catch (error) {
      console.error('Error loading categories chart:', error);
      container.innerHTML = '<div class="empty-state-minimal"><p class="empty-text">Error al cargar gráfico</p></div>';
    }
  }
};

window.dashboardView = dashboardView;
