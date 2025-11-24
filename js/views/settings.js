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
        ${permissions.canAccessSettingsSection('categories') ? '<button class="tab active" data-tab="categories">Categorías</button>' : ''}
        ${permissions.canAccessSettingsSection('warehouses') ? `<button class="tab${!permissions.canAccessSettingsSection('categories') ? ' active' : ''}" data-tab="warehouses">Almacenes</button>` : ''}
        ${permissions.canAccessSettingsSection('users') ? `<button class="tab${!permissions.canAccessSettingsSection('categories') && !permissions.canAccessSettingsSection('warehouses') ? ' active' : ''}" data-tab="users">Usuarios</button>` : ''}
        <button class="tab${!permissions.canAccessSettingsSection('categories') && !permissions.canAccessSettingsSection('warehouses') && !permissions.canAccessSettingsSection('users') ? ' active' : ''}" data-tab="about">Acerca de</button>
      </div>

      <!-- Categorías -->
      ${permissions.canAccessSettingsSection('categories') ? `
        <div class="tab-content active" id="categories-tab">
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">Categorías de Productos</h3>
              <button class="btn btn-primary btn-sm" id="add-category-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
                </svg>
                Agregar
              </button>
            </div>
            <div class="card-body">
              <div id="categories-container">
                <div class="loading"><div class="spinner"></div></div>
              </div>
            </div>
          </div>
        </div>
      ` : ''}

      <!-- Almacenes -->
      ${permissions.canAccessSettingsSection('warehouses') ? `
        <div class="tab-content${!permissions.canAccessSettingsSection('categories') ? ' active' : ''}" id="warehouses-tab">
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">Almacenes</h3>
              <button class="btn btn-primary btn-sm" id="add-warehouse-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
                </svg>
                Agregar
              </button>
            </div>
            <div class="card-body">
              <div id="warehouses-container">
                <div class="loading"><div class="spinner"></div></div>
              </div>
            </div>
          </div>
        </div>
      ` : ''}

      <!-- Usuarios -->
      ${permissions.canAccessSettingsSection('users') ? `
        <div class="tab-content${!permissions.canAccessSettingsSection('categories') && !permissions.canAccessSettingsSection('warehouses') ? ' active' : ''}" id="users-tab">
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">Usuarios del Sistema</h3>
              <button class="btn btn-primary btn-sm" id="add-user-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
                </svg>
                Agregar
              </button>
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
      <div class="tab-content${!permissions.canAccessSettingsSection('categories') && !permissions.canAccessSettingsSection('warehouses') && !permissions.canAccessSettingsSection('users') ? ' active' : ''}" id="about-tab">
        <div class="card">
          <div class="card-body">
            <div style="text-align: center; padding: 40px 20px;">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" style="margin-bottom: 20px; color: var(--primary);">
                <path d="M20 7L12 3L4 7M20 7L12 11M20 7V17L12 21M12 11L4 7M12 11V21M4 7V17L12 21" stroke="currentColor" stroke-width="2"/>
              </svg>
              <h2 style="margin-bottom: 8px;">Inventia</h2>
              <p style="color: var(--gray-600); margin-bottom: 24px;">Versión 1.0.0</p>
              
              <div class="divider"></div>
              
              <div style="text-align: left; max-width: 600px; margin: 0 auto;">
                <h3 style="margin-bottom: 12px;">Usuario Actual</h3>
                <p><strong>Nombre:</strong> ${user.fullName}</p>
                <p><strong>Email:</strong> ${user.email}</p>
                <p><strong>Rol:</strong> <span class="badge primary">${permissions.getRoleLabel(user.role)}</span></p>
                <p style="margin-top: 8px; color: var(--gray-600); font-size: 14px;">${permissions.getRoleDescription(user.role)}</p>
              </div>

              <div class="divider"></div>

              <div style="text-align: left; max-width: 600px; margin: 0 auto;">
                <h3 style="margin-bottom: 12px;">Características</h3>
                <ul style="list-style: none; padding: 0;">
                  <li style="padding: 8px 0;">✓ Sistema integral de gestión de inventario</li>
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
    
    // Cargar el contenido de la pestaña activa según permisos
    if (permissions.canAccessSettingsSection('categories')) {
      await this.loadCategories();
    } else if (permissions.canAccessSettingsSection('warehouses')) {
      await this.loadWarehouses();
    } else if (permissions.canAccessSettingsSection('users')) {
      await this.loadUsers();
    }
  },

  setupEventListeners() {
    // Tabs
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const tabId = tab.dataset.tab;
        
        // Verificar permisos antes de cambiar de pestaña
        if (tabId !== 'about' && !permissions.canAccessSettingsSection(tabId)) {
          utils.showToast(
            'No tienes permiso para acceder a esta sección',
            'error',
            'Acceso denegado'
          );
          return;
        }
        
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        tab.classList.add('active');
        document.getElementById(`${tabId}-tab`)?.classList.add('active');
        
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
                      ${auth.isAdmin() ? `
                        <button class="action-btn delete" onclick="settingsView.deleteWarehouse('${wh.id}')">
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
                    <button class="action-btn delete" onclick="settingsView.deleteUser('${user.id}')">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M3 6H5H21" stroke="currentColor" stroke-width="2"/>
                        <path d="M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" stroke-width="2"/>
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
      const form = e.target;
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());

      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Guardando...';

      try {
        if (categoryId) {
          await api.updateCategory(categoryId, data);
        } else {
          await api.createCategory(data);
        }
        utils.showToast(
          `La categoría "${formData.get('name')}" ha sido guardada exitosamente`,
          'success',
          '¡Categoría guardada!',
          4000
        );
        document.getElementById('category-modal').remove();
        await this.loadCategories();
      } catch (error) {
        console.error('Error al guardar categoría:', error);
        utils.showToast(error.message || 'Error al guardar', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Guardar';
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
      const form = e.target;
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());

      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Guardando...';

      try {
        if (warehouseId) {
          await api.updateWarehouse(warehouseId, data);
        } else {
          await api.createWarehouse(data);
        }
        utils.showToast(
          `El almacén "${formData.get('name')}" ha sido guardado exitosamente`,
          'success',
          '¡Almacén guardado!',
          4000
        );
        document.getElementById('warehouse-modal').remove();
        await this.loadWarehouses();
      } catch (error) {
        console.error('Error al guardar almacén:', error);
        utils.showToast(error.message || 'Error al guardar', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Guardar';
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
              
              <div class="form-group">
                <label>Contraseña ${userId ? '(dejar en blanco para mantener)' : '*'}</label>
                <div class="password-input-wrapper">
                  <input type="password" id="user-password" name="password" ${!userId ? 'required' : ''} minlength="8" placeholder="${userId ? 'Nueva contraseña' : 'Mínimo 8 caracteres'}">
                  <button type="button" class="password-toggle" onclick="settingsView.togglePasswordVisibility('user-password')">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" class="eye-icon">
                      <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" class="eye-off-icon" style="display: none;">
                      <path d="M17.94 17.94C16.2306 19.243 14.1491 19.9649 12 20C5 20 1 12 1 12C2.24389 9.6819 3.96914 7.65661 6.06 6.06M9.9 4.24C10.5883 4.0789 11.2931 3.99836 12 4C19 4 23 12 23 12C22.393 13.1356 21.6691 14.2048 20.84 15.19M14.12 14.12C13.8454 14.4147 13.5141 14.6512 13.1462 14.8151C12.7782 14.9791 12.3809 15.0673 11.9781 15.0744C11.5753 15.0815 11.1752 15.0074 10.8016 14.8565C10.4281 14.7056 10.0887 14.4811 9.80385 14.1962C9.51897 13.9113 9.29439 13.572 9.14351 13.1984C8.99262 12.8249 8.91853 12.4247 8.92563 12.0219C8.93274 11.6191 9.02091 11.2219 9.18488 10.8539C9.34884 10.4859 9.58525 10.1547 9.88 9.88" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>
              
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
      const form = e.target;
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());

      // Si estamos editando y la contraseña está vacía, no enviarla
      if (userId && !data.password) {
        delete data.password;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Guardando...';

      try {
        if (userId) {
          await api.updateUser(userId, data);
        } else {
          await api.createUser(data);
        }
        utils.showToast(
          `El usuario "${formData.get('fullName')}" ha sido guardado exitosamente`,
          'success',
          '¡Usuario guardado!',
          4000
        );
        document.getElementById('user-modal').remove();
        await this.loadUsers();
      } catch (error) {
        console.error('Error al guardar usuario:', error);
        utils.showToast(error.message || 'Error al guardar', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Guardar';
      }
    });
  },

  async deleteCategory(id) {
    const confirmed = await utils.confirm(
      'Esta acción no se puede deshacer. La categoría será eliminada permanentemente.',
      'Eliminar Categoría',
      'danger'
    );
    if (!confirmed) return;

    try {
      await api.deleteCategory(id);
      utils.showToast(
        'La categoría ha sido eliminada correctamente',
        'success',
        '¡Categoría eliminada!'
      );
      await this.loadCategories();
    } catch (error) {
      utils.showToast(error.message || 'Error al eliminar', 'error', 'Error');
    }
  },

  async deleteWarehouse(id) {
    const confirmed = await utils.confirm(
      'El almacén será marcado como eliminado. No afectará el historial de inventario existente.',
      'Eliminar Almacén',
      'danger'
    );
    if (!confirmed) return;

    try {
      await api.deleteWarehouse(id);
      utils.showToast(
        'El almacén ha sido eliminado correctamente',
        'success',
        '¡Almacén eliminado!'
      );
      await this.loadWarehouses();
    } catch (error) {
      utils.showToast(error.message || 'Error al eliminar', 'error', 'Error');
    }
  },

  async deleteUser(id) {
    const confirmed = await utils.confirm(
      'El usuario será marcado como eliminado y no podrá acceder al sistema. Su historial de actividades se conservará.',
      'Eliminar Usuario',
      'danger'
    );
    if (!confirmed) return;

    try {
      await api.deleteUser(id);
      utils.showToast(
        'El usuario ha sido eliminado correctamente',
        'success',
        '¡Usuario eliminado!'
      );
      await this.loadUsers();
    } catch (error) {
      utils.showToast(error.message || 'Error al eliminar', 'error', 'Error');
    }
  },

  togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    const button = input.parentElement.querySelector('.password-toggle');
    const eyeIcon = button.querySelector('.eye-icon');
    const eyeOffIcon = button.querySelector('.eye-off-icon');
    
    if (input.type === 'password') {
      input.type = 'text';
      eyeIcon.style.display = 'none';
      eyeOffIcon.style.display = 'block';
    } else {
      input.type = 'password';
      eyeIcon.style.display = 'block';
      eyeOffIcon.style.display = 'none';
    }
  }
};

window.settingsView = settingsView;
