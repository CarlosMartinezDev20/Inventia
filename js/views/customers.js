// Vista de Clientes
const customersView = {
  currentPage: 1,

  async render(container) {
    container.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Clientes</h1>
          <p class="page-subtitle">Gestión de clientes</p>
        </div>
        <div class="page-actions">
          ${auth.canManage() ? '<button class="btn btn-primary" id="add-customer-btn">+ Nuevo Cliente</button>' : ''}
        </div>
      </div>

      <div class="card">
        <div class="card-body">
          <div id="customers-table-container">
            <div class="loading"><div class="spinner"></div></div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('add-customer-btn')?.addEventListener('click', () => this.showCustomerModal());
    await this.loadCustomers();
  },

  async loadCustomers() {
    try {
      const response = await api.getCustomers({ page: this.currentPage, limit: 20 });
      const normalized = utils.normalizeResponse(response);
      this.renderCustomersTable(normalized);
    } catch (error) {
      console.error('Error loading customers:', error);
      utils.showToast('Error al cargar clientes', 'error');
    }
  },

  renderCustomersTable(response) {
    const container = document.getElementById('customers-table-container');

    if (!response.data || response.data.length === 0) {
      utils.showEmptyState(container, 'No hay clientes registrados');
      return;
    }

    const html = `
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Teléfono</th>
              <th>Email</th>
              <th>Dirección</th>
              <th class="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${response.data.map(customer => `
              <tr>
                <td><strong>${utils.escapeHtml(customer.name)}</strong></td>
                <td>${customer.phone || 'N/A'}</td>
                <td>${customer.email || 'N/A'}</td>
                <td>${customer.address ? utils.escapeHtml(customer.address).substring(0, 50) : 'N/A'}...</td>
                <td class="text-right">
                  <div class="action-buttons">
                    ${auth.canManage() ? `
                      <button class="action-btn edit" onclick="customersView.showCustomerModal('${customer.id}')">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" stroke-width="2"/>
                          <path d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke="currentColor" stroke-width="2"/>
                        </svg>
                      </button>
                    ` : ''}
                    ${auth.isAdmin() ? `
                      <button class="action-btn delete" onclick="customersView.deleteCustomer('${customer.id}')">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <path d="M3 6H5H21" stroke="currentColor" stroke-width="2"/>
                          <path d="M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" stroke-width="2"/>
                        </svg>
                      </button>
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

  async showCustomerModal(customerId = null) {
    let customer = null;
    
    if (customerId) {
      try {
        customer = await api.getCustomer(customerId);
      } catch (error) {
        console.error('Error loading customer:', error);
        utils.showToast('Error al cargar el cliente', 'error');
        return;
      }
    }

    const modalHtml = `
      <div class="modal-overlay" id="customer-modal">
        <div class="modal">
          <div class="modal-header">
            <h3 class="modal-title">${customer ? 'Editar Cliente' : 'Nuevo Cliente'}</h3>
            <button class="modal-close" onclick="document.getElementById('customer-modal').remove()">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2"/>
              </svg>
            </button>
          </div>
          <form id="customer-form">
            <div class="modal-body">
              <div class="form-group">
                <label>Nombre *</label>
                <input type="text" name="name" required value="${customer ? utils.escapeHtml(customer.name) : ''}">
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label>Teléfono</label>
                  <input type="tel" name="phone" value="${customer?.phone || ''}">
                </div>
                <div class="form-group">
                  <label>Email</label>
                  <input type="email" name="email" value="${customer?.email || ''}">
                </div>
              </div>
              
              <div class="form-group">
                <label>Dirección</label>
                <textarea name="address">${customer?.address || ''}</textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" onclick="document.getElementById('customer-modal').remove()">Cancelar</button>
              <button type="submit" class="btn btn-primary">Guardar</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    document.getElementById('customer-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.saveCustomer(e.target, customerId);
    });
  },

  async saveCustomer(form, customerId) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Guardando...';

    try {
      if (customerId) {
        await api.updateCustomer(customerId, data);
        utils.showToast('Cliente actualizado correctamente', 'success');
      } else {
        await api.createCustomer(data);
        utils.showToast('Cliente creado correctamente', 'success');
      }

      document.getElementById('customer-modal').remove();
      await this.loadCustomers();
    } catch (error) {
      console.error('Error saving customer:', error);
      utils.showToast(error.message || 'Error al guardar el cliente', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Guardar';
    }
  },

  async deleteCustomer(id) {
    const confirmed = await utils.confirm('¿Eliminar este cliente?', '¿Estás seguro?', 'danger', 'Eliminar');
    if (!confirmed) return;

    try {
      await api.deleteCustomer(id);
      utils.showToast('Cliente eliminado correctamente', 'success');
      await this.loadCustomers();
    } catch (error) {
      console.error('Error deleting customer:', error);
      utils.showToast(error.message || 'Error al eliminar el cliente', 'error');
    }
  }
};

window.customersView = customersView;
