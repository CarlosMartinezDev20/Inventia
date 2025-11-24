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
                <td><strong>#${order.id.substring(0, 8)}</strong></td>
                <td>${utils.escapeHtml(order.customer?.name || 'N/A')}</td>
                <td>${utils.getStatusBadge(order.status, 'sales')}</td>
                <td>${utils.formatDate(order.createdAt)}</td>
                <td>${order.items?.length || 0}</td>
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
            <h3 class="modal-title">Nueva Orden de Venta</h3>
            <button class="modal-close" onclick="document.getElementById('so-modal').remove()">×</button>
          </div>
          <form id="so-form">
            <div class="modal-body">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
                <div>
                  <label style="display: block; font-size: 12px; font-weight: 500; color: #6b7280; margin-bottom: 6px;">Cliente *</label>
                  <select name="customerId" required style="width: 100%; padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 14px; background: white;">
                    <option value="">Seleccionar...</option>
                    ${this.customers.map(c => `<option value="${c.id}">${utils.escapeHtml(c.name)}</option>`).join('')}
                  </select>
                </div>
                <div>
                  <label style="display: block; font-size: 12px; font-weight: 500; color: #6b7280; margin-bottom: 6px;">Fecha Esperada</label>
                  <input type="date" name="expectedAt" min="${new Date().toISOString().split('T')[0]}" style="width: 100%; padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 14px;">
                </div>
              </div>

              <div style="margin-bottom: 12px;">
                <span style="font-size: 11px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px;">Items</span>
              </div>

              <div id="so-items" style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; max-height: 280px; overflow-y: auto; padding-right: 4px;"></div>

              <button type="button" class="btn btn-secondary btn-sm" onclick="salesOrdersView.addSOItem()" style="font-size: 13px;">+ Agregar Item</button>

              <div style="margin-top: 20px; padding: 14px 16px; background: linear-gradient(to right, #fef3e7, #fff8ec); border: 1px solid #fde68a; border-radius: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <span style="font-size: 12px; color: #6b7280;">Subtotal:</span>
                  <strong id="so-subtotal" style="font-size: 14px; color: #374151;">$0.00 USD</strong>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <span style="font-size: 12px; color: #6b7280;">Descuentos:</span>
                  <strong id="so-discounts" style="font-size: 14px; color: #10b981;">-$0.00 USD</strong>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 8px; border-top: 1px solid #fde68a;">
                  <span style="font-size: 13px; font-weight: 500; color: #6b7280;">Total:</span>
                  <strong id="so-total" style="font-size: 20px; font-weight: 700; color: #ff6b2c;">$0.00 USD</strong>
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
      <div style="margin-bottom: 10px;">
        <label style="display: block; font-size: 11px; font-weight: 500; color: #6b7280; margin-bottom: 5px;">Producto</label>
        <select name="items[${index}][productId]" required class="item-product-select" style="width: 100%; padding: 7px 10px; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 13px; background: #fafafa;">
          <option value="">Seleccionar...</option>
          ${this.products.map(p => `<option value="${p.id}">${utils.escapeHtml(p.name)} (${utils.escapeHtml(p.sku)})</option>`).join('')}
        </select>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 10px;">
        <div>
          <label style="display: block; font-size: 11px; font-weight: 500; color: #6b7280; margin-bottom: 5px;">Cantidad</label>
          <input type="number" name="items[${index}][qty]" placeholder="0" step="1" min="1" required class="item-qty" 
                 style="width: 100%; padding: 7px 10px; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 13px; text-align: right; background: #fafafa;">
        </div>
        <div>
          <label style="display: block; font-size: 11px; font-weight: 500; color: #6b7280; margin-bottom: 5px;">Precio</label>
          <input type="number" name="items[${index}][unitPrice]" placeholder="0.00" step="0.01" min="0.01" required class="item-price" 
                 style="width: 100%; padding: 7px 10px; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 13px; text-align: right; background: #fafafa;">
        </div>
        <div>
          <label style="display: block; font-size: 11px; font-weight: 500; color: #6b7280; margin-bottom: 5px;">Descuento</label>
          <input type="number" name="items[${index}][discount]" placeholder="0.00" step="0.01" min="0" value="0" class="item-discount" 
                 style="width: 100%; padding: 7px 10px; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 13px; text-align: right; background: #fafafa;">
        </div>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 8px; border-top: 1px solid #f3f4f6;">
        <span style="font-size: 11px; font-weight: 500; color: #6b7280;">Subtotal:</span>
        <strong class="item-subtotal-value" style="font-size: 13px; font-weight: 600; color: #ff6b2c;">$0.00 USD</strong>
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
        data.items.push({
          productId,
          qty: parseInt(formData.get(`items[${i}][qty]`), 10),
          unitPrice: parseFloat(formData.get(`items[${i}][unitPrice]`)),
          discount: parseFloat(formData.get(`items[${i}][discount]`) || 0)
        });
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
