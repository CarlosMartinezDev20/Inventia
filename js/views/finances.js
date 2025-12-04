// finances.js
// Vista de Finanzas - Dashboard, Transacciones y Reportes

const financesView = {
  categories: [],
  transactions: [],
  stats: null,
  monthlyData: [],
  currentFilters: {
    type: '',
    categoryId: '',
    startDate: '',
    endDate: '',
  },

  async render() {
    const container = document.getElementById('view-container');
    container.innerHTML = `
      <div class="page-header">
        <div class="page-header-content">
          <div class="page-header-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2V22M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div>
            <h1 class="page-title">Finanzas</h1>
            <p class="page-subtitle">Control de ingresos, egresos y reportes financieros</p>
          </div>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-primary" id="add-transaction-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Nueva Transacción
          </button>
        </div>
      </div>

      <!-- Dashboard KPIs -->
      <div id="finance-stats" class="stats-container" style="margin-bottom: 24px;"></div>

      <!-- Gráfica de Ingresos vs Egresos -->
      <div class="card" style="margin-bottom: 24px;">
        <div class="card-header">
          <h3 class="card-title">Comparativa Mensual</h3>
          <div class="card-actions">
            <select id="months-selector" class="input" style="width: 150px;">
              <option value="3">3 meses</option>
              <option value="6" selected>6 meses</option>
              <option value="12">12 meses</option>
            </select>
          </div>
        </div>
        <div class="card-body">
          <canvas id="monthly-chart" style="max-height: 300px;"></canvas>
        </div>
      </div>

      <!-- Filtros y Tabla de Transacciones -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Transacciones</h3>
        </div>
        <div class="card-body">
          <!-- Filtros -->
          <div class="filters-container" style="margin-bottom: 20px;">
            <div class="filters-grid">
              <div class="form-group">
                <label>Tipo</label>
                <select id="filter-type" class="input">
                  <option value="">Todos</option>
                  <option value="INCOME">Ingresos</option>
                  <option value="EXPENSE">Egresos</option>
                </select>
              </div>
              <div class="form-group">
                <label>Categoría</label>
                <select id="filter-category" class="input">
                  <option value="">Todas</option>
                </select>
              </div>
              <div class="form-group">
                <label>Fecha Inicio</label>
                <input type="date" id="filter-start-date" class="input">
              </div>
              <div class="form-group">
                <label>Fecha Fin</label>
                <input type="date" id="filter-end-date" class="input">
              </div>
            </div>
            <div style="display: flex; gap: 12px; margin-top: 12px;">
              <button class="btn btn-primary" id="apply-filters-btn">Aplicar Filtros</button>
              <button class="btn btn-secondary" id="clear-filters-btn">Limpiar</button>
            </div>
          </div>

          <!-- Tabla -->
          <div class="table-container">
            <table class="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Categoría</th>
                  <th>Descripción</th>
                  <th>Monto</th>
                  <th>Referencia</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody id="transactions-tbody"></tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    await this.loadData();
    this.setupEventListeners();
  },

  async loadData() {
    try {
      // Cargar categorías
      this.categories = await api.get('/finances/categories');
      this.populateCategoryFilter();

      // Cargar estadísticas
      await this.loadStats();

      // Cargar datos mensuales
      await this.loadMonthlyData();

      // Cargar transacciones
      await this.loadTransactions();
    } catch (error) {
      console.error('Error loading finances data:', error);
      showToast('Error al cargar datos financieros', 'error');
    }
  },

  async loadStats() {
    const params = new URLSearchParams();
    if (this.currentFilters.startDate) params.append('startDate', this.currentFilters.startDate);
    if (this.currentFilters.endDate) params.append('endDate', this.currentFilters.endDate);

    this.stats = await api.get(`/finances/dashboard/stats?${params}`);
    this.renderStats();
  },

  async loadMonthlyData(months = 6) {
    this.monthlyData = await api.get(`/finances/dashboard/monthly-comparison?months=${months}`);
    this.renderMonthlyChart();
  },

  async loadTransactions() {
    const params = new URLSearchParams();
    if (this.currentFilters.type) params.append('type', this.currentFilters.type);
    if (this.currentFilters.categoryId) params.append('categoryId', this.currentFilters.categoryId);
    if (this.currentFilters.startDate) params.append('startDate', this.currentFilters.startDate);
    if (this.currentFilters.endDate) params.append('endDate', this.currentFilters.endDate);

    this.transactions = await api.get(`/finances/transactions?${params}`);
    this.renderTransactions();
  },

  renderStats() {
    const container = document.getElementById('finance-stats');
    if (!this.stats) return;

    const profitColor = this.stats.netProfit >= 0 ? 'var(--success)' : 'var(--danger)';
    const profitIcon = this.stats.netProfit >= 0 ? '📈' : '📉';

    container.innerHTML = `
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #10B981 0%, #059669 100%);">
          💰
        </div>
        <div class="stat-info">
          <div class="stat-label">Ingresos Totales</div>
          <div class="stat-value">$${this.formatMoney(this.stats.totalIncome)}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);">
          📤
        </div>
        <div class="stat-info">
          <div class="stat-label">Egresos Totales</div>
          <div class="stat-value">$${this.formatMoney(this.stats.totalExpense)}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, ${profitColor} 0%, ${profitColor} 100%);">
          ${profitIcon}
        </div>
        <div class="stat-info">
          <div class="stat-label">Ganancia Neta</div>
          <div class="stat-value" style="color: ${profitColor};">$${this.formatMoney(this.stats.netProfit)}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);">
          📊
        </div>
        <div class="stat-info">
          <div class="stat-label">Margen de Ganancia</div>
          <div class="stat-value">${this.stats.profitMargin.toFixed(2)}%</div>
        </div>
      </div>
    `;
  },

  renderMonthlyChart() {
    const canvas = document.getElementById('monthly-chart');
    const ctx = canvas.getContext('2d');

    // Destruir gráfica anterior si existe
    if (window.financeChart) {
      window.financeChart.destroy();
    }

    const labels = this.monthlyData.map(d => {
      const [year, month] = d.month.split('-');
      const date = new Date(year, month - 1);
      return date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
    });

    const incomeData = this.monthlyData.map(d => d.income);
    const expenseData = this.monthlyData.map(d => d.expense);
    const profitData = this.monthlyData.map(d => d.profit);

    window.financeChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Ingresos',
            data: incomeData,
            borderColor: '#10B981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
          },
          {
            label: 'Egresos',
            data: expenseData,
            borderColor: '#EF4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
          },
          {
            label: 'Ganancia',
            data: profitData,
            borderColor: '#8B5CF6',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: true,
            position: 'top',
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                label += '$' + context.parsed.y.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                return label;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return '$' + value.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
              }
            }
          }
        }
      }
    });
  },

  renderTransactions() {
    const tbody = document.getElementById('transactions-tbody');
    
    if (this.transactions.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No hay transacciones</td></tr>';
      return;
    }

    tbody.innerHTML = this.transactions.map(t => {
      const typeClass = t.type === 'INCOME' ? 'badge-success' : 'badge-danger';
      const typeText = t.type === 'INCOME' ? 'Ingreso' : 'Egreso';
      const amountColor = t.type === 'INCOME' ? 'var(--success)' : 'var(--danger)';
      const date = new Date(t.transactionDate).toLocaleDateString('es-ES');

      return `
        <tr>
          <td>${date}</td>
          <td><span class="badge ${typeClass}">${typeText}</span></td>
          <td>
            <span style="display: inline-flex; align-items: center; gap: 4px;">
              ${t.category.icon || '💼'} ${t.category.name}
            </span>
          </td>
          <td>${t.description || '-'}</td>
          <td style="font-weight: 600; color: ${amountColor};">
            ${t.type === 'INCOME' ? '+' : '-'}$${this.formatMoney(t.amount)}
          </td>
          <td>${t.reference || '-'}</td>
          <td>
            <div class="action-buttons">
              <button class="btn-icon btn-icon-danger" onclick="financesView.deleteTransaction('${t.id}')" title="Eliminar">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  populateCategoryFilter() {
    const select = document.getElementById('filter-category');
    const currentValue = select.value;
    
    const options = this.categories.map(c => 
      `<option value="${c.id}">${c.icon || ''} ${c.name}</option>`
    ).join('');
    
    select.innerHTML = '<option value="">Todas</option>' + options;
    select.value = currentValue;
  },

  setupEventListeners() {
    // Botón nueva transacción
    document.getElementById('add-transaction-btn')?.addEventListener('click', () => {
      this.showTransactionModal();
    });

    // Selector de meses para gráfica
    document.getElementById('months-selector')?.addEventListener('change', (e) => {
      this.loadMonthlyData(parseInt(e.target.value));
    });

    // Filtros
    document.getElementById('apply-filters-btn')?.addEventListener('click', () => {
      this.applyFilters();
    });

    document.getElementById('clear-filters-btn')?.addEventListener('click', () => {
      this.clearFilters();
    });
  },

  async applyFilters() {
    this.currentFilters = {
      type: document.getElementById('filter-type').value,
      categoryId: document.getElementById('filter-category').value,
      startDate: document.getElementById('filter-start-date').value,
      endDate: document.getElementById('filter-end-date').value,
    };

    await this.loadStats();
    await this.loadTransactions();
  },

  async clearFilters() {
    this.currentFilters = { type: '', categoryId: '', startDate: '', endDate: '' };
    
    document.getElementById('filter-type').value = '';
    document.getElementById('filter-category').value = '';
    document.getElementById('filter-start-date').value = '';
    document.getElementById('filter-end-date').value = '';

    await this.loadStats();
    await this.loadTransactions();
  },

  showTransactionModal(transaction = null) {
    const isEdit = !!transaction;
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.innerHTML = `
      <div class="modal modal-lg active">
        <div class="modal-header">
          <h3 class="modal-title">${isEdit ? 'Editar' : 'Nueva'} Transacción</h3>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
        </div>
        <form id="transaction-form">
          <div class="modal-body">
            <div class="form-grid">
              <div class="form-group">
                <label>Tipo *</label>
                <select name="type" class="input" required>
                  <option value="">Seleccionar...</option>
                  <option value="INCOME" ${transaction?.type === 'INCOME' ? 'selected' : ''}>Ingreso</option>
                  <option value="EXPENSE" ${transaction?.type === 'EXPENSE' ? 'selected' : ''}>Egreso</option>
                </select>
              </div>
              
              <div class="form-group">
                <label>Categoría *</label>
                <select name="categoryId" class="input" required>
                  <option value="">Seleccionar...</option>
                  ${this.categories.map(c => 
                    `<option value="${c.id}" ${transaction?.categoryId === c.id ? 'selected' : ''}>
                      ${c.icon || ''} ${c.name}
                    </option>`
                  ).join('')}
                </select>
              </div>

              <div class="form-group">
                <label>Monto *</label>
                <input type="number" name="amount" class="input" step="0.01" min="0" required 
                  value="${transaction?.amount || ''}" placeholder="0.00">
              </div>

              <div class="form-group">
                <label>Fecha *</label>
                <input type="date" name="transactionDate" class="input" required 
                  value="${transaction?.transactionDate?.split('T')[0] || new Date().toISOString().split('T')[0]}">
              </div>

              <div class="form-group" style="grid-column: span 2;">
                <label>Descripción</label>
                <textarea name="description" class="input" rows="3" 
                  placeholder="Detalles de la transacción...">${transaction?.description || ''}</textarea>
              </div>

              <div class="form-group" style="grid-column: span 2;">
                <label>Referencia</label>
                <input type="text" name="reference" class="input" 
                  value="${transaction?.reference || ''}" placeholder="Ej: Factura #123">
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary">
              ${isEdit ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('#transaction-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveTransaction(new FormData(e.target), transaction?.id);
      modal.remove();
    });
  },

  async saveTransaction(formData, id = null) {
    try {
      const data = {
        type: formData.get('type'),
        categoryId: formData.get('categoryId'),
        amount: parseFloat(formData.get('amount')),
        description: formData.get('description'),
        transactionDate: formData.get('transactionDate'),
        reference: formData.get('reference'),
      };

      if (id) {
        await api.put(`/finances/transactions/${id}`, data);
        showToast('Transacción actualizada', 'success');
      } else {
        await api.post('/finances/transactions', data);
        showToast('Transacción creada', 'success');
      }

      await this.loadData();
    } catch (error) {
      console.error('Error saving transaction:', error);
      showToast('Error al guardar transacción', 'error');
    }
  },

  async deleteTransaction(id) {
    if (!confirm('¿Estás seguro de eliminar esta transacción?')) return;

    try {
      await api.delete(`/finances/transactions/${id}`);
      showToast('Transacción eliminada', 'success');
      await this.loadData();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      showToast('Error al eliminar transacción', 'error');
    }
  },

  formatMoney(amount) {
    return parseFloat(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  },
};

// Exportar
window.financesView = financesView;
