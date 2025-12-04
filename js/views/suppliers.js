// Vista de Proveedores (similar a clientes)
const suppliersView = {
  currentPage: 1,

  async render(container) {
    container.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Proveedores</h1>
          <p class="page-subtitle">Gestión de proveedores</p>
        </div>
        <div class="page-actions">
          ${auth.canManage() ? '<button class="btn btn-primary" id="add-supplier-btn">+ Nuevo Proveedor</button>' : ''}
        </div>
      </div>

      <div class="card">
        <div class="card-body">
          <div id="suppliers-table-container">
            <div class="loading"><div class="spinner"></div></div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('add-supplier-btn')?.addEventListener('click', () => this.showSupplierModal());
    await this.loadSuppliers();
  },

  async loadSuppliers() {
    try {
      const response = await api.getSuppliers({ page: this.currentPage, limit: 20 });
      const normalized = utils.normalizeResponse(response);
      this.renderSuppliersTable(normalized);
    } catch (error) {
      console.error('Error loading suppliers:', error);
      utils.showToast('Error al cargar proveedores', 'error');
    }
  },

  renderSuppliersTable(response) {
    const container = document.getElementById('suppliers-table-container');

    if (!response.data || response.data.length === 0) {
      utils.showEmptyState(container, 'No hay proveedores registrados');
      return;
    }

    const html = `
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Contacto</th>
              <th>Teléfono</th>
              <th>Email</th>
              <th class="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${response.data.map(supplier => `
              <tr>
                <td><strong>${utils.escapeHtml(supplier.name)}</strong></td>
                <td>${supplier.contactName || 'N/A'}</td>
                <td>${supplier.phone || 'N/A'}</td>
                <td>${supplier.email || 'N/A'}</td>
                <td class="text-right">
                  <div class="action-buttons">
                    ${auth.canManage() ? `
                      <button class="action-btn edit" onclick="suppliersView.showSupplierModal('${supplier.id}')">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" stroke-width="2"/>
                          <path d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke="currentColor" stroke-width="2"/>
                        </svg>
                      </button>
                    ` : ''}
                    ${auth.isAdmin() ? `
                      <button class="action-btn delete" onclick="suppliersView.deleteSupplier('${supplier.id}')">
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

  async showSupplierModal(supplierId = null) {
    let supplier = null;
    
    if (supplierId) {
      try {
        supplier = await api.getSupplier(supplierId);
      } catch (error) {
        console.error('Error loading supplier:', error);
        utils.showToast('Error al cargar el proveedor', 'error');
        return;
      }
    }

    const modalHtml = `
      <div class="modal-overlay" id="supplier-modal">
        <div class="modal">
          <div class="modal-header">
            <h3 class="modal-title">${supplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h3>
            <button class="modal-close" onclick="document.getElementById('supplier-modal').remove()">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2"/>
              </svg>
            </button>
          </div>
          <form id="supplier-form">
            <div class="modal-body">
              <div class="form-group">
                <label>Nombre de la Empresa *</label>
                <input type="text" name="name" required value="${supplier ? utils.escapeHtml(supplier.name) : ''}">
              </div>
              
              <div class="form-group">
                <label>Nombre del Contacto</label>
                <input type="text" name="contactName" value="${supplier?.contactName || ''}">
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label>Teléfono</label>
                  <input type="tel" name="phone" value="${supplier?.phone || ''}">
                </div>
                <div class="form-group">
                  <label>Email</label>
                  <input type="email" name="email" value="${supplier?.email || ''}">
                </div>
              </div>
              
              <div class="form-group">
                <label>Dirección</label>
                <textarea name="address">${supplier?.address || ''}</textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" onclick="document.getElementById('supplier-modal').remove()">Cancelar</button>
              <button type="submit" class="btn btn-primary">Guardar</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    document.getElementById('supplier-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.saveSupplier(e.target, supplierId);
    });
  },

  async saveSupplier(form, supplierId) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Guardando...';

    try {
      if (supplierId) {
        await api.updateSupplier(supplierId, data);
        utils.showToast(
          `Los datos de "${data.name}" han sido actualizados exitosamente`,
          'success',
          '¡Proveedor actualizado!',
          5000
        );
      } else {
        await api.createSupplier(data);
        utils.showToast(
          `El proveedor "${data.name}" ha sido agregado al sistema`,
          'success',
          '¡Proveedor creado!',
          5000
        );
      }

      document.getElementById('supplier-modal').remove();
      await this.loadSuppliers();
    } catch (error) {
      console.error('Error saving supplier:', error);
      utils.showToast(error.message || 'Error al guardar el proveedor', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Guardar';
    }
  },

  async deleteSupplier(id) {
    const confirmed = await utils.confirm('¿Eliminar este proveedor?', '¿Estás seguro?', 'danger', 'Eliminar');
    if (!confirmed) return;

    try {
      await api.deleteSupplier(id);
      utils.showToast('Proveedor eliminado correctamente', 'success');
      await this.loadSuppliers();
    } catch (error) {
      console.error('Error deleting supplier:', error);
      utils.showToast(error.message || 'Error al eliminar el proveedor', 'error');
    }
  }
};

window.suppliersView = suppliersView;
