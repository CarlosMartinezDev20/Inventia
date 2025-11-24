// Vista de Productos
const productsView = {
  categories: [],
  currentPage: 1,
  filters: {},

  async render(container) {
    // Cargar categorías primero
    await this.loadCategories();

    container.innerHTML = `
      <div class="page-header">
        <div class="page-header-content">
          <div class="page-header-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M20 7L12 3L4 7M20 7L12 11M20 7V17L12 21M12 11L4 7M12 11V21M4 7V17L12 21" stroke="currentColor" stroke-width="2"/>
            </svg>
          </div>
          <div>
            <h1 class="page-title">Productos</h1>
            <p class="page-subtitle">Gestiona tu catálogo de productos</p>
          </div>
        </div>
        <div class="page-actions">
          ${permissions.canPerformAction('products', 'create') ? '<button class="btn btn-primary" id="add-product-btn"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg> Nuevo Producto</button>' : ''}
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
              <input type="text" id="search-input" placeholder="Nombre o SKU...">
            </div>
          </div>
          
          <div class="filter-group">
            <label class="filter-label">Categoría</label>
            <div class="select-wrapper">
              <select id="category-filter">
                <option value="">Todas las categorías</option>
                ${this.categories.map(cat => `<option value="${cat.id}">${utils.escapeHtml(cat.name)}</option>`).join('')}
              </select>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>
          </div>

          <div class="filter-group">
            <label class="filter-label">Estado</label>
            <label class="checkbox-modern">
              <input type="checkbox" id="low-stock-filter">
              <span class="checkbox-box">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
                </svg>
              </span>
              <span class="checkbox-label">Solo stock bajo</span>
            </label>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-body">
          <div id="products-table-container">
            <div class="loading">
              <div class="spinner"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Event listeners
    this.setupEventListeners();

    // Cargar productos
    await this.loadProducts();
  },

  setupEventListeners() {
    // Botón agregar producto
    const addBtn = document.getElementById('add-product-btn');
    if (addBtn) {
      addBtn.addEventListener('click', () => this.showProductModal());
    }

    // Botón limpiar filtros
    const clearFiltersBtn = document.getElementById('clear-filters-btn');
    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener('click', () => {
        this.filters = {};
        this.currentPage = 1;
        document.getElementById('search-input').value = '';
        document.getElementById('category-filter').value = '';
        document.getElementById('low-stock-filter').checked = false;
        clearFiltersBtn.style.display = 'none';
        this.loadProducts();
      });
    }

    // Búsqueda
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.addEventListener('input', utils.debounce((e) => {
        this.filters.search = e.target.value;
        this.currentPage = 1;
        this.updateClearFiltersButton();
        this.loadProducts();
      }, 500));
    }

    // Filtro de categoría
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
      categoryFilter.addEventListener('change', (e) => {
        // Si es string vacío, eliminar el filtro
        if (e.target.value === '') {
          delete this.filters.categoryId;
        } else {
          this.filters.categoryId = e.target.value;
        }
        this.currentPage = 1;
        this.updateClearFiltersButton();
        this.loadProducts();
      });
    }

    // Filtro de stock bajo
    const lowStockFilter = document.getElementById('low-stock-filter');
    if (lowStockFilter) {
      lowStockFilter.addEventListener('change', (e) => {
        if (e.target.checked) {
          this.filters.minStockAlert = true;
        } else {
          delete this.filters.minStockAlert;
        }
        this.currentPage = 1;
        this.updateClearFiltersButton();
        this.loadProducts();
      });
    }
  },

  updateClearFiltersButton() {
    const clearBtn = document.getElementById('clear-filters-btn');
    if (clearBtn) {
      const hasFilters = Object.keys(this.filters).length > 0;
      clearBtn.style.display = hasFilters ? 'flex' : 'none';
    }
  },

  async loadCategories() {
    try {
      const response = await api.getCategories({ limit: 100 });
      const normalized = utils.normalizeResponse(response);
      this.categories = normalized.data || [];
    } catch (error) {
      console.error('Error loading categories:', error);
      this.categories = [];
    }
  },

  async loadProducts() {
    try {
      const params = {
        page: this.currentPage,
        limit: 20,
        ...this.filters
      };

      const response = await api.getProducts(params);
      const normalized = utils.normalizeResponse(response);
      this.renderProductsTable(normalized);
    } catch (error) {
      console.error('Error loading products:', error);
      utils.showToast('Error al cargar productos: ' + error.message, 'error');
      
      // Mostrar error en el contenedor
      const container = document.getElementById('products-table-container');
      if (container) {
        container.innerHTML = `
          <div class="alert alert-danger">
            <div class="alert-content">
              <div class="alert-title">Error al cargar productos</div>
              <div>${error.message}</div>
            </div>
          </div>
        `;
      }
    }
  },

  renderProductsTable(response) {
    const container = document.getElementById('products-table-container');

    if (!response.data || response.data.length === 0) {
      utils.showEmptyState(container, 'No se encontraron productos');
      return;
    }

    const html = `
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Nombre</th>
              <th>Categoría</th>
              <th>Unidad</th>
              <th class="text-right">Stock Mínimo</th>
              <th class="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${response.data.map(product => this.renderProductRow(product)).join('')}
          </tbody>
        </table>
      </div>

      ${this.renderPagination(response.meta)}
    `;

    container.innerHTML = html;
    this.attachRowEventListeners();
  },

  renderProductRow(product) {
    const category = product.category ? product.category.name : 'Sin categoría';
    
    return `
      <tr data-id="${product.id}">
        <td><strong>${utils.escapeHtml(product.sku)}</strong></td>
        <td>
          <div>${utils.escapeHtml(product.name)}</div>
          ${product.description ? `<div style="font-size: 12px; color: var(--gray-600);">${utils.escapeHtml(product.description).substring(0, 60)}...</div>` : ''}
        </td>
        <td><span class="badge gray">${utils.escapeHtml(category)}</span></td>
        <td>${utils.getUnitName(product.unit)}</td>
        <td class="text-right">${utils.formatNumber(product.minStock || 0, 0)}</td>
        <td class="text-right">
          <div class="action-buttons">
            <button class="action-btn view" data-action="view" title="Ver detalles">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" stroke-width="2"/>
                <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
              </svg>
            </button>
            ${permissions.canPerformAction('products', 'update') ? `
              <button class="action-btn edit" data-action="edit" title="Editar">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  <path d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            ` : ''}
            ${permissions.canPerformAction('products', 'delete') ? `
              <button class="action-btn delete" data-action="delete" title="Eliminar">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 6H5H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  },

  renderPagination(meta) {
    if (!meta || meta.totalPages <= 1) return '';

    const pages = [];
    for (let i = 1; i <= meta.totalPages; i++) {
      if (i === 1 || i === meta.totalPages || (i >= meta.page - 1 && i <= meta.page + 1)) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }

    return `
      <div class="pagination">
        <button ${meta.page === 1 ? 'disabled' : ''} onclick="productsView.goToPage(${meta.page - 1})">Anterior</button>
        ${pages.map(page => {
          if (page === '...') return '<span>...</span>';
          return `<button class="${page === meta.page ? 'active' : ''}" onclick="productsView.goToPage(${page})">${page}</button>`;
        }).join('')}
        <button ${meta.page === meta.totalPages ? 'disabled' : ''} onclick="productsView.goToPage(${meta.page + 1})">Siguiente</button>
      </div>
    `;
  },

  attachRowEventListeners() {
    document.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const action = btn.dataset.action;
        const row = btn.closest('tr');
        const id = row.dataset.id;

        if (action === 'view') {
          await this.viewProduct(id);
        } else if (action === 'edit') {
          await this.showProductModal(id);
        } else if (action === 'delete') {
          await this.deleteProduct(id);
        }
      });
    });
  },

  async viewProduct(id) {
    try {
      const product = await api.getProduct(id);

      const modalHtml = `
        <div class="modal-overlay" id="view-modal">
          <div class="modal">
            <div class="modal-header">
              <h3 class="modal-title">Detalles del Producto</h3>
              <button class="modal-close" onclick="document.getElementById('view-modal').remove()">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </button>
            </div>
            <div class="modal-body">
              <div class="grid grid-2">
                <div>
                  <label style="display: block; font-weight: 600; margin-bottom: 4px; color: var(--gray-600);">SKU</label>
                  <div style="margin-bottom: 16px;">${utils.escapeHtml(product.sku)}</div>
                </div>
                <div>
                  <label style="display: block; font-weight: 600; margin-bottom: 4px; color: var(--gray-600);">Nombre</label>
                  <div style="margin-bottom: 16px;">${utils.escapeHtml(product.name)}</div>
                </div>
                <div>
                  <label style="display: block; font-weight: 600; margin-bottom: 4px; color: var(--gray-600);">Categoría</label>
                  <div style="margin-bottom: 16px;">${product.category ? utils.escapeHtml(product.category.name) : 'Sin categoría'}</div>
                </div>
                <div>
                  <label style="display: block; font-weight: 600; margin-bottom: 4px; color: var(--gray-600);">Unidad</label>
                  <div style="margin-bottom: 16px;">${utils.getUnitName(product.unit)}</div>
                </div>
                <div>
                  <label style="display: block; font-weight: 600; margin-bottom: 4px; color: var(--gray-600);">Stock Mínimo</label>
                  <div style="margin-bottom: 16px;">${utils.formatNumber(product.minStock || 0, 0)}</div>
                </div>
              </div>
              ${product.barcode ? `
                <div style="margin-bottom: 16px;">
                  <label style="display: block; font-weight: 600; margin-bottom: 4px; color: var(--gray-600);">Código de Barras</label>
                  <div style="font-family: 'Courier New', monospace; font-size: 16px; padding: 8px; background: #f3f4f6; border-radius: 6px; display: inline-block;">${utils.escapeHtml(product.barcode)}</div>
                </div>
              ` : ''}
              ${product.description ? `
                <div>
                  <label style="display: block; font-weight: 600; margin-bottom: 4px; color: var(--gray-600);">Descripción</label>
                  <div>${utils.escapeHtml(product.description)}</div>
                </div>
              ` : ''}
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" onclick="document.getElementById('view-modal').remove()">Cerrar</button>
            </div>
          </div>
        </div>
      `;

      document.body.insertAdjacentHTML('beforeend', modalHtml);
    } catch (error) {
      console.error('Error viewing product:', error);
      utils.showToast('Error al cargar el producto', 'error');
    }
  },

  async showProductModal(productId = null) {
    let product = null;
    let nextNumber = 1;
    
    if (productId) {
      try {
        product = await api.getProduct(productId);
        // El API client ya desenvuelve la respuesta, product es el objeto directamente
      } catch (error) {
        console.error('Error loading product:', error);
        utils.showToast('Error al cargar el producto', 'error');
        return;
      }
    } else {
      // Obtener el último número de SKU para el correlativo
      try {
        const response = await api.getProducts({ limit: 1, sortBy: 'createdAt', sortOrder: 'desc' });
        const normalized = utils.normalizeResponse(response);
        if (normalized.data && normalized.data.length > 0) {
          const lastProduct = normalized.data[0];
          // Extraer el número del SKU (formato esperado: XXX-0001)
          const match = lastProduct.sku.match(/-(\d+)$/);
          if (match) {
            nextNumber = parseInt(match[1], 10) + 1;
          }
        }
      } catch (error) {
        console.error('Error getting last product:', error);
      }
    }

    const modalHtml = `
      <div class="modal-overlay" id="product-modal">
        <div class="modal" style="max-width: 700px;">
          <div class="modal-header">
            <h3 class="modal-title">${product ? 'Editar Producto' : 'Nuevo Producto'}</h3>
            <button class="modal-close" onclick="document.getElementById('product-modal').remove()">×</button>
          </div>
          <form id="product-form">
            <div class="modal-body" style="max-height: 75vh; overflow-y: auto;">
              <div class="form-group">
                <label>Nombre *</label>
                <input type="text" name="name" id="product-name" required 
                       value="${product ? utils.escapeHtml(product.name) : ''}" 
                       placeholder="Ej: Laptop Dell XPS 15"
                       ${!product ? 'autofocus' : ''}>
                ${!product ? '<small style="color: #6b7280;">El SKU y código se generarán automáticamente</small>' : ''}
              </div>

              <div class="grid grid-2" style="gap: 16px;">
                <div class="form-group" style="margin: 0;">
                  <label>SKU * ${!product ? '<span style="color: #ff6b2c; font-weight: 400;">(Auto)</span>' : ''}</label>
                  <input type="text" name="sku" id="product-sku" required 
                         value="${product ? utils.escapeHtml(product.sku) : ''}" 
                         ${!product ? 'readonly style="background: #f9fafb;"' : ''}
                         placeholder="AUTO">
                  <input type="hidden" id="next-number" value="${nextNumber}">
                </div>
                <div class="form-group" style="margin: 0;">
                  <label>Código de Barras ${!product ? '<span style="color: #ff6b2c; font-weight: 400;">(Auto)</span>' : ''}</label>
                  <input type="text" name="barcode" id="internal-barcode" 
                         value="${product?.barcode || ''}" 
                         ${!product ? 'readonly style="background: #f9fafb; font-family: Consolas, Monaco, monospace;"' : 'style="font-family: Consolas, Monaco, monospace;"'}
                         placeholder="AUTO">
                </div>
              </div>
              
              <div class="form-group">
                <label>Descripción</label>
                <textarea name="description" rows="3" placeholder="Descripción del producto (opcional)">${product?.description || ''}</textarea>
              </div>
              
              <div class="grid grid-2" style="gap: 16px;">
                <div class="form-group" style="margin: 0;">
                  <label>Categoría *</label>
                  <select name="categoryId" required>
                    <option value="">Seleccionar...</option>
                    ${this.categories.map(cat => `
                      <option value="${cat.id}" ${product?.categoryId === cat.id ? 'selected' : ''}>
                        ${utils.escapeHtml(cat.name)}
                      </option>
                    `).join('')}
                  </select>
                </div>
                <div class="form-group" style="margin: 0;">
                  <label>Unidad *</label>
                  <select name="unit" required>
                    ${Object.keys(CONFIG.PRODUCT_UNITS).map(key => `
                      <option value="${key}" ${product?.unit === key ? 'selected' : ''}>
                        ${CONFIG.PRODUCT_UNITS[key]}
                      </option>
                    `).join('')}
                  </select>
                </div>
              </div>
              
              <div class="form-group">
                <label>Stock Mínimo</label>
                <input type="number" name="minStock" step="1" min="0" 
                       value="${product?.minStock || ''}" 
                       placeholder="Cantidad mínima antes de alertar">
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" onclick="document.getElementById('product-modal').remove()">Cancelar</button>
              <button type="submit" class="btn btn-primary">Guardar</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Event listener del form
    document.getElementById('product-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.saveProduct(e.target, productId);
    });

    // Auto-generar SKU y código de barras solo para productos nuevos
    if (!product) {
      const nameInput = document.getElementById('product-name');
      const skuInput = document.getElementById('product-sku');
      const barcodeInput = document.getElementById('internal-barcode');
      const nextNumberInput = document.getElementById('next-number');

      nameInput.addEventListener('input', () => {
        const name = nameInput.value.trim();
        if (name) {
          // Generar SKU desde el nombre
          const sku = this.generateSKU(name, parseInt(nextNumberInput.value, 10));
          skuInput.value = sku;
          
          // Generar código de barras desde el SKU
          const barcode = this.generateEANBarcode(sku);
          barcodeInput.value = barcode;
        } else {
          skuInput.value = '';
          barcodeInput.value = '';
        }
      });
    }
  },

  generateSKU(name, number) {
    // Tomar las primeras 3 letras del nombre (o menos si el nombre es corto)
    const words = name.trim().toUpperCase().split(' ').filter(w => w.length > 0);
    let prefix = '';
    
    if (words.length >= 2) {
      // Si hay 2 o más palabras, tomar primera letra de cada una (max 3)
      prefix = words.slice(0, 3).map(w => w[0]).join('');
    } else if (words.length === 1) {
      // Si hay una sola palabra, tomar las primeras 3 letras
      prefix = words[0].substring(0, 3);
    }
    
    // Limpiar caracteres especiales y mantener solo letras
    prefix = prefix.replace(/[^A-Z]/g, '').substring(0, 3);
    
    // Si el prefijo es muy corto, rellenar con X
    while (prefix.length < 3) {
      prefix += 'X';
    }
    
    // Formatear número con ceros a la izquierda (4 dígitos)
    const paddedNumber = String(number).padStart(4, '0');
    
    return `${prefix}-${paddedNumber}`;
  },

  generateEANBarcode(sku) {
    // Generar un código de barras EAN-13 basado en el SKU
    
    // Convertir SKU a números (usar código ASCII)
    let numericCode = '';
    for (let i = 0; i < sku.length; i++) {
      const charCode = sku.charCodeAt(i);
      numericCode += String(charCode);
    }
    
    // Tomar los primeros 12 dígitos
    let barcode12 = numericCode.substring(0, 12).padEnd(12, '0');
    
    // Calcular dígito de control EAN-13
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(barcode12[i], 10);
      // Los dígitos en posiciones impares (1, 3, 5...) se multiplican por 3
      sum += (i % 2 === 0) ? digit : digit * 3;
    }
    
    const checkDigit = (10 - (sum % 10)) % 10;
    
    return barcode12 + checkDigit;
  },

  async saveProduct(form, productId) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // Convertir minStock a entero
    if (data.minStock) {
      data.minStock = parseInt(data.minStock, 10);
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Guardando...';

    try {
      if (productId) {
        await api.updateProduct(productId, data);
        utils.showToast('Producto actualizado correctamente', 'success');
      } else {
        await api.createProduct(data);
        utils.showToast('Producto creado correctamente', 'success');
      }

      document.getElementById('product-modal').remove();
      await this.loadProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      utils.showToast(error.message || 'Error al guardar el producto', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Guardar';
    }
  },

  async deleteProduct(id) {
    const confirmed = await utils.confirm(
      'Esta acción no se puede deshacer. El producto será eliminado permanentemente.',
      '¿Eliminar producto?'
    );

    if (!confirmed) return;

    try {
      await api.deleteProduct(id);
      utils.showToast(
        'El producto ha sido eliminado permanentemente del sistema',
        'success',
        'Producto eliminado',
        4000
      );
      await this.loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      utils.showToast(error.message || 'Error al eliminar el producto', 'error');
    }
  },

  goToPage(page) {
    this.currentPage = page;
    this.loadProducts();
  }
};

window.productsView = productsView;
