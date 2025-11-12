// Vista de Configuración
const settingsView = {
  async render(container) {
    const user = auth.getCurrentUser();

    container.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Configuración</h1>
          <p class="page-subtitle">Gestión de categorías, almacenes y usuarios</p>
        </div>
      </div>

      <div class="tabs">
        <button class="tab active" data-tab="categories">Categorías</button>
        <button class="tab" data-tab="warehouses">Almacenes</button>
        ${auth.isAdmin() ? '<button class="tab" data-tab="users">Usuarios</button>' : ''}
        <button class="tab" data-tab="about">Acerca de</button>
      </div>

      <!-- Categorías -->
      <div class="tab-content active" id="categories-tab">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Categorías de Productos</h3>
            ${auth.canManage() ? '<button class="btn btn-primary btn-sm" id="add-category-btn">+ Agregar</button>' : ''}
          </div>
          <div class="card-body">
            <div id="categories-container">
              <div class="loading"><div class="spinner"></div></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Almacenes -->
      <div class="tab-content" id="warehouses-tab">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Almacenes</h3>
            ${auth.canManage() ? '<button class="btn btn-primary btn-sm" id="add-warehouse-btn">+ Agregar</button>' : ''}
          </div>
          <div class="card-body">
            <div id="warehouses-container">
              <div class="loading"><div class="spinner"></div></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Usuarios -->
      ${auth.isAdmin() ? `
        <div class="tab-content" id="users-tab">
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">Usuarios del Sistema</h3>
              <button class="btn btn-primary btn-sm" id="add-user-btn">+ Agregar</button>
            </div>
            <div class="card-body">
              <div id="users-container">
                <div class="loading"><div class="spinner"></div></div>
              </div>
            </div>
          </div>
        </div>
      ` : ''}

      <!-- Acerca de -->
      <div class="tab-content" id="about-tab">
        <div class="card">
          <div class="card-body">
            <div style="text-align: center; padding: 40px 20px;">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" style="margin-bottom: 20px; color: var(--primary);">
                <path d="M20 7L12 3L4 7M20 7L12 11M20 7V17L12 21M12 11L4 7M12 11V21M4 7V17L12 21" stroke="currentColor" stroke-width="2"/>
              </svg>
              <h2 style="margin-bottom: 8px;">Sistema de Gestión de Inventario</h2>
              <p style="color: var(--gray-600); margin-bottom: 24px;">Versión 1.0.0</p>
              
              <div class="divider"></div>
              
              <div style="text-align: left; max-width: 600px; margin: 0 auto;">
                <h3 style="margin-bottom: 12px;">Usuario Actual</h3>
                <p><strong>Nombre:</strong> ${user.fullName}</p>
                <p><strong>Email:</strong> ${user.email}</p>
                <p><strong>Rol:</strong> <span class="badge primary">${user.role}</span></p>
              </div>

              <div class="divider"></div>

              <div style="text-align: left; max-width: 600px; margin: 0 auto;">
                <h3 style="margin-bottom: 12px;">Características</h3>
                <ul style="list-style: none; padding: 0;">
                  <li style="padding: 8px 0;">✓ Gestión completa de productos e inventario</li>
                  <li style="padding: 8px 0;">✓ Control de órdenes de compra y venta</li>
                  <li style="padding: 8px 0;">✓ Múltiples almacenes</li>
                  <li style="padding: 8px 0;">✓ Movimientos de stock en tiempo real</li>
                  <li style="padding: 8px 0;">✓ Control de acceso basado en roles</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.setupEventListeners();
    await this.loadCategories();
  },

  setupEventListeners() {
    // Tabs
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        tab.classList.add('active');
        const tabId = tab.dataset.tab;
        document.getElementById(`${tabId}-tab`).classList.add('active');
        
        if (tabId === 'categories') this.loadCategories();
        else if (tabId === 'warehouses') this.loadWarehouses();
        else if (tabId === 'users') this.loadUsers();
      });
    });

    // Botones
    document.getElementById('add-category-btn')?.addEventListener('click', () => this.showCategoryModal());
    document.getElementById('add-warehouse-btn')?.addEventListener('click', () => this.showWarehouseModal());
    document.getElementById('add-user-btn')?.addEventListener('click', () => this.showUserModal());
  },

  async loadCategories() {
    try {
      const response = await api.getCategories({ limit: 100 });
      const normalized = utils.normalizeResponse(response);
      const container = document.getElementById('categories-container');

      if (!normalized.data || normalized.data.length === 0) {
        utils.showEmptyState(container, 'No hay categorías');
        return;
      }

      const html = `
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Descripción</th>
              ${auth.canManage() ? '<th class="text-right">Acciones</th>' : ''}
            </tr>
          </thead>
          <tbody>
            ${normalized.data.map(cat => `
              <tr>
                <td><strong>${utils.escapeHtml(cat.name)}</strong></td>
                <td>${cat.description ? utils.escapeHtml(cat.description) : 'N/A'}</td>
                ${auth.canManage() ? `
                  <td class="text-right">
                    <div class="action-buttons">
                      <button class="action-btn edit" onclick="settingsView.showCategoryModal('${cat.id}')">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" stroke-width="2"/>
                          <path d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke="currentColor" stroke-width="2"/>
                        </svg>
                      </button>
                      ${auth.isAdmin() ? `
                        <button class="action-btn delete" onclick="settingsView.deleteCategory('${cat.id}')">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <path d="M3 6H5H21" stroke="currentColor" stroke-width="2"/>
                            <path d="M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" stroke-width="2"/>
                          </svg>
                        </button>
                      ` : ''}
                    </div>
                  </td>
                ` : ''}
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;

      container.innerHTML = html;
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  },

  async loadWarehouses() {
    try {
      const response = await api.getWarehouses({ limit: 100 });
      const normalized = utils.normalizeResponse(response);
      const container = document.getElementById('warehouses-container');

      if (!normalized.data || normalized.data.length === 0) {
        utils.showEmptyState(container, 'No hay almacenes');
        return;
      }

      const html = `
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Ubicación</th>
              ${auth.canManage() ? '<th class="text-right">Acciones</th>' : ''}
            </tr>
          </thead>
          <tbody>
            ${normalized.data.map(wh => `
              <tr>
                <td><strong>${utils.escapeHtml(wh.name)}</strong></td>
                <td>${wh.location ? utils.escapeHtml(wh.location) : 'N/A'}</td>
                ${auth.canManage() ? `
                  <td class="text-right">
                    <div class="action-buttons">
                      <button class="action-btn edit" onclick="settingsView.showWarehouseModal('${wh.id}')">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" stroke-width="2"/>
                          <path d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke="currentColor" stroke-width="2"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                ` : ''}
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;

      container.innerHTML = html;
    } catch (error) {
      console.error('Error loading warehouses:', error);
    }
  },

  async loadUsers() {
    try {
      const response = await api.getUsers({ limit: 100 });
      const normalized = utils.normalizeResponse(response);
      const container = document.getElementById('users-container');

      if (!normalized.data || normalized.data.length === 0) {
        utils.showEmptyState(container, 'No hay usuarios');
        return;
      }

      const html = `
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th class="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${normalized.data.map(user => `
              <tr>
                <td><strong>${utils.escapeHtml(user.fullName)}</strong></td>
                <td>${utils.escapeHtml(user.email)}</td>
                <td><span class="badge primary">${user.role}</span></td>
                <td class="text-right">
                  <div class="action-buttons">
                    <button class="action-btn edit" onclick="settingsView.showUserModal('${user.id}')">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" stroke-width="2"/>
                        <path d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke="currentColor" stroke-width="2"/>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;

      container.innerHTML = html;
    } catch (error) {
      console.error('Error loading users:', error);
    }
  },

  async showCategoryModal(categoryId = null) {
    let category = null;
    
    if (categoryId) {
      try {
        category = await api.getCategory(categoryId);
      } catch (error) {
        console.error('Error loading category:', error);
        utils.showToast('Error al cargar categoría', 'error');
        return;
      }
    }

    const modalHtml = `
      <div class="modal-overlay" id="category-modal">
        <div class="modal">
          <div class="modal-header">
            <h3 class="modal-title">${category ? 'Editar Categoría' : 'Nueva Categoría'}</h3>
            <button class="modal-close" onclick="document.getElementById('category-modal').remove()">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2"/>
              </svg>
            </button>
          </div>
          <form id="category-form">
            <div class="modal-body">
              <div class="form-group">
                <label>Nombre *</label>
                <input type="text" name="name" required value="${category?.name || ''}">
              </div>
              
              <div class="form-group">
                <label>Descripción</label>
                <textarea name="description">${category?.description || ''}</textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" onclick="document.getElementById('category-modal').remove()">Cancelar</button>
              <button type="submit" class="btn btn-primary">Guardar</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    document.getElementById('category-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = Object.fromEntries(formData.entries());

      try {
        if (categoryId) {
          await api.updateCategory(categoryId, data);
        } else {
          await api.createCategory(data);
        }
        utils.showToast('Categoría guardada correctamente', 'success');
        document.getElementById('category-modal').remove();
        await this.loadCategories();
      } catch (error) {
        utils.showToast(error.message || 'Error al guardar', 'error');
      }
    });
  },

  async showWarehouseModal(warehouseId = null) {
    let warehouse = null;

    if (warehouseId) {
      try {
        warehouse = await api.getWarehouse(warehouseId);
      } catch (error) {
        console.error('Error loading warehouse:', error);
        utils.showToast('Error al cargar almacén', 'error');
        return;
      }
    }

    const modalHtml = `
      <div class="modal-overlay" id="warehouse-modal">
        <div class="modal">
          <div class="modal-header">
            <h3 class="modal-title">${warehouse ? 'Editar Almacén' : 'Nuevo Almacén'}</h3>
            <button class="modal-close" onclick="document.getElementById('warehouse-modal').remove()">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2"/>
              </svg>
            </button>
          </div>
          <form id="warehouse-form">
            <div class="modal-body">
              <div class="form-group">
                <label>Nombre *</label>
                <input type="text" name="name" required value="${warehouse?.name || ''}">
              </div>
              
              <div class="form-group">
                <label>Ubicación</label>
                <textarea name="location">${warehouse?.location || ''}</textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" onclick="document.getElementById('warehouse-modal').remove()">Cancelar</button>
              <button type="submit" class="btn btn-primary">Guardar</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    document.getElementById('warehouse-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = Object.fromEntries(formData.entries());

      try {
        if (warehouseId) {
          await api.updateWarehouse(warehouseId, data);
        } else {
          await api.createWarehouse(data);
        }
        utils.showToast('Almacén guardado correctamente', 'success');
        document.getElementById('warehouse-modal').remove();
        await this.loadWarehouses();
      } catch (error) {
        utils.showToast(error.message || 'Error al guardar', 'error');
      }
    });
  },

  async showUserModal(userId = null) {
    let user = null;

    if (userId) {
      try {
        user = await api.getUser(userId);
      } catch (error) {
        console.error('Error loading user:', error);
        utils.showToast('Error al cargar usuario', 'error');
        return;
      }
    }

    const modalHtml = `
      <div class="modal-overlay" id="user-modal">
        <div class="modal">
          <div class="modal-header">
            <h3 class="modal-title">${userId ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
            <button class="modal-close" onclick="document.getElementById('user-modal').remove()">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2"/>
              </svg>
            </button>
          </div>
          <form id="user-form">
            <div class="modal-body">
              <div class="form-group">
                <label>Nombre Completo *</label>
                <input type="text" name="fullName" required value="${user?.fullName || ''}">
              </div>
              
              <div class="form-group">
                <label>Email *</label>
                <input type="email" name="email" required value="${user?.email || ''}">
              </div>
              
              ${!userId ? `
                <div class="form-group">
                  <label>Contraseña *</label>
                  <input type="password" name="password" required minlength="8">
                </div>
              ` : ''}
              
              <div class="form-group">
                <label>Rol *</label>
                <select name="role" required>
                  <option value="CLERK" ${user?.role === 'CLERK' ? 'selected' : ''}>CLERK (Solo lectura)</option>
                  <option value="MANAGER" ${user?.role === 'MANAGER' ? 'selected' : ''}>MANAGER (Operaciones)</option>
                  <option value="ADMIN" ${user?.role === 'ADMIN' ? 'selected' : ''}>ADMIN (Administrador)</option>
                </select>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" onclick="document.getElementById('user-modal').remove()">Cancelar</button>
              <button type="submit" class="btn btn-primary">Guardar</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    document.getElementById('user-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = Object.fromEntries(formData.entries());

      try {
        if (userId) {
          await api.updateUser(userId, data);
        } else {
          await api.createUser(data);
        }
        utils.showToast('Usuario guardado correctamente', 'success');
        document.getElementById('user-modal').remove();
        await this.loadUsers();
      } catch (error) {
        console.error('Error al guardar usuario:', error);
        utils.showToast(error.message || 'Error al guardar', 'error');
      }
    });
  },

  async deleteCategory(id) {
    const confirmed = await utils.confirm('¿Eliminar esta categoría?', '¿Estás seguro?');
    if (!confirmed) return;

    try {
      await api.deleteCategory(id);
      utils.showToast('Categoría eliminada correctamente', 'success');
      await this.loadCategories();
    } catch (error) {
      utils.showToast(error.message || 'Error al eliminar', 'error');
    }
  }
};

window.settingsView = settingsView;
