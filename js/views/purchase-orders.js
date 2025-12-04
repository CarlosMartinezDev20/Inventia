// Vista de Órdenes de Compra
const purchaseOrdersView = {
  suppliers: [],
  warehouses: [],
  products: [],

  async render(container) {
    await Promise.all([
      this.loadSuppliers(),
      this.loadWarehouses(),
      this.loadProducts()
    ]);

    container.innerHTML = `
      <div class="page-header">
        <div class="page-header-content">
          <div class="page-header-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M9 7V12M9 12V17M9 12H14M14 12H19M14 12V7M14 12V17" stroke="currentColor" stroke-width="2"/>
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
            </svg>
          </div>
          <div>
            <h1 class="page-title">Órdenes de Compra</h1>
            <p class="page-subtitle">Gestiona las compras a proveedores</p>
          </div>
        </div>
        <div class="page-actions">
          ${auth.canManage() ? '<button class="btn btn-primary" id="add-po-btn"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg> Nueva Orden</button>' : ''}
        </div>
      </div>

      <div class="card">
        <div class="card-body">
          <div id="po-table-container">
            <div class="loading"><div class="spinner"></div></div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('add-po-btn')?.addEventListener('click', () => this.showPOModal());
    await this.loadOrders();
  },

  async loadSuppliers() {
    try {
      const response = await api.getSuppliers({ limit: 100 });
      const normalized = utils.normalizeResponse(response);
      this.suppliers = normalized.data || [];
    } catch (error) {
      console.error('Error loading suppliers:', error);
      this.suppliers = [];
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

  async loadOrders() {
    try {
      const response = await api.getPurchaseOrders({ limit: 50 });
      const normalized = utils.normalizeResponse(response);
      this.renderOrdersTable(normalized);
    } catch (error) {
      console.error('Error loading purchase orders:', error);
      utils.showToast('Error al cargar órdenes', 'error');
    }
  },

  renderOrdersTable(response) {
    const container = document.getElementById('po-table-container');

    if (!response.data || response.data.length === 0) {
      utils.showEmptyState(container, 'No hay órdenes de compra');
      return;
    }

    const html = `
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Proveedor</th>
              <th>Estado</th>
              <th>Fecha Esperada</th>
              <th>Items</th>
              <th class="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${response.data.map(order => `
              <tr>
                <td><strong>#${order.id.substring(0, 8)}</strong></td>
                <td>${utils.escapeHtml(order.supplier?.name || 'N/A')}</td>
                <td>${utils.getStatusBadge(order.status, 'purchase')}</td>
                <td>${order.expectedAt ? utils.formatDate(order.expectedAt) : 'N/A'}</td>
                <td>${order.items?.length || 0}</td>
                <td class="text-right">
                  <div class="action-buttons">
                    <button class="action-btn view" onclick="purchaseOrdersView.viewOrder('${order.id}')">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" stroke-width="2"/>
                        <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
                      </svg>
                    </button>
                    ${order.status === 'DRAFT' && auth.canManage() ? `
                      <button class="action-btn edit" onclick="purchaseOrdersView.markAsOrdered('${order.id}')">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <path d="M9 11L12 14L22 4" stroke="currentColor" stroke-width="2"/>
                        </svg>
                      </button>
                    ` : ''}
                    ${order.status === 'ORDERED' && auth.canManage() ? `
                      <button class="action-btn" onclick="purchaseOrdersView.receiveOrder('${order.id}')">Recibir</button>
                    ` : ''}
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    container.innerHTML = html;
  },

  showPOModal() {
    const modalHtml = `
      <div class="modal-overlay" id="po-modal">
        <div class="modal modal-lg">
          <div class="modal-header">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #FF6B2C 0%, #FF8554 100%); border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M9 7V12M9 12V17M9 12H14M14 12H19M14 12V7M14 12V17" stroke="white" stroke-width="2"/><rect x="3" y="3" width="18" height="18" rx="2" stroke="white" stroke-width="2"/></svg>
              </div>
              <div>
                <h3 class="modal-title" style="margin: 0; font-size: 20px; font-weight: 700; color: #212121;">Nueva Orden de Compra</h3>
                <p style="margin: 0; font-size: 13px; color: #757575; font-weight: 500;">Registra una compra a proveedor</p>
              </div>
            </div>
            <button class="modal-close" onclick="document.getElementById('po-modal').remove()">×</button>
          </div>
          <form id="po-form">
            <div class="modal-body">
              <!-- Sección de Información General -->
              <div style="background: #FAFAFA; border: 1px solid #EEEEEE; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 14px;">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7Z" stroke="#FF6B2C" stroke-width="2"/><path d="M16 21V5C16 3.89543 15.1046 3 14 3H10C8.89543 3 8 3.89543 8 5V21" stroke="#FF6B2C" stroke-width="2"/></svg>
                  <span style="font-size: 13px; font-weight: 700; color: #212121; letter-spacing: -0.02em;">Información General</span>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
                  <div>
                    <label style="display: block; font-size: 12px; font-weight: 600; color: #757575; margin-bottom: 6px;">Proveedor *</label>
                    <select name="supplierId" required style="width: 100%; padding: 10px 12px; border: 1.5px solid #E0E0E0; border-radius: 8px; font-size: 14px; background: white; color: #212121; font-weight: 500;">
                      <option value="">Seleccionar proveedor...</option>
                      ${this.suppliers.map(s => `<option value="${s.id}">${utils.escapeHtml(s.name)}</option>`).join('')}
                    </select>
                  </div>
                  <div>
                    <label style="display: block; font-size: 12px; font-weight: 600; color: #757575; margin-bottom: 6px;">Fecha Esperada</label>
                    <input type="date" name="expectedAt" min="${new Date().toISOString().split('T')[0]}" style="width: 100%; padding: 10px 12px; border: 1.5px solid #E0E0E0; border-radius: 8px; font-size: 14px; background: white; color: #212121; font-weight: 500;">
                  </div>
                </div>
              </div>

              <!-- Sección de Items -->
              <div style="margin-bottom: 16px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7Z" stroke="#FF6B2C" stroke-width="2"/><path d="M16 7V5C16 3.89543 15.1046 3 14 3H10C8.89543 3 8 3.89543 8 5V7" stroke="#FF6B2C" stroke-width="2"/></svg>
                    <span style="font-size: 13px; font-weight: 700; color: #212121; letter-spacing: -0.02em;">Productos</span>
                  </div>
                  <button type="button" class="btn btn-secondary btn-sm" onclick="purchaseOrdersView.addPOItem()" style="font-size: 12px; padding: 6px 12px; display: flex; align-items: center; gap: 6px;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                    Agregar Producto
                  </button>
                </div>
              </div>
              
              <div id="po-items-list" style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px; max-height: 280px; overflow-y: auto; padding-right: 4px;"></div>

              <!-- Resumen del Pedido -->
              <div style="background: white; border: 2px solid #EEEEEE; border-radius: 12px; padding: 18px; margin-top: 20px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 14px;">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15" stroke="#757575" stroke-width="2"/><path d="M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5V7H9V5Z" stroke="#757575" stroke-width="2"/></svg>
                  <span style="font-size: 13px; font-weight: 700; color: #212121;">Resumen de Compra</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 14px; font-weight: 700; color: #212121;">Total a Pagar</span>
                  <span id="po-total" style="font-size: 22px; font-weight: 700; color: #FF6B2C;">$0.00 USD</span>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" onclick="document.getElementById('po-modal').remove()">Cancelar</button>
              <button type="submit" class="btn btn-primary">Crear Orden</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Agregar primer item
    this.addPOItem();
    
    document.getElementById('po-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.savePO(e.target);
    });
  },

  addPOItem() {
    const container = document.getElementById('po-items-list');
    if (!container) return;
    
    const itemDiv = document.createElement('div');
    itemDiv.className = 'po-item-row';
    itemDiv.style.cssText = 'background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; transition: box-shadow 0.2s;';
    
    itemDiv.onmouseover = () => itemDiv.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
    itemDiv.onmouseout = () => itemDiv.style.boxShadow = 'none';
    
    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.style.cssText = 'flex: 0 0 28px; height: 28px; background: white; border: 1px solid #e5e7eb; color: #6b7280; cursor: pointer; border-radius: 6px; display: flex; align-items: center; justify-content: center; transition: all 0.2s;';
    deleteBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
    deleteBtn.onmouseover = () => {
      deleteBtn.style.background = '#fee2e2';
      deleteBtn.style.borderColor = '#fecaca';
      deleteBtn.style.color = '#ef4444';
    };
    deleteBtn.onmouseout = () => {
      deleteBtn.style.background = 'white';
      deleteBtn.style.borderColor = '#e5e7eb';
      deleteBtn.style.color = '#6b7280';
    };
    deleteBtn.onclick = () => {
      itemDiv.remove();
      this.updatePOTotal();
    };
    
    const itemIndex = container.children.length;
    itemDiv.setAttribute('data-item-index', itemIndex);
    
    itemDiv.innerHTML = `
      <div style="background: white; border: 1.5px solid #EEEEEE; border-radius: 10px; padding: 14px; position: relative;">
        <!-- Selector de Producto -->
        <div style="margin-bottom: 12px;">
          <label style="display: block; font-size: 12px; font-weight: 600; color: #757575; margin-bottom: 6px;">Producto</label>
          <select class="po-product-select" required style="width: 100%; padding: 10px 12px; border: 1.5px solid #E0E0E0; border-radius: 8px; font-size: 14px; background: #FAFAFA; color: #212121; font-weight: 500;">
            <option value="">Seleccionar producto...</option>
            ${this.products.map(p => `<option value="${p.id}">${utils.escapeHtml(p.name)} - ${utils.escapeHtml(p.sku)}</option>`).join('')}
          </select>
        </div>
        
        <!-- Grid de Cantidad y Precio -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
          <div>
            <label style="display: block; font-size: 12px; font-weight: 600; color: #757575; margin-bottom: 6px;">Cantidad</label>
            <input type="number" class="po-qty-input" placeholder="0" step="1" min="1" required 
                   style="width: 100%; padding: 10px 12px; border: 1.5px solid #E0E0E0; border-radius: 8px; font-size: 14px; text-align: center; background: white; color: #212121; font-weight: 600;">
          </div>
          <div>
            <label style="display: block; font-size: 12px; font-weight: 600; color: #757575; margin-bottom: 6px;">Precio Unit.</label>
            <input type="number" class="po-price-input" placeholder="0.00" step="0.01" min="0.01" required 
                   style="width: 100%; padding: 10px 12px; border: 1.5px solid #E0E0E0; border-radius: 8px; font-size: 14px; text-align: center; background: white; color: #212121; font-weight: 600;">
          </div>
        </div>
        
        <!-- Botón de Distribución de Almacenes -->
        <button type="button" class="btn-warehouse-allocation" onclick="purchaseOrdersView.showWarehouseAllocation(this, ${itemIndex})" 
                style="width: 100%; padding: 10px 12px; background: #FAFAFA; border: 1.5px solid #E0E0E0; border-radius: 8px; font-size: 13px; color: #757575; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: 600; margin-bottom: 10px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" stroke-width="2"/>
          </svg>
          <span>Distribuir entre almacenes</span>
        </button>
        <div class="warehouse-allocations-container" style="margin-bottom: 10px; display: none;"></div>
        
        <!-- Subtotal del Item -->
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; background: #FAFAFA; border-radius: 8px;">
          <span style="font-size: 13px; font-weight: 600; color: #757575;">Subtotal del Item</span>
          <div class="po-subtotal" style="font-size: 16px; font-weight: 700; color: #FF6B2C;">$0.00 USD</div>
        </div>
      </div>
    `;
    
    // Agregar el botón de eliminar
    itemDiv.querySelector('div').appendChild(deleteBtn);
    
    // Agregar event listeners para los inputs
    const qtyInput = itemDiv.querySelector('.po-qty-input');
    const priceInput = itemDiv.querySelector('.po-price-input');
    const productSelect = itemDiv.querySelector('.po-product-select');
    
    // Estilos de focus
    [qtyInput, priceInput, productSelect].forEach(input => {
      input.addEventListener('focus', () => {
        input.style.borderColor = '#ff6b2c';
        input.style.background = 'white';
      });
      input.addEventListener('blur', () => {
        input.style.borderColor = '#e5e7eb';
        input.style.background = '#fafafa';
      });
    });
    
    qtyInput.addEventListener('input', () => this.updatePOTotal());
    priceInput.addEventListener('input', () => this.updatePOTotal());
    
    container.appendChild(itemDiv);
    this.updatePOTotal();
  },

  async showWarehouseAllocation(button, itemIndex) {
    const itemRow = button.closest('.po-item-row');
    const qtyInput = itemRow.querySelector('.po-qty-input');
    const productSelect = itemRow.querySelector('.po-product-select');
    const totalQty = parseFloat(qtyInput.value) || 0;
    const productId = productSelect?.value;
    
    if (!totalQty) {
      utils.showToast('Ingresa primero la cantidad total', 'error');
      return;
    }
    
    if (!productId) {
      utils.showToast('Selecciona primero un producto', 'error');
      return;
    }
    
    const container = itemRow.querySelector('.warehouse-allocations-container');
    
    // Toggle visibility
    if (container.style.display === 'none') {
      container.style.display = 'block';
      button.style.background = '#dbeafe';
      button.style.borderColor = '#3b82f6';
      button.style.color = '#3b82f6';
      
      // Cargar inventario actual del producto
      try {
        button.innerHTML = '<svg style="animation: spin 1s linear infinite;" width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" opacity="0.25"/><path d="M12 2a10 10 0 0110 10" stroke="currentColor" stroke-width="4"/></svg> Cargando...';
        
        const response = await api.getInventoryLevels({ productId, limit: 100 });
        const normalized = utils.normalizeResponse(response);
        const inventoryLevels = normalized.data || [];
        
        // Crear mapa de inventario por almacén
        const inventoryMap = {};
        inventoryLevels.forEach(level => {
          inventoryMap[level.warehouseId] = parseFloat(level.quantity) || 0;
        });
        
        // Generar cards de almacenes - Estilo móvil para compras
        let html = '<div style="background: #FAFAFA; padding: 14px; border-radius: 10px; border: 1px solid #EEEEEE;">';
        html += '<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 14px;">';
        html += '<div style="width: 36px; height: 36px; background: rgba(255, 107, 44, 0.1); border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">';
        html += '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="#FF6B2C" stroke-width="2"/></svg>';
        html += '</div>';
        html += '<div style="flex: 1;">';
        html += '<div style="font-size: 13px; font-weight: 700; color: #212121; letter-spacing: -0.02em;">Distribución por Almacén</div>';
        html += '<div style="font-size: 11px; color: #757575; font-weight: 500;">Especifica dónde guardar</div>';
        html += '</div>';
        html += '<div class="allocation-badge" style="background: white; padding: 4px 10px; border-radius: 20px; border: 1px solid #EEEEEE; display: flex; align-items: center; gap: 6px;">';
        html += '<div style="width: 6px; height: 6px; background: #22C55E; border-radius: 50%;"></div>';
        html += '<span style="font-size: 11px; font-weight: 700; color: #757575;">0/' + totalQty.toFixed(0) + '</span>';
        html += '</div>';
        html += '</div>';
        
        this.warehouses.forEach((wh, idx) => {
          const currentStock = inventoryMap[wh.id] || 0;
          
          html += `
            <div style="background: white; border: 1px solid #EEEEEE; border-radius: 10px; padding: 12px; margin-bottom: 10px;" class="wh-card-po-${itemIndex}" data-warehouse-id="${wh.id}">
              <div style="display: flex; gap: 10px;">
                <div style="width: 36px; height: 36px; background: #F5F5F5; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="#757575" stroke-width="2"/></svg>
                </div>
                <div style="flex: 1; min-width: 0;">
                  <div style="font-size: 13px; font-weight: 700; color: #212121; margin-bottom: 4px;">${utils.escapeHtml(wh.name)}</div>
                  <div style="display: flex; align-items: center; gap: 6px;">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M20 7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7Z" stroke="#9E9E9E" stroke-width="2"/></svg>
                    <span style="font-size: 11px; color: #757575; font-weight: 600;">Stock actual: <strong style="color: #212121;">${currentStock.toFixed(0)}</strong></span>
                  </div>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <div style="text-align: center;">
                    <div style="font-size: 10px; color: #9E9E9E; margin-bottom: 2px; font-weight: 600;">Cant.</div>
                    <input type="number" 
                           class="wh-allocation-po-${itemIndex}" 
                           data-warehouse-id="${wh.id}"
                           data-current-stock="${currentStock}"
                           placeholder="0" 
                           step="1" 
                           min="0" 
                           max="${totalQty}"
                           style="width: 70px; padding: 8px 10px; border: 1.5px solid #E0E0E0; border-radius: 8px; font-size: 15px; font-weight: 700; text-align: center; background: white; color: #212121; font-family: 'DM Sans';"
                           onfocus="this.style.borderColor='#FF6B2C'; this.style.boxShadow='0 0 0 3px rgba(255,107,44,0.08)';" 
                           onblur="this.style.borderColor='#E0E0E0'; this.style.boxShadow='none';"
                           oninput="purchaseOrdersView.validateAllocation(${itemIndex})">
                  </div>
                </div>
              </div>
            </div>
          `;
        });
        
        html += '</div>';
        
        container.innerHTML = html;
        
        // Restaurar texto del botón
        button.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" stroke-width="2"/></svg><span>Distribuir entre almacenes</span>';
      } catch (error) {
        console.error('Error loading inventory:', error);
        utils.showToast('Error al cargar inventario', 'error');
        button.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" stroke-width="2"/></svg><span>Distribuir entre almacenes</span>';
        container.style.display = 'none';
        button.style.background = '#f3f4f6';
        button.style.borderColor = '#e5e7eb';
        button.style.color = '#6b7280';
      }
    } else {
      container.style.display = 'none';
      button.style.background = '#f3f4f6';
      button.style.borderColor = '#e5e7eb';
      button.style.color = '#6b7280';
    }
  },
  
  validateAllocation(itemIndex) {
    const inputs = document.querySelectorAll(`.wh-allocation-po-${itemIndex}`);
    let total = 0;
    let maxTotal = 0;
    
    inputs.forEach(input => {
      total += parseFloat(input.value) || 0;
      
      // Obtener el máximo del primer input (cantidad total)
      if (maxTotal === 0) {
        const itemRow = input.closest('.po-item-row');
        const qtyInput = itemRow?.querySelector('.po-qty-input');
        maxTotal = parseFloat(qtyInput?.value) || 0;
      }
    });
    
    // Actualizar badge del header
    const itemRow = document.querySelector(`.po-item-row[data-item-index="${itemIndex}"]`);
    if (itemRow) {
      const container = itemRow.querySelector('.warehouse-allocations-container');
      if (container && container.style.display !== 'none') {
        const badge = container.querySelector('.allocation-badge');
        if (badge) {
          const isComplete = Math.abs(total - maxTotal) < 0.01;
          const isOver = total > maxTotal;
          
          badge.innerHTML = `
            <div style="width: 6px; height: 6px; background: ${isOver ? '#EF4444' : (isComplete ? '#22C55E' : '#FFA800')}; border-radius: 50%;"></div>
            <span style="font-size: 11px; font-weight: 700; color: #757575;">${total.toFixed(0)}/${maxTotal.toFixed(0)}</span>
          `;
          
          if (isOver) {
            utils.showToast(`La suma (${total}) excede la cantidad a recibir (${maxTotal})`, 'error');
            }
        }
      }
    }
  },

  updatePOTotal() {
    const container = document.getElementById('po-items-list');
    if (!container) return;
    
    let total = 0;
    const items = container.querySelectorAll('.po-item-row');
    
    items.forEach((item) => {
      // Calcular subtotal
      const qtyInput = item.querySelector('.po-qty-input');
      const priceInput = item.querySelector('.po-price-input');
      const subtotalEl = item.querySelector('.po-subtotal');
      
      const qty = parseFloat(qtyInput?.value) || 0;
      const price = parseFloat(priceInput?.value) || 0;
      const subtotal = qty * price;
      
      if (subtotalEl) {
        subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
      }
      
      total += subtotal;
    });
    
    const totalEl = document.getElementById('po-total');
    if (totalEl) {
      totalEl.textContent = `$${total.toFixed(2)} USD`;
    }
  },

  async savePO(form) {
    const formData = new FormData(form);
    const data = { supplierId: formData.get('supplierId'), items: [] };
    
    if (formData.get('expectedAt')) {
      data.expectedAt = new Date(formData.get('expectedAt')).toISOString();
    }

    // Procesar items
    const container = document.getElementById('po-items-list');
    if (container) {
      const items = container.querySelectorAll('.po-item-row');
      items.forEach((item, itemIndex) => {
        const productId = item.querySelector('.po-product-select')?.value;
        const qtyOrdered = item.querySelector('.po-qty-input')?.value;
        const unitPrice = item.querySelector('.po-price-input')?.value;
        
        if (productId && qtyOrdered && unitPrice) {
          const qty = parseInt(qtyOrdered, 10);
          const itemData = {
            productId,
            qtyOrdered: qty,
            unitPrice: parseFloat(unitPrice)
          };
          
          // Verificar si hay distribución de almacenes
          const allocInputs = document.querySelectorAll(`.wh-allocation-po-${itemIndex}`);
          const allocations = [];
          let totalAllocated = 0;
          
          allocInputs.forEach(input => {
            const allocQty = parseFloat(input.value) || 0;
            if (allocQty > 0) {
              allocations.push({
                warehouseId: input.dataset.warehouseId,
                qty: allocQty
              });
              totalAllocated += allocQty;
            }
          });
          
          // Validar que las asignaciones coincidan con la cantidad total
          if (allocations.length > 0) {
            if (Math.abs(totalAllocated - qty) > 0.01) {
              utils.showToast(`Item ${itemIndex + 1}: La suma de almacenes (${totalAllocated}) no coincide con la cantidad total (${qty})`, 'error');
              return;
            }
            itemData.warehouseAllocations = allocations;
          }
          
          data.items.push(itemData);
        }
      });
    }

    if (data.items.length === 0) {
      utils.showToast('Debes agregar al menos un item', 'error');
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Guardando...';

    try {
      const result = await api.createPurchaseOrder(data);
      utils.showToast(
        'La orden de compra ha sido creada exitosamente',
        'success',
        '¡Orden creada!',
        4000
      );
      document.getElementById('po-modal').remove();
      await this.loadOrders();
    } catch (error) {
      console.error('Error creating PO:', error);
      utils.showToast(error.message || 'Error al crear la orden', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Crear Orden';
    }
  },

  async viewOrder(id) {
    try {
      const response = await api.getPurchaseOrder(id);
      const normalized = utils.normalizeResponse(response);
      const order = normalized.data;
      
      if (!order || !order.items) {
        utils.showToast('Error: Datos de orden incompletos', 'error');
        return;
      }
      
      const totalAmount = order.items.reduce((sum, item) => {
        return sum + (parseFloat(item.qtyOrdered) * parseFloat(item.unitPrice));
      }, 0);

      const modalHtml = `
        <div class="modal-overlay" id="view-modal">
          <div class="modal modal-lg">
            <div class="modal-header">
              <h3 class="modal-title">Orden de Compra #${order.id.substring(0, 8)}</h3>
              <button class="modal-close" onclick="document.getElementById('view-modal').remove()">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2"/>
                </svg>
              </button>
            </div>
            <div class="modal-body">
              <div class="grid grid-2" style="margin-bottom: 20px;">
                <div>
                  <strong>Proveedor:</strong> ${utils.escapeHtml(order.supplier?.name || 'N/A')}<br>
                  <strong>Estado:</strong> ${utils.getStatusBadge(order.status, 'purchase')}<br>
                </div>
                <div>
                  <strong>Fecha Esperada:</strong> ${order.expectedAt ? utils.formatDate(order.expectedAt) : 'N/A'}<br>
                  <strong>Total:</strong> ${utils.formatCurrency(totalAmount)}
                </div>
              </div>

              <h4>Items</h4>
              <table>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th class="text-right">Ordenado</th>
                    <th class="text-right">Recibido</th>
                    <th class="text-right">Precio Unit.</th>
                    <th class="text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${order.items.map(item => `
                    <tr>
                      <td>${utils.escapeHtml(item.product?.name || 'N/A')}</td>
                      <td class="text-right">${utils.formatNumber(item.qtyOrdered, 0)}</td>
                      <td class="text-right">${utils.formatNumber(item.qtyReceived, 0)}</td>
                      <td class="text-right">${utils.formatCurrency(item.unitPrice)}</td>
                      <td class="text-right">${utils.formatCurrency(parseFloat(item.qtyOrdered) * parseFloat(item.unitPrice))}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" onclick="document.getElementById('view-modal').remove()">Cerrar</button>
            </div>
          </div>
        </div>
      `;

      document.body.insertAdjacentHTML('beforeend', modalHtml);
    } catch (error) {
      console.error('Error viewing order:', error);
      utils.showToast('Error al cargar la orden', 'error');
    }
  },

  async markAsOrdered(id) {
    try {
      await api.orderPurchaseOrder(id);
      utils.showToast('Orden marcada como ordenada', 'success');
      await this.loadOrders();
    } catch (error) {
      console.error('Error:', error);
      utils.showToast(error.message || 'Error al actualizar la orden', 'error');
    }
  },

  async receiveOrder(id) {
    try {
      const response = await api.getPurchaseOrder(id);
      console.log('Raw API response:', response);
      
      const normalized = utils.normalizeResponse(response);
      console.log('Normalized response:', normalized);
      
      const order = normalized.data;
      console.log('Order object:', order);
      console.log('Order items:', order?.items);

      if (!order || !order.items) {
        utils.showToast('Error: No se pudo cargar la orden', 'error');
        return;
      }

      // Verificar que haya almacenes disponibles
      if (!this.warehouses || this.warehouses.length === 0) {
        utils.showToast('No hay almacenes disponibles. Por favor, crea un almacén primero.', 'error');
        return;
      }

      const warehouseId = this.warehouses[0].id;

      // Calcular cantidades pendientes de recibir (enteros)
      const receivedQuantities = {};
      order.items.forEach((item, index) => {
        console.log(`Item ${index}:`, item);
        console.log(`  - item.id:`, item.id);
        console.log(`  - qtyOrdered:`, item.qtyOrdered);
        console.log(`  - qtyReceived:`, item.qtyReceived);
        
        const pending = parseInt(item.qtyOrdered) - parseInt(item.qtyReceived || 0);
        console.log(`  - pending:`, pending);
        
        if (pending > 0 && item.id) {
          receivedQuantities[item.id] = pending;
          console.log(`  - Added to receivedQuantities[${item.id}] = ${pending}`);
        } else {
          console.log(`  - NOT added. pending=${pending}, item.id=${item.id}`);
        }
      });

      console.log('Received quantities to send:', receivedQuantities);
      console.log('Payload:', { warehouseId, receivedQuantities });

      // Verificar que haya items para recibir
      if (Object.keys(receivedQuantities).length === 0) {
        utils.showToast('No hay items pendientes de recibir', 'error');
        return;
      }

      await api.receivePurchaseOrder(id, { warehouseId, receivedQuantities });
      utils.showToast('Mercancía recibida correctamente', 'success');
      await this.loadOrders();
    } catch (error) {
      console.error('Error receiving order:', error);
      utils.showToast(error.message || 'Error al recibir la orden', 'error');
    }
  }
};

window.purchaseOrdersView = purchaseOrdersView;
