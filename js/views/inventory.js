// Vista de Inventario
const inventoryView = {
  warehouses: [],
  products: [],
  inventoryData: [],
  currentFilters: {
    stockStatus: 'all' // all, low, ok
  },
  expandedProducts: new Set(),

  async render(container) {
    await this.loadWarehouses();
    await this.loadProducts();

    container.innerHTML = `
      <div class="page-header">
        <div class="page-header-content">
          <div class="page-header-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M3 3H21V8H3V3ZM3 10H21V15H3V10ZM3 17H21V22H3V17Z" stroke="currentColor" stroke-width="2"/>
            </svg>
          </div>
          <div>
            <h1 class="page-title">Inventario</h1>
            <p class="page-subtitle">Control de stock por producto y almacén</p>
          </div>
        </div>
        <div class="page-actions">
          ${auth.canManage() ? '<button class="btn btn-primary" id="adjust-inventory-btn"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 6V12M12 12V18M12 12H18M12 12H6" stroke="currentColor" stroke-width="2"/></svg> Ajustar Inventario</button>' : ''}
        </div>
      </div>

      <div class="filters-card">
        <div class="filters-header">
          <div class="filters-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M22 3H2L10 12.46V19L14 21V12.46L22 3Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
            </svg>
            <span>Filtros</span>
          </div>
          <button class="btn-link" id="clear-filters-btn" style="display: none;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2"/>
            </svg>
            Limpiar filtros
          </button>
        </div>
        
        <div class="filters-grid">
          <div class="filter-group">
            <label class="filter-label">Buscar</label>
            <div class="search-box">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2"/>
                <path d="M21 21L16.65 16.65" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              <input type="text" id="search-filter" placeholder="Producto o SKU...">
            </div>
          </div>
          
          <div class="filter-group">
            <label class="filter-label">Almacén</label>
            <div class="select-wrapper">
              <select id="warehouse-filter">
                <option value="">Todos los almacenes</option>
                ${this.warehouses.map(w => `<option value="${w.id}">${utils.escapeHtml(w.name)}</option>`).join('')}
              </select>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>
          </div>

          <div class="filter-group">
            <label class="filter-label">Estado de Stock</label>
            <div class="select-wrapper">
              <select id="stock-status-filter">
                <option value="all">Todos los estados</option>
                <option value="low">Stock bajo</option>
                <option value="ok">Stock OK</option>
              </select>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div id="inventory-stats" class="stats-container"></div>

      <div class="card">
        <div class="card-body">
          <div id="inventory-table-container">
            <div class="loading">
              <div class="spinner"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.setupEventListeners();
    await this.loadInventory();
  },

  setupEventListeners() {
    const adjustBtn = document.getElementById('adjust-inventory-btn');
    if (adjustBtn) {
      adjustBtn.addEventListener('click', () => this.showAdjustModal());
    }

    // Botón limpiar filtros
    const clearFiltersBtn = document.getElementById('clear-filters-btn');
    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener('click', () => {
        this.currentFilters = { stockStatus: 'all' };
        document.getElementById('search-filter').value = '';
        document.getElementById('warehouse-filter').value = '';
        document.getElementById('stock-status-filter').value = 'all';
        clearFiltersBtn.style.display = 'none';
        this.filterAndRender();
      });
    }

    document.getElementById('warehouse-filter')?.addEventListener('change', (e) => {
      const value = e.target.value;
      console.log('Warehouse filter changed to:', value);
      
      if (value === '' || value === null) {
        delete this.currentFilters.warehouseId;
      } else {
        this.currentFilters.warehouseId = value;
      }
      
      this.updateClearFiltersButton();
      this.filterAndRender();
    });

    document.getElementById('stock-status-filter')?.addEventListener('change', (e) => {
      const value = e.target.value;
      console.log('Stock status filter changed to:', value);
      this.currentFilters.stockStatus = value;
      this.updateClearFiltersButton();
      this.filterAndRender();
    });

    document.getElementById('search-filter')?.addEventListener('input', (e) => {
      const value = e.target.value;
      console.log('Search filter changed to:', value);
      
      if (value.trim() === '') {
        delete this.currentFilters.searchTerm;
      } else {
        this.currentFilters.searchTerm = value.toLowerCase();
      }
      
      this.updateClearFiltersButton();
      this.filterAndRender();
    });
  },

  updateClearFiltersButton() {
    const clearBtn = document.getElementById('clear-filters-btn');
    if (clearBtn) {
      const hasFilters = this.currentFilters.searchTerm || 
                        this.currentFilters.warehouseId || 
                        this.currentFilters.stockStatus !== 'all';
      clearBtn.style.display = hasFilters ? 'flex' : 'none';
    }
  },

  async loadWarehouses() {
    try {
      const response = await api.getWarehouses({ limit: 100 });
      const normalized = utils.normalizeResponse(response);
      this.warehouses = normalized.data || [];
    } catch (error) {
      console.error('Error loading warehouses:', error);
      this.warehouses = [];
    }
  },

  async loadProducts() {
    try {
      const response = await api.getProducts({ limit: 100 });
      const normalized = utils.normalizeResponse(response);
      this.products = normalized.data || [];
    } catch (error) {
      console.error('Error loading products:', error);
      this.products = [];
    }
  },

  async loadInventory() {
    try {
      const response = await api.getInventoryLevels({});
      const normalized = utils.normalizeResponse(response);
      this.inventoryData = normalized.data || [];
      this.filterAndRender();
    } catch (error) {
      console.error('Error loading inventory:', error);
      utils.showToast('Error al cargar inventario', 'error');
    }
  },

  filterAndRender() {
    let filtered = [...this.inventoryData];

    console.log('Total inventory items:', filtered.length);
    console.log('Current filters:', this.currentFilters);

    // Filtrar por almacén
    if (this.currentFilters.warehouseId && this.currentFilters.warehouseId !== '') {
      console.log('Filtering by warehouse:', this.currentFilters.warehouseId);
      filtered = filtered.filter(item => {
        // Comparar ambos como strings para evitar problemas de tipo
        const match = item.warehouseId === this.currentFilters.warehouseId || 
                     item.warehouseId === parseInt(this.currentFilters.warehouseId, 10);
        if (!match) {
          console.log(`Item warehouse ${item.warehouseId} doesn't match filter ${this.currentFilters.warehouseId}`);
        }
        return match;
      });
      console.log('After warehouse filter:', filtered.length);
    }

    // Filtrar por estado de stock
    if (this.currentFilters.stockStatus && this.currentFilters.stockStatus !== 'all') {
      console.log('Filtering by stock status:', this.currentFilters.stockStatus);
      filtered = filtered.filter(item => {
        const quantity = parseInt(item.quantity || 0);
        const minStock = parseInt(item.product?.minStock || 0);
        const isLow = quantity <= minStock;
        
        const match = this.currentFilters.stockStatus === 'low' ? isLow : !isLow;
        return match;
      });
      console.log('After stock status filter:', filtered.length);
    }

    // Filtrar por búsqueda
    if (this.currentFilters.searchTerm && this.currentFilters.searchTerm.trim() !== '') {
      console.log('Filtering by search term:', this.currentFilters.searchTerm);
      const searchLower = this.currentFilters.searchTerm.trim().toLowerCase();
      filtered = filtered.filter(item => {
        const productName = (item.product?.name || '').toLowerCase();
        const sku = (item.product?.sku || '').toLowerCase();
        const match = productName.includes(searchLower) || sku.includes(searchLower);
        return match;
      });
      console.log('After search filter:', filtered.length);
    }

    console.log('Final filtered items:', filtered.length);
    this.renderStats(filtered);
    this.renderInventoryTable(filtered);
  },

  renderStats(data) {
    const container = document.getElementById('inventory-stats');
    if (!container) return;

    const totalProducts = new Set(data.map(item => item.productId)).size;
    const totalQuantity = data.reduce((sum, item) => sum + parseInt(item.quantity), 0);
    const lowStock = data.filter(item => parseInt(item.quantity) <= parseInt(item.product?.minStock || 0)).length;
    const totalLocations = data.length;

    container.innerHTML = `
      <div class="stat-card">
        <div class="stat-label">Productos</div>
        <div class="stat-value">${totalProducts}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Ubicaciones</div>
        <div class="stat-value">${totalLocations}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Unidades Totales</div>
        <div class="stat-value">${utils.formatNumber(totalQuantity, 0)}</div>
      </div>
      <div class="stat-card ${lowStock > 0 ? 'stat-warning' : ''}">
        <div class="stat-label">Stock Bajo</div>
        <div class="stat-value">${lowStock}</div>
      </div>
    `;
  },

  renderInventoryTable(data) {
    const container = document.getElementById('inventory-table-container');

    if (!data || data.length === 0) {
      utils.showEmptyState(container, 'No hay inventario que mostrar');
      return;
    }

    // Agrupar por producto
    const groupedByProduct = {};
    data.forEach(item => {
      const productId = item.productId;
      if (!groupedByProduct[productId]) {
        groupedByProduct[productId] = {
          product: item.product,
          warehouses: [],
          totalQuantity: 0,
          hasLowStock: false
        };
      }
      groupedByProduct[productId].warehouses.push({
        warehouse: item.warehouse,
        quantity: item.quantity,
        warehouseId: item.warehouseId
      });
      groupedByProduct[productId].totalQuantity += parseInt(item.quantity);
      
      const isLow = parseInt(item.quantity) <= parseInt(item.product?.minStock || 0);
      if (isLow) {
        groupedByProduct[productId].hasLowStock = true;
      }
    });

    const html = `
      <div class="inventory-grouped">
        ${Object.entries(groupedByProduct).map(([productId, productData]) => {
          const isExpanded = this.expandedProducts.has(productId);
          const totalQty = productData.totalQuantity;
          const minStock = productData.product?.minStock || 0;
          const isLowOverall = totalQty <= minStock;
          
          return `
            <div class="inventory-product-card ${isExpanded ? 'expanded' : ''}">
              <div class="inventory-product-header" onclick="inventoryView.toggleProduct('${productId}')">
                <div class="product-main-info">
                  <div class="expand-icon">${isExpanded ? '▼' : '▶'}</div>
                  <div>
                    <div class="product-name">${utils.escapeHtml(productData.product?.name || 'N/A')}</div>
                    <div class="product-sku">SKU: ${utils.escapeHtml(productData.product?.sku || 'N/A')}</div>
                  </div>
                </div>
                <div class="product-summary">
                  <div class="summary-item">
                    <span class="summary-label">Total:</span>
                    <span class="summary-value">${utils.formatNumber(totalQty, 0)}</span>
                  </div>
                  <div class="summary-item">
                    <span class="summary-label">Stock Mín:</span>
                    <span class="summary-value">${utils.formatNumber(minStock, 0)}</span>
                  </div>
                  <div class="summary-item">
                    <span class="summary-label">Almacenes:</span>
                    <span class="summary-value">${productData.warehouses.length}</span>
                  </div>
                  <div class="summary-status">
                    ${isLowOverall ? '<span class="badge danger">Stock Bajo</span>' : '<span class="badge success">OK</span>'}
                  </div>
                </div>
              </div>
              
              ${isExpanded ? `
                <div class="inventory-warehouses">
                  <table class="warehouses-table">
                    <thead>
                      <tr>
                        <th>Almacén</th>
                        <th class="text-right">Cantidad</th>
                        <th>Estado</th>
                        <th class="text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${productData.warehouses.map(wh => {
                        const isLow = parseInt(wh.quantity) <= minStock;
                        return `
                          <tr>
                            <td>
                              <strong>${utils.escapeHtml(wh.warehouse?.name || 'N/A')}</strong>
                            </td>
                            <td class="text-right">
                              <strong>${utils.formatNumber(wh.quantity, 0)}</strong>
                            </td>
                            <td>
                              ${isLow ? '<span class="badge danger small">Bajo</span>' : '<span class="badge success small">OK</span>'}
                            </td>
                            <td class="text-right">
                              ${auth.canManage() ? 
                                `<button class="btn btn-sm btn-secondary" onclick="inventoryView.showAdjustModal(${productId}, ${wh.warehouseId})">
                                  Ajustar
                                </button>` : ''
                              }
                            </td>
                          </tr>
                        `;
                      }).join('')}
                    </tbody>
                  </table>
                </div>
              ` : ''}
            </div>
          `;
        }).join('')}
      </div>
    `;

    container.innerHTML = html;
  },

  toggleProduct(productId) {
    if (this.expandedProducts.has(productId)) {
      this.expandedProducts.delete(productId);
    } else {
      this.expandedProducts.add(productId);
    }
    this.filterAndRender();
  },

  showAdjustModal(productId = null, warehouseId = null) {
    const modalHtml = `
      <div class="modal-overlay" id="adjust-modal">
        <div class="modal">
          <div class="modal-header">
            <h3 class="modal-title">Ajustar Inventario</h3>
            <button class="modal-close" onclick="document.getElementById('adjust-modal').remove()">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2"/>
              </svg>
            </button>
          </div>
          <form id="adjust-form">
            <div class="modal-body">
              <div class="form-group">
                <label>Producto *</label>
                <select name="productId" required ${productId ? 'disabled' : ''}>
                  <option value="">Seleccionar...</option>
                  ${this.products.map(p => `<option value="${p.id}" ${productId == p.id ? 'selected' : ''}>${utils.escapeHtml(p.name)}</option>`).join('')}
                </select>
                ${productId ? `<input type="hidden" name="productId" value="${productId}">` : ''}
              </div>
              
              <div class="form-group">
                <label>Almacén *</label>
                <select name="warehouseId" required ${warehouseId ? 'disabled' : ''}>
                  <option value="">Seleccionar...</option>
                  ${this.warehouses.map(w => `<option value="${w.id}" ${warehouseId == w.id ? 'selected' : ''}>${utils.escapeHtml(w.name)}</option>`).join('')}
                </select>
                ${warehouseId ? `<input type="hidden" name="warehouseId" value="${warehouseId}">` : ''}
              </div>
              
              <div class="form-group">
                <label>Nueva Cantidad *</label>
                <input type="number" name="quantity" step="1" min="0" required>
              </div>
              
              <div class="form-group">
                <label>Motivo *</label>
                <textarea name="reason" required placeholder="Ej: Conteo físico anual, corrección de errores, etc."></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" onclick="document.getElementById('adjust-modal').remove()">Cancelar</button>
              <button type="submit" class="btn btn-primary">Ajustar</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    document.getElementById('adjust-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.adjustInventory(e.target);
    });
  },

  async adjustInventory(form) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    data.quantity = parseInt(data.quantity, 10);

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Ajustando...';

    try {
      await api.adjustInventory(data);
      utils.showToast('Inventario ajustado correctamente', 'success');
      document.getElementById('adjust-modal').remove();
      await this.loadInventory();
    } catch (error) {
      console.error('Error adjusting inventory:', error);
      utils.showToast(error.message || 'Error al ajustar inventario', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Ajustar';
    }
  }
};

window.inventoryView = inventoryView;
