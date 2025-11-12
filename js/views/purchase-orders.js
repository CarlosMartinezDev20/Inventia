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
            <h3 class="modal-title">Nueva Orden de Compra</h3>
            <button class="modal-close" onclick="document.getElementById('po-modal').remove()">×</button>
          </div>
          <form id="po-form">
            <div class="modal-body">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
                <div>
                  <label style="display: block; font-size: 12px; font-weight: 500; color: #6b7280; margin-bottom: 6px;">Proveedor *</label>
                  <select name="supplierId" required style="width: 100%; padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 14px; background: white;">
                    <option value="">Seleccionar...</option>
                    ${this.suppliers.map(s => `<option value="${s.id}">${utils.escapeHtml(s.name)}</option>`).join('')}
                  </select>
                </div>
                <div>
                  <label style="display: block; font-size: 12px; font-weight: 500; color: #6b7280; margin-bottom: 6px;">Fecha Esperada</label>
                  <input type="date" name="expectedAt" style="width: 100%; padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 14px;">
                </div>
              </div>

              <div style="margin-bottom: 12px;">
                <span style="font-size: 11px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px;">Items</span>
              </div>
              
              <div id="po-items-list" style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; max-height: 280px; overflow-y: auto; padding-right: 4px;"></div>
              
              <button type="button" class="btn btn-secondary btn-sm" onclick="purchaseOrdersView.addPOItem()" style="font-size: 13px;">+ Agregar Item</button>

              <div style="margin-top: 20px; padding: 14px 16px; background: linear-gradient(to right, #fef3e7, #fff8ec); border: 1px solid #fde68a; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 13px; font-weight: 500; color: #6b7280;">Total:</span>
                <span id="po-total" style="font-size: 20px; font-weight: 700; color: #ff6b2c;">$0.00 USD</span>
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
    
    itemDiv.innerHTML = `
      <div style="display: flex; gap: 10px; align-items: end;">
        <div style="flex: 2; min-width: 0;">
          <label style="display: block; font-size: 11px; font-weight: 500; color: #6b7280; margin-bottom: 5px;">Producto</label>
          <select class="po-product-select" required style="width: 100%; padding: 7px 10px; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 13px; background: #fafafa; transition: border-color 0.2s;">
            <option value="">Seleccionar...</option>
            ${this.products.map(p => `<option value="${p.id}">${utils.escapeHtml(p.name)}</option>`).join('')}
          </select>
        </div>
        <div style="flex: 0 0 75px;">
          <label style="display: block; font-size: 11px; font-weight: 500; color: #6b7280; margin-bottom: 5px;">Cantidad</label>
          <input type="number" class="po-qty-input" placeholder="0" step="1" min="1" required 
                 style="width: 100%; padding: 7px 10px; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 13px; text-align: right; background: #fafafa;">
        </div>
        <div style="flex: 0 0 85px;">
          <label style="display: block; font-size: 11px; font-weight: 500; color: #6b7280; margin-bottom: 5px;">Precio</label>
          <input type="number" class="po-price-input" placeholder="0.00" step="0.01" min="0.01" required 
                 style="width: 100%; padding: 7px 10px; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 13px; text-align: right; background: #fafafa;">
        </div>
        <div style="flex: 0 0 85px;">
          <label style="display: block; font-size: 11px; font-weight: 500; color: #6b7280; margin-bottom: 5px;">Subtotal</label>
          <div class="po-subtotal" style="padding: 7px 10px; background: #fef3e7; border: 1px solid #fde68a; border-radius: 6px; font-size: 13px; font-weight: 600; color: #ff6b2c; text-align: right;">$0.00</div>
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
      items.forEach(item => {
        const productId = item.querySelector('.po-product-select')?.value;
        const qtyOrdered = item.querySelector('.po-qty-input')?.value;
        const unitPrice = item.querySelector('.po-price-input')?.value;
        
        if (productId && qtyOrdered && unitPrice) {
          data.items.push({
            productId,
            qtyOrdered: parseInt(qtyOrdered, 10),
            unitPrice: parseFloat(unitPrice)
          });
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
      await api.createPurchaseOrder(data);
      utils.showToast('Orden creada correctamente', 'success');
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
