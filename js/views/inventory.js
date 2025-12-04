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
              <rect x="2" y="2" width="9" height="9" rx="2" stroke="currentColor" stroke-width="2"/>
              <rect x="2" y="13" width="9" height="9" rx="2" stroke="currentColor" stroke-width="2"/>
              <rect x="13" y="2" width="9" height="9" rx="2" stroke="currentColor" stroke-width="2"/>
              <rect x="13" y="13" width="9" height="9" rx="2" stroke="currentColor" stroke-width="2"/>
            </svg>
          </div>
          <div>
            <h1 class="page-title">Inventario</h1>
            <p class="page-subtitle">Control de stock por producto y almacén</p>
          </div>
        </div>
        <div class="page-actions">
          ${auth.canManage() ? '<button class="btn btn-primary" id="adjust-inventory-btn"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg> Ajustar Inventario</button>' : ''}
        </div>
      </div>

      <div id="inventory-stats" class="stats-grid" style="margin-bottom: 20px;"></div>

      <div class="inventory-filters-container">
        <div class="filters-section">
          <div class="filter-item-modern">
            <label class="filter-label-modern">Buscar</label>
            <div class="search-input-wrapper">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2"/>
                <path d="M21 21L16.65 16.65" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              <input type="text" id="search-filter" placeholder="Buscar por producto o SKU..." class="search-input-modern">
            </div>
          </div>
          
          <div class="filter-item-modern">
            <label class="filter-label-modern">Almacén</label>
            <div class="select-wrapper-modern">
              <select id="warehouse-filter" class="select-modern">
                <option value="">Todos los almacenes</option>
                ${this.warehouses.map(w => `<option value="${w.id}">${utils.escapeHtml(w.name)}</option>`).join('')}
              </select>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>
          </div>

          <div class="filter-item-modern">
            <label class="filter-label-modern">Estado de Stock</label>
            <div class="select-wrapper-modern">
              <select id="stock-status-filter" class="select-modern">
                <option value="all">Todos los estados</option>
                <option value="low">Stock bajo</option>
                <option value="ok">Stock OK</option>
              </select>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>
          </div>
          
          <div class="filter-actions">
            <button class="btn-clear-filters" id="clear-filters-btn" style="display: none;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              Limpiar
            </button>
          </div>
        </div>
      </div>

      <div id="inventory-table-container">
        <div class="loading-minimal">
          <div class="spinner-minimal"></div>
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
      this.currentFilters.stockStatus = value;
      this.updateClearFiltersButton();
      this.filterAndRender();
    });

    document.getElementById('search-filter')?.addEventListener('input', (e) => {
      const value = e.target.value;
      
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
        const isLow = quantity < minStock;
        
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
    const lowStock = data.filter(item => parseInt(item.quantity) < parseInt(item.product?.minStock || 0)).length;
    const totalLocations = data.length;

    container.innerHTML = `
      <div class="inv-stat-card">
        <div class="inv-stat-body">
          <div class="inv-stat-label">Productos</div>
          <div class="inv-stat-value">${totalProducts}</div>
        </div>
        <div class="inv-stat-icon" style="background: #EFF6FF; color: #3B82F6;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="7" rx="1"/>
            <rect x="14" y="3" width="7" height="7" rx="1"/>
            <rect x="14" y="14" width="7" height="7" rx="1"/>
            <rect x="3" y="14" width="7" height="7" rx="1"/>
          </svg>
        </div>
      </div>
      <div class="inv-stat-card">
        <div class="inv-stat-body">
          <div class="inv-stat-label">Ubicaciones</div>
          <div class="inv-stat-value">${totalLocations}</div>
        </div>
        <div class="inv-stat-icon" style="background: #F5F3FF; color: #8B5CF6;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9L12 2L21 9V20C21 21.1 20.1 22 19 22H5C3.9 22 3 21.1 3 20V9Z"/>
          </svg>
        </div>
      </div>
      <div class="inv-stat-card">
        <div class="inv-stat-body">
          <div class="inv-stat-label">Total en Stock</div>
          <div class="inv-stat-value">${utils.formatNumber(totalQuantity, 0)}</div>
        </div>
        <div class="inv-stat-icon" style="background: #FFF7ED; color: #F97316;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 16V8C21 7.65 20.91 7.3 20.73 7C20.56 6.7 20.3 6.45 20 6.27L13 2.27C12.7 2.09 12.35 2 12 2C11.65 2 11.3 2.09 11 2.27L4 6.27C3.7 6.45 3.44 6.7 3.27 7C3.09 7.3 3 7.65 3 8V16C3 16.35 3.09 16.7 3.27 17C3.44 17.3 3.7 17.55 4 17.73L11 21.73C11.3 21.91 11.65 22 12 22C12.35 22 12.7 21.91 13 21.73L20 17.73C20.3 17.55 20.56 17.3 20.73 17C20.91 16.7 21 16.35 21 16Z"/>
          </svg>
        </div>
      </div>
      <div class="inv-stat-card ${lowStock > 0 ? 'inv-stat-alert' : 'inv-stat-success'}">
        <div class="inv-stat-body">
          <div class="inv-stat-label">${lowStock > 0 ? 'Alertas de Stock' : 'Todo en Orden'}</div>
          <div class="inv-stat-value">${lowStock}</div>
        </div>
        <div class="inv-stat-icon" style="background: ${lowStock > 0 ? '#FEF2F2' : '#F0FDF4'}; color: ${lowStock > 0 ? '#EF4444' : '#22C55E'};">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            ${lowStock > 0 ? 
              '<path d="M12 9V13M12 17H12.01M10.29 3.86L1.82 18C1.55 18.45 1.55 19 1.82 19.45C2.09 19.9 2.59 20.17 3.12 20.17H20.88C21.41 20.17 21.91 19.9 22.18 19.45C22.45 19 22.45 18.45 22.18 18L13.71 3.86C13.44 3.41 12.94 3.14 12.41 3.14C11.88 3.14 11.38 3.41 11.11 3.86H10.29Z"/>' :
              '<path d="M9 12L11 14L15 10M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"/>'}
          </svg>
        </div>
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
          const isLowOverall = totalQty < minStock;
          
          return `
            <div class="inv-product-card">
              <div class="inv-product-header" onclick="inventoryView.toggleProduct('${productId}')">
                <div class="inv-product-title">
                  <div class="inv-product-name">${utils.escapeHtml(productData.product?.name || 'N/A')}</div>
                  <div class="inv-product-sku">${utils.escapeHtml(productData.product?.sku || 'N/A')}</div>
                </div>
                <div class="inv-product-actions">
                  ${isLowOverall ? '<span class="inv-stock-badge low">⚠ Stock Bajo</span>' : '<span class="inv-stock-badge ok">✓ En Stock</span>'}
                  <button class="inv-expand-btn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" class="inv-expand-icon ${isExpanded ? 'rotated' : ''}">
                      <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    ${isExpanded ? 'Ocultar' : 'Ver'}
                  </button>
                </div>
              </div>
              
              ${isExpanded ? `
                <div class="inv-product-body active">
                  <div class="inv-metrics">
                    <div class="inv-metric">
                      <div class="inv-metric-value ${isLowOverall ? 'warning' : 'success'}">${utils.formatNumber(totalQty, 0)}</div>
                      <div class="inv-metric-label">Stock Total</div>
                    </div>
                    <div class="inv-metric">
                      <div class="inv-metric-value">${utils.formatNumber(minStock, 0)}</div>
                      <div class="inv-metric-label">Mínimo</div>
                    </div>
                    <div class="inv-metric">
                      <div class="inv-metric-value">${productData.warehouses.length}</div>
                      <div class="inv-metric-label">Almacenes</div>
                    </div>
                  </div>
                </div>
                <div class="inv-warehouses-section">
                  <div class="inv-warehouses-grid">
                    ${productData.warehouses.map(wh => {
                      const isLow = parseInt(wh.quantity) < minStock;
                      return `
                        <div class="inv-warehouse-card ${isLow ? 'low-stock' : ''}">
                          <div class="inv-warehouse-header">
                            <span class="inv-warehouse-name">${utils.escapeHtml(wh.warehouse?.name || 'N/A')}</span>
                            ${isLow ? '<div class="inv-warehouse-alert"></div>' : ''}
                          </div>
                          <div class="inv-warehouse-qty">
                            <div class="inv-qty-number">${utils.formatNumber(wh.quantity, 0)}</div>
                            <div class="inv-qty-label">unidades</div>
                          </div>
                          ${auth.canManage() ? 
                            `<div class="inv-warehouse-action">
                              <button class="inv-adjust-btn" onclick="inventoryView.showAdjustModal('${productId}', '${wh.warehouseId}')">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M12 5V19M5 12H19"/>
                                  </svg>
                                  Ajustar
                                </button>
                              </div>` : ''
                          }
                        </div>
                      `;
                    }).join('')}
                  </div>
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
      utils.showToast(
        'El inventario se ha actualizado correctamente en el almacén',
        'success',
        '¡Ajuste realizado!',
        5000
      );
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
