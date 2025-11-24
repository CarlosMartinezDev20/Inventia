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
        <div>
          <h1 class="page-title">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style="vertical-align: middle; margin-right: 8px; color: var(--primary);">
              <path d="M3 3H21V8H3V3ZM3 10H21V15H3V10ZM3 17H21V22H3V17Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Inventario
          </h1>
          <p class="page-subtitle">Control de stock por producto y almacén</p>
        </div>
        <div class="page-actions">
          ${auth.canManage() ? '<button class="btn btn-primary" id="adjust-inventory-btn"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 6V12M12 12V18M12 12H18M12 12H6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg> Ajustar Inventario</button>' : ''}
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
      <div class="stat-card-modern">
        <div class="stat-icon-wrapper stat-icon-blue">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M20 7H4C2.9 7 2 7.9 2 9V19C2 20.1 2.9 21 4 21H20C21.1 21 22 20.1 22 19V9C22 7.9 21.1 7 20 7Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M16 21V5C16 4.46957 15.7893 3.96086 15.4142 3.58579C15.0391 3.21071 14.5304 3 14 3H10C9.46957 3 8.96086 3.21071 8.58579 3.58579C8.21071 3.96086 8 4.46957 8 5V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="stat-content-modern">
          <div class="stat-label-modern">Productos</div>
          <div class="stat-value-modern">${totalProducts}</div>
        </div>
      </div>
      <div class="stat-card-modern">
        <div class="stat-icon-wrapper stat-icon-purple">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M21 10H3M16 2V6M8 2V6M7.8 22H16.2C17.8802 22 18.7202 22 19.362 21.673C19.9265 21.3854 20.3854 20.9265 20.673 20.362C21 19.7202 21 18.8802 21 17.2V8.8C21 7.11984 21 6.27976 20.673 5.63803C20.3854 5.07354 19.9265 4.6146 19.362 4.32698C18.7202 4 17.8802 4 16.2 4H7.8C6.11984 4 5.27976 4 4.63803 4.32698C4.07354 4.6146 3.6146 5.07354 3.32698 5.63803C3 6.27976 3 7.11984 3 8.8V17.2C3 18.8802 3 19.7202 3.32698 20.362C3.6146 20.9265 4.07354 21.3854 4.63803 21.673C5.27976 22 6.11984 22 7.8 22Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="stat-content-modern">
          <div class="stat-label-modern">Ubicaciones</div>
          <div class="stat-value-modern">${totalLocations}</div>
        </div>
      </div>
      <div class="stat-card-modern">
        <div class="stat-icon-wrapper stat-icon-orange">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M16 8V5L19 2L20 3L23 4L20 7H17V10L16 8ZM2 12H4V22H2V12ZM6 10H8V22H6V10ZM10 6H12V22H10V6ZM14 13H16V22H14V13Z" fill="currentColor"/>
          </svg>
        </div>
        <div class="stat-content-modern">
          <div class="stat-label-modern">Unidades Totales</div>
          <div class="stat-value-modern">${utils.formatNumber(totalQuantity, 0)}</div>
        </div>
      </div>
      <div class="stat-card-modern ${lowStock > 0 ? 'stat-warning-modern' : 'stat-success-modern'}">
        <div class="stat-icon-wrapper ${lowStock > 0 ? 'stat-icon-red' : 'stat-icon-green'}">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M10.29 3.86L1.82 18C1.64537 18.3024 1.55296 18.6453 1.55199 18.9945C1.55101 19.3437 1.64151 19.6871 1.81445 19.9905C1.98738 20.2939 2.23675 20.5467 2.53773 20.7239C2.83871 20.9011 3.18082 20.9962 3.53 21H20.47C20.8192 20.9962 21.1613 20.9011 21.4623 20.7239C21.7633 20.5467 22.0126 20.2939 22.1856 19.9905C22.3585 19.6871 22.449 19.3437 22.448 18.9945C22.447 18.6453 22.3546 18.3024 22.18 18L13.71 3.86C13.5317 3.56611 13.2807 3.32312 12.9812 3.15448C12.6817 2.98585 12.3437 2.89725 12 2.89725C11.6563 2.89725 11.3183 2.98585 11.0188 3.15448C10.7193 3.32312 10.4683 3.56611 10.29 3.86Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12 9V13M12 17H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="stat-content-modern">
          <div class="stat-label-modern">Stock Bajo</div>
          <div class="stat-value-modern">${lowStock}</div>
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
          const isLowOverall = totalQty <= minStock;
          
          return `
            <div class="inventory-card-modern ${isExpanded ? 'expanded' : ''}">
              <div class="inventory-card-header" onclick="inventoryView.toggleProduct('${productId}')">
                <div class="product-info-section">
                  <div class="expand-button">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" class="expand-icon-svg ${isExpanded ? 'rotated' : ''}">
                      <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </div>
                  <div class="product-details">
                    <div class="product-name-modern">${utils.escapeHtml(productData.product?.name || 'N/A')}</div>
                    <div class="product-sku-modern">SKU: ${utils.escapeHtml(productData.product?.sku || 'N/A')}</div>
                  </div>
                </div>
                <div class="product-metrics">
                  <div class="metric-item">
                    <span class="metric-label">TOTAL</span>
                    <span class="metric-value ${isLowOverall ? 'metric-warning' : 'metric-success'}">${utils.formatNumber(totalQty, 0)}</span>
                  </div>
                  <div class="metric-divider"></div>
                  <div class="metric-item">
                    <span class="metric-label">STOCK MÍN</span>
                    <span class="metric-value">${utils.formatNumber(minStock, 0)}</span>
                  </div>
                  <div class="metric-divider"></div>
                  <div class="metric-item">
                    <span class="metric-label">ALMACENES</span>
                    <span class="metric-value">${productData.warehouses.length}</span>
                  </div>
                  <div class="metric-badge">
                    ${isLowOverall ? '<span class="badge danger">Stock Bajo</span>' : '<span class="badge success">OK</span>'}
                  </div>
                </div>
              </div>
              
              ${isExpanded ? `
                <div class="warehouses-detail-section">
                  <div class="warehouses-grid">
                    ${productData.warehouses.map(wh => {
                      const isLow = parseInt(wh.quantity) <= minStock;
                      return `
                        <div class="warehouse-card-mini ${isLow ? 'warehouse-low' : 'warehouse-ok'}">
                          <div class="warehouse-header-mini">
                            <div class="warehouse-icon">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                              </svg>
                            </div>
                            <div class="warehouse-name-mini">${utils.escapeHtml(wh.warehouse?.name || 'N/A')}</div>
                          </div>
                          <div class="warehouse-body-mini">
                            <div class="warehouse-quantity-display">
                              <span class="quantity-number">${utils.formatNumber(wh.quantity, 0)}</span>
                              <span class="quantity-label">unidades</span>
                            </div>
                            <div class="warehouse-status-badge">
                              ${isLow ? '<span class="badge danger">Stock Bajo</span>' : '<span class="badge success">OK</span>'}
                            </div>
                          </div>
                          ${auth.canManage() ? 
                            `<button class="btn-adjust-mini" onclick="inventoryView.showAdjustModal('${productId}', '${wh.warehouseId}')">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M12 6V12M12 12V18M12 12H18M12 12H6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                              </svg>
                              Ajustar
                            </button>` : ''
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
