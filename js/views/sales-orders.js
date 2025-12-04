// Vista de Órdenes de Venta
const salesOrdersView = {
  customers: [],
  warehouses: [],
  products: [],

  async render(container) {
    await Promise.all([
      this.loadCustomers(),
      this.loadWarehouses(),
      this.loadProducts()
    ]);

    container.innerHTML = `
      <div class="page-header">
        <div class="page-header-content">
          <div class="page-header-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M3 3H7L9 13M9 13L18 13L21 6H8M9 13L7 19H19M9 13H15M19 19C19 19.5523 18.5523 20 18 20C17.4477 20 17 19.5523 17 19C17 18.4477 17.4477 18 18 18C18.5523 18 19 18.4477 19 19ZM9 19C9 19.5523 8.55228 20 8 20C7.44772 20 7 19.5523 7 19C7 18.4477 7.44772 18 8 18C8.55228 18 9 18.4477 9 19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div>
            <h1 class="page-title">Órdenes de Venta</h1>
            <p class="page-subtitle">Gestión de ventas a clientes</p>
          </div>
        </div>
        <div class="page-actions">
          ${auth.canManage() ? '<button class="btn btn-primary" id="add-so-btn"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg> Nueva Orden</button>' : ''}
        </div>
      </div>

      <div class="card">
        <div class="card-body">
          <div id="so-table-container">
            <div class="loading"><div class="spinner"></div></div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('add-so-btn')?.addEventListener('click', () => this.showSOModal());
    await this.loadOrders();
  },

  async loadCustomers() {
    try {
      const response = await api.getCustomers({ limit: 100 });
      const normalized = utils.normalizeResponse(response);
      this.customers = normalized.data || [];
    } catch (error) {
      console.error('Error loading customers:', error);
      this.customers = [];
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
      const response = await api.getSalesOrders({ limit: 50 });
      const normalized = utils.normalizeResponse(response);
      this.renderOrdersTable(normalized);
    } catch (error) {
      console.error('Error loading sales orders:', error);
      utils.showToast('Error al cargar órdenes', 'error');
    }
  },

  renderOrdersTable(response) {
    const container = document.getElementById('so-table-container');

    if (!response.data || response.data.length === 0) {
      utils.showEmptyState(container, 'No hay órdenes de venta');
      return;
    }

    const html = `
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Cliente</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th>Items</th>
              <th class="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${response.data.map(order => `
              <tr>
                <td>
                  <div style="display: flex; align-items: center; gap: 6px;">
                    <strong>#${order.id.substring(0, 8)}</strong>
                    ${order.status === 'FULFILLED' ? '<span class="badge-minimal success" style="font-size: 10px; padding: 2px 6px;">✓</span>' : ''}
                  </div>
                </td>
                <td>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    ${utils.escapeHtml(order.customer?.name || 'N/A')}
                    ${order.customer ? '<span class="badge-minimal primary" style="font-size: 10px; padding: 2px 6px;">👤</span>' : ''}
                  </div>
                </td>
                <td>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    ${utils.getStatusBadge(order.status, 'sales')}
                    ${order.items?.length ? `<span class="badge-minimal primary" style="font-size: 10px; padding: 2px 6px;">${order.items.length} items</span>` : ''}
                  </div>
                </td>
                <td>
                  <div style="display: flex; align-items: center; gap: 6px;">
                    ${utils.formatDate(order.createdAt)}
                    ${new Date() - new Date(order.createdAt) < 86400000 ? '<span class="badge-minimal success" style="font-size: 10px; padding: 2px 6px;">🆕 Nueva</span>' : ''}
                  </div>
                </td>
                <td>
                  <span class="badge-minimal primary" style="font-size: 11px; padding: 3px 8px;">${order.items?.length || 0} productos</span>
                </td>
                <td class="text-right">
                  <div class="action-buttons">
                    <button class="action-btn view" onclick="salesOrdersView.viewOrder('${order.id}')">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" stroke-width="2"/>
                        <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
                      </svg>
                    </button>
                    ${order.status === 'DRAFT' && auth.canManage() ? `
                      <button class="action-btn edit" onclick="salesOrdersView.confirmOrder('${order.id}')">Confirmar</button>
                    ` : ''}
                    ${order.status === 'CONFIRMED' && auth.canManage() ? `
                      <button class="action-btn" onclick="salesOrdersView.fulfillOrder('${order.id}')">Completar</button>
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

  showSOModal() {
    const modalHtml = `
      <div class="modal-overlay" id="so-modal">
        <div class="modal modal-lg">
          <div class="modal-header">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #FF6B2C 0%, #FF8554 100%); border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 3H7L9 13M9 13L18 13L21 6H8M9 13L7 19H19M9 13H15M19 19C19 19.5523 18.5523 20 18 20C17.4477 20 17 19.5523 17 19C17 18.4477 17.4477 18 18 18C18.5523 18 19 18.4477 19 19ZM9 19C9 19.5523 8.55228 20 8 20C7.44772 20 7 19.5523 7 19C7 18.4477 7.44772 18 8 18C8.55228 18 9 18.4477 9 19Z" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>
              </div>
              <div>
                <h3 class="modal-title" style="margin: 0; font-size: 20px; font-weight: 700; color: #212121;">Nueva Orden de Venta</h3>
                <p style="margin: 0; font-size: 13px; color: #757575; font-weight: 500;">Registra una venta a cliente</p>
              </div>
            </div>
            <button class="modal-close" onclick="document.getElementById('so-modal').remove()">×</button>
          </div>
          <form id="so-form">
            <div class="modal-body">
              <!-- Sección de Información General -->
              <div style="background: #FAFAFA; border: 1px solid #EEEEEE; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 14px;">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="#FF6B2C" stroke-width="2"/><path d="M12 14C8.13401 14 5 17.134 5 21H19C19 17.134 15.866 14 12 14Z" stroke="#FF6B2C" stroke-width="2"/></svg>
                  <span style="font-size: 13px; font-weight: 700; color: #212121; letter-spacing: -0.02em;">Información General</span>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
                  <div>
                    <label style="display: block; font-size: 12px; font-weight: 600; color: #757575; margin-bottom: 6px;">Cliente *</label>
                    <select name="customerId" required style="width: 100%; padding: 10px 12px; border: 1.5px solid #E0E0E0; border-radius: 8px; font-size: 14px; background: white; color: #212121; font-weight: 500;">
                      <option value="">Seleccionar cliente...</option>
                      ${this.customers.map(c => `<option value="${c.id}">${utils.escapeHtml(c.name)}</option>`).join('')}
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
                  <button type="button" class="btn btn-secondary btn-sm" onclick="salesOrdersView.addSOItem()" style="font-size: 12px; padding: 6px 12px; display: flex; align-items: center; gap: 6px;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                    Agregar Producto
                  </button>
                </div>
              </div>

              <div id="so-items" style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px; max-height: 280px; overflow-y: auto; padding-right: 4px;"></div>

              <!-- Resumen del Pedido -->
              <div style="background: white; border: 2px solid #EEEEEE; border-radius: 12px; padding: 18px; margin-top: 20px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 14px;">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15" stroke="#757575" stroke-width="2"/><path d="M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5V7H9V5Z" stroke="#757575" stroke-width="2"/></svg>
                  <span style="font-size: 13px; font-weight: 700; color: #212121;">Resumen del Pedido</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                  <span style="font-size: 13px; color: #757575; font-weight: 500;">Subtotal</span>
                  <strong id="so-subtotal" style="font-size: 15px; color: #424242; font-weight: 600;">$0.00 USD</strong>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                  <span style="font-size: 13px; color: #757575; font-weight: 500;">Descuentos</span>
                  <strong id="so-discounts" style="font-size: 15px; color: #22C55E; font-weight: 600;">-$0.00 USD</strong>
                </div>
                <div style="height: 1px; background: #EEEEEE; margin-bottom: 12px;"></div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 14px; font-weight: 700; color: #212121;">Total a Pagar</span>
                  <strong id="so-total" style="font-size: 22px; font-weight: 700; color: #FF6B2C;">$0.00 USD</strong>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" onclick="document.getElementById('so-modal').remove()">Cancelar</button>
              <button type="submit" class="btn btn-primary">Crear Orden</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Agregar primer item
    this.addSOItem();
    
    // Event listener del form
    document.getElementById('so-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveSO(e.target);
    });
  },

  addSOItem() {
    const container = document.getElementById('so-items');
    const index = container.children.length;
    
    const itemDiv = document.createElement('div');
    itemDiv.className = 'so-item-row';
    itemDiv.setAttribute('data-item-index', index);
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
      this.updateSOTotals();
    };
    
    itemDiv.innerHTML = `
      <div style="background: white; border: 1.5px solid #EEEEEE; border-radius: 10px; padding: 14px; position: relative;">
        <!-- Selector de Producto -->
        <div style="margin-bottom: 12px;">
          <label style="display: block; font-size: 12px; font-weight: 600; color: #757575; margin-bottom: 6px;">Producto</label>
          <select name="items[${index}][productId]" required class="item-product-select" style="width: 100%; padding: 10px 12px; border: 1.5px solid #E0E0E0; border-radius: 8px; font-size: 14px; background: #FAFAFA; color: #212121; font-weight: 500;">
            <option value="">Seleccionar producto...</option>
            ${this.products.map(p => `<option value="${p.id}">${utils.escapeHtml(p.name)} - ${utils.escapeHtml(p.sku)}</option>`).join('')}
          </select>
        </div>
        
        <!-- Grid de Cantidad, Precio y Descuento -->
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 12px;">
          <div>
            <label style="display: block; font-size: 12px; font-weight: 600; color: #757575; margin-bottom: 6px;">Cantidad</label>
            <input type="number" name="items[${index}][qty]" placeholder="0" step="1" min="1" required class="item-qty" 
                   style="width: 100%; padding: 10px 12px; border: 1.5px solid #E0E0E0; border-radius: 8px; font-size: 14px; text-align: center; background: white; color: #212121; font-weight: 600;">
          </div>
          <div>
            <label style="display: block; font-size: 12px; font-weight: 600; color: #757575; margin-bottom: 6px;">Precio Unit.</label>
            <input type="number" name="items[${index}][unitPrice]" placeholder="0.00" step="0.01" min="0.01" required class="item-price" 
                   style="width: 100%; padding: 10px 12px; border: 1.5px solid #E0E0E0; border-radius: 8px; font-size: 14px; text-align: center; background: white; color: #212121; font-weight: 600;">
          </div>
          <div>
            <label style="display: block; font-size: 12px; font-weight: 600; color: #757575; margin-bottom: 6px;">Descuento</label>
            <input type="number" name="items[${index}][discount]" placeholder="0.00" step="0.01" min="0" value="0" class="item-discount" 
                   style="width: 100%; padding: 10px 12px; border: 1.5px solid #E0E0E0; border-radius: 8px; font-size: 14px; text-align: center; background: white; color: #212121; font-weight: 600;">
          </div>
        </div>
        
        <!-- Botón de Distribución de Almacenes -->
        <button type="button" class="btn-warehouse-allocation" onclick="salesOrdersView.showWarehouseAllocation(this, ${index})" 
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
          <strong class="item-subtotal-value" style="font-size: 16px; font-weight: 700; color: #FF6B2C;">$0.00 USD</strong>
        </div>
      </div>
    `;
    
    // Agregar el botón de eliminar solo si no es el primer item
    if (index > 0) {
      const headerDiv = document.createElement('div');
      headerDiv.style.cssText = 'display: flex; justify-content: flex-end; margin-bottom: 8px;';
      headerDiv.appendChild(deleteBtn);
      itemDiv.insertBefore(headerDiv, itemDiv.firstChild);
    }
    
    // Agregar event listeners para los inputs
    const qtyInput = itemDiv.querySelector('.item-qty');
    const priceInput = itemDiv.querySelector('.item-price');
    const discountInput = itemDiv.querySelector('.item-discount');
    const productSelect = itemDiv.querySelector('.item-product-select');
    
    // Estilos de focus
    [qtyInput, priceInput, discountInput, productSelect].forEach(input => {
      input.addEventListener('focus', () => {
        input.style.borderColor = '#ff6b2c';
        input.style.background = 'white';
      });
      input.addEventListener('blur', () => {
        input.style.borderColor = '#e5e7eb';
        input.style.background = '#fafafa';
      });
    });
    
    qtyInput.addEventListener('input', () => this.updateSOTotals());
    priceInput.addEventListener('input', () => this.updateSOTotals());
    discountInput.addEventListener('input', () => this.updateSOTotals());
    
    container.appendChild(itemDiv);
    this.updateSOTotals();
  },

  async showWarehouseAllocation(button, itemIndex) {
    const itemRow = button.closest('.so-item-row');
    const qtyInput = itemRow.querySelector('.item-qty');
    const productSelect = itemRow.querySelector('.item-product-select');
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
      button.style.background = 'rgba(255, 107, 44, 0.08)';
      button.style.borderColor = '#FF6B2C';
      button.style.color = '#FF6B2C';
      
      // Cargar inventario del producto
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
        
        // Generar cards de almacenes con inventario - Estilo móvil
        let html = '<div style="background: #FAFAFA; padding: 14px; border-radius: 10px; border: 1px solid #EEEEEE;">';
        html += '<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 14px;">';
        html += '<div style="width: 36px; height: 36px; background: rgba(255, 107, 44, 0.1); border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">';
        html += '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="#FF6B2C" stroke-width="2"/></svg>';
        html += '</div>';
        html += '<div style="flex: 1;">';
        html += '<div style="font-size: 13px; font-weight: 700; color: #212121; letter-spacing: -0.02em;">Distribución por Almacén</div>';
        html += '<div style="font-size: 11px; color: #757575; font-weight: 500;">Especifica de dónde sacar</div>';
        html += '</div>';
        html += '<div class="allocation-badge" style="background: white; padding: 4px 10px; border-radius: 20px; border: 1px solid #EEEEEE; display: flex; align-items: center; gap: 6px;">';
        html += '<div style="width: 6px; height: 6px; background: #EF4444; border-radius: 50%;"></div>';
        html += '<span style="font-size: 11px; font-weight: 700; color: #757575;">0/' + totalQty.toFixed(0) + '</span>';
        html += '</div>';
        html += '</div>';
        
        this.warehouses.forEach((wh, idx) => {
          const available = inventoryMap[wh.id] || 0;
          const canFulfill = available >= totalQty;
          
          html += `
            <div style="background: white; border: 1px solid #EEEEEE; border-radius: 10px; padding: 12px; margin-bottom: 10px; position: relative;" class="wh-card-${itemIndex}" data-warehouse-id="${wh.id}">
              <div style="display: flex; gap: 10px;">
                <div style="width: 36px; height: 36px; background: #F5F5F5; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="#757575" stroke-width="2"/></svg>
                </div>
                <div style="flex: 1; min-width: 0;">
                  <div style="font-size: 13px; font-weight: 700; color: #212121; margin-bottom: 4px;">${utils.escapeHtml(wh.name)}</div>
                  <div style="display: flex; align-items: center; gap: 6px;">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M20 7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7Z" stroke="#9E9E9E" stroke-width="2"/></svg>
                    <span style="font-size: 11px; color: #757575; font-weight: 600;">Disponible: <strong style="color: ${available === 0 ? '#EF4444' : '#212121'};">${available.toFixed(0)}</strong></span>
                  </div>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <div style="text-align: center;">
                    <div style="font-size: 10px; color: #9E9E9E; margin-bottom: 2px; font-weight: 600;">Cant.</div>
                    <input type="number" 
                           class="wh-allocation-${itemIndex}" 
                           data-warehouse-id="${wh.id}"
                           data-available="${available}"
                           placeholder="0" 
                           step="1" 
                           min="0" 
                           max="${Math.min(available, totalQty)}"
                           ${available === 0 ? 'disabled' : ''}
                           style="width: 70px; padding: 8px 10px; border: 1.5px solid ${available === 0 ? '#EEEEEE' : '#E0E0E0'}; border-radius: 8px; font-size: 15px; font-weight: 700; text-align: center; background: ${available === 0 ? '#FAFAFA' : 'white'}; color: ${available === 0 ? '#BDBDBD' : '#212121'}; font-family: 'DM Sans';"
                           onfocus="this.style.borderColor='#FF6B2C'; this.style.boxShadow='0 0 0 3px rgba(255,107,44,0.08)';" 
                           onblur="this.style.borderColor='#E0E0E0'; this.style.boxShadow='none';"
                           oninput="salesOrdersView.validateAllocation(${itemIndex})">
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
    const inputs = document.querySelectorAll(`.wh-allocation-${itemIndex}`);
    let total = 0;
    let maxTotal = 0;
    
    inputs.forEach(input => {
      const value = parseFloat(input.value) || 0;
      const available = parseFloat(input.dataset.available) || 0;
      
      // Validar que no exceda el disponible
      if (value > available) {
        input.value = available;
        utils.showToast(`No puedes asignar más de ${available} unidades disponibles`, 'error');
      }
      
      total += parseFloat(input.value) || 0;
      
      // Obtener el máximo del primer input (cantidad total)
      if (maxTotal === 0) {
        const itemRow = input.closest('.so-item-row');
        const qtyInput = itemRow?.querySelector('.item-qty');
        maxTotal = parseFloat(qtyInput?.value) || 0;
      }
    });
    
    // Actualizar badge del header
    const itemRow = document.querySelector(`.so-item-row[data-item-index="${itemIndex}"]`);
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
            utils.showToast(`La suma (${total}) excede la cantidad solicitada (${maxTotal})`, 'error');
          }
        }
      }
    }
  },

  updateProductPrice(selectElement) {
    // Aquí puedes agregar lógica para auto-llenar precio si tienes precios sugeridos
    this.updateSOTotals();
  },

  updateSOTotals() {
    const items = document.querySelectorAll('.so-item-row');
    let subtotal = 0;
    let totalDiscounts = 0;

    items.forEach((item) => {
      const qty = parseFloat(item.querySelector('.item-qty')?.value || 0);
      const price = parseFloat(item.querySelector('.item-price')?.value || 0);
      const discount = parseFloat(item.querySelector('.item-discount')?.value || 0);
      
      const itemSubtotal = (qty * price) - discount;
      subtotal += qty * price;
      totalDiscounts += discount;
      
      const subtotalEl = item.querySelector('.item-subtotal-value');
      if (subtotalEl) {
        subtotalEl.textContent = `$${Math.max(0, itemSubtotal).toFixed(2)} USD`;
      }
    });

    const total = subtotal - totalDiscounts;

    document.getElementById('so-subtotal').textContent = `$${subtotal.toFixed(2)} USD`;
    document.getElementById('so-discounts').textContent = `-$${totalDiscounts.toFixed(2)} USD`;
    document.getElementById('so-total').textContent = `$${Math.max(0, total).toFixed(2)} USD`;
  },

  async saveSO(form) {
    const formData = new FormData(form);
    const data = { customerId: formData.get('customerId'), items: [] };

    const itemsCount = document.querySelectorAll('.so-item-row').length;
    for (let i = 0; i < itemsCount; i++) {
      const productId = formData.get(`items[${i}][productId]`);
      if (productId) {
        const qty = parseInt(formData.get(`items[${i}][qty]`), 10);
        const itemData = {
          productId,
          qty,
          unitPrice: parseFloat(formData.get(`items[${i}][unitPrice]`)),
          discount: parseFloat(formData.get(`items[${i}][discount]`) || 0)
        };
        
        // Verificar si hay distribución de almacenes
        const allocInputs = document.querySelectorAll(`.wh-allocation-${i}`);
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
            utils.showToast(`Item ${i + 1}: La suma de almacenes (${totalAllocated}) no coincide con la cantidad total (${qty})`, 'error');
            return;
          }
          itemData.warehouseAllocations = allocations;
        }
        
        data.items.push(itemData);
      }
    }

    if (data.items.length === 0) {
      utils.showToast('Debes agregar al menos un item', 'error');
      return;
    }

    try {
      const result = await api.createSalesOrder(data);
      utils.showToast(
        'La orden de venta ha sido creada exitosamente',
        'success',
        '¡Orden creada!',
        4000
      );
      document.getElementById('so-modal').remove();
      await this.loadOrders();
    } catch (error) {
      console.error('Error creating SO:', error);
      utils.showToast(error.message || 'Error al crear la orden', 'error');
    }
  },

  async viewOrder(id) {
    try {
      const response = await api.getSalesOrder(id);
      const normalized = utils.normalizeResponse(response);
      const order = normalized.data;
      
      if (!order || !order.items) {
        utils.showToast('Error: Datos de orden incompletos', 'error');
        return;
      }
      
      const totalAmount = order.items.reduce((sum, item) => {
        const subtotal = parseFloat(item.qty) * parseFloat(item.unitPrice);
        return sum + subtotal - parseFloat(item.discount || 0);
      }, 0);

      const modalHtml = `
        <div class="modal-overlay" id="view-modal">
          <div class="modal modal-lg">
            <div class="modal-header">
              <h3 class="modal-title">Orden de Venta #${order.id.substring(0, 8)}</h3>
              <button class="modal-close" onclick="document.getElementById('view-modal').remove()">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2"/>
                </svg>
              </button>
            </div>
            <div class="modal-body">
              <div class="grid grid-2" style="margin-bottom: 20px;">
                <div>
                  <strong>Cliente:</strong> ${utils.escapeHtml(order.customer?.name || 'N/A')}<br>
                  <strong>Estado:</strong> ${utils.getStatusBadge(order.status, 'sales')}<br>
                </div>
                <div>
                  <strong>Fecha:</strong> ${utils.formatDate(order.createdAt)}<br>
                  <strong>Total:</strong> ${utils.formatCurrency(totalAmount)}
                </div>
              </div>

              <h4>Items</h4>
              <table>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th class="text-right">Cantidad</th>
                    <th class="text-right">Precio Unit.</th>
                    <th class="text-right">Descuento</th>
                    <th class="text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${order.items.map(item => {
                    const subtotal = parseFloat(item.qty) * parseFloat(item.unitPrice) - parseFloat(item.discount || 0);
                    return `
                      <tr>
                        <td>${utils.escapeHtml(item.product?.name || 'N/A')}</td>
                        <td class="text-right">${utils.formatNumber(item.qty, 0)}</td>
                        <td class="text-right">${utils.formatCurrency(item.unitPrice)}</td>
                        <td class="text-right">${utils.formatCurrency(item.discount || 0)}</td>
                        <td class="text-right">${utils.formatCurrency(subtotal)}</td>
                      </tr>
                    `;
                  }).join('')}
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

  async confirmOrder(id) {
    try {
      await api.confirmSalesOrder(id);
      utils.showToast('Orden confirmada', 'success');
      await this.loadOrders();
    } catch (error) {
      console.error('Error:', error);
      utils.showToast(error.message || 'Error al confirmar la orden', 'error');
    }
  },

  async fulfillOrder(id) {
    try {
      if (!this.warehouses || this.warehouses.length === 0) {
        utils.showToast('No hay almacenes disponibles. Por favor, crea un almacén primero.', 'error');
        return;
      }

      const warehouseId = this.warehouses[0].id;

      await api.fulfillSalesOrder(id, { warehouseId });
      utils.showToast('Orden completada correctamente', 'success');
      await this.loadOrders();
    } catch (error) {
      console.error('Error fulfilling order:', error);
      utils.showToast(error.message || 'Error al completar la orden', 'error');
    }
  }
};

window.salesOrdersView = salesOrdersView;
