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
  charts: {
    monthly: null,
    categories: null,
  },

  async render() {
    const container = document.getElementById('view-container');
    container.innerHTML = `
      <div class="dashboard-welcome" style="animation: fadeInUp 0.5s ease-out;">
        <div class="welcome-content">
          <div class="welcome-text">
            <h1 class="welcome-title">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 12px;">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6"/>
              </svg>
              Gestión Financiera
            </h1>
            <p class="welcome-subtitle">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 6px; opacity: 0.6;">
                <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"/>
                <path d="M12 7V12L15 15"/>
              </svg>
              Control completo de ingresos, egresos y análisis financiero
            </p>
          </div>
          <div style="display: flex; gap: 12px; align-items: center;">
            <button class="btn btn-secondary" id="export-btn" style="padding: 12px 20px; font-size: 14px; font-weight: 600;" title="Exportar reporte">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right: 8px;">
                <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15"/>
                <path d="M7 10L12 15L17 10"/>
                <path d="M12 15V3"/>
              </svg>
              Exportar
            </button>
            <button class="btn btn-primary" id="add-transaction-btn" style="padding: 12px 24px; font-size: 14px; font-weight: 600;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right: 8px;">
                <path d="M12 5V19M5 12H19"/>
              </svg>
              Nueva Transacción
            </button>
          </div>
        </div>
      </div>

      <!-- Dashboard KPIs -->
      <div class="dashboard-stats-modern" id="finance-stats" style="animation: fadeInUp 0.5s ease-out 0.1s backwards;">
        <div class="loading-minimal">
          <div class="spinner-minimal"></div>
        </div>
      </div>

      <div class="dashboard-grid-modern" style="animation: fadeInUp 0.5s ease-out 0.2s backwards;">
        <!-- Gráfica de Ingresos vs Egresos -->
        <div class="dashboard-card-modern dashboard-card-large">
          <div class="dashboard-card-header-modern">
            <div class="card-header-content">
              <div class="card-icon-header primary">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 3V16C3 16.5304 3.21071 17.0391 3.58579 17.4142C3.96086 17.7893 4.46957 18 5 18H21"/>
                  <path d="M18 9L13 14L9 10L3 16"/>
                </svg>
              </div>
              <div>
                <h3 class="card-title-modern">Flujo de Efectivo</h3>
                <p class="card-subtitle-modern">Tendencia de ingresos y egresos</p>
              </div>
            </div>
            <select id="months-selector" class="input" style="width: 140px; height: 36px; font-size: 13px; transition: all 0.2s;">
              <option value="3">Últimos 3 meses</option>
              <option value="6" selected>Últimos 6 meses</option>
              <option value="12">Últimos 12 meses</option>
            </select>
          </div>
          <div class="dashboard-card-content">
            <div id="monthly-chart" style="min-height: 280px;">
              <div class="loading-minimal">
                <div class="spinner-minimal"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Distribución por Categorías -->
        <div class="dashboard-card-modern">
          <div class="dashboard-card-header-modern">
            <div class="card-header-content">
              <div class="card-icon-header info">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21.21 15.89C20.5738 17.3945 19.5788 18.7202 18.3119 19.7513C17.045 20.7824 15.5447 21.4874 13.9424 21.8048C12.3401 22.1221 10.6844 22.0421 9.12012 21.5718C7.55585 21.1015 6.13351 20.2551 4.96931 19.1066C3.80511 17.958 2.93783 16.5428 2.44253 14.984C1.94723 13.4251 1.84094 11.7705 2.13393 10.1646C2.42691 8.55878 3.10905 7.04902 4.12065 5.76619C5.13225 4.48336 6.44279 3.46591 7.93 2.80005"/>
                </svg>
              </div>
              <div>
                <h3 class="card-title-modern">Gastos por Categoría</h3>
                <p class="card-subtitle-modern">Análisis de egresos</p>
              </div>
            </div>
          </div>
          <div class="dashboard-card-content">
            <div id="categories-chart" style="min-height: 280px;">
              <div class="loading-minimal">
                <div class="spinner-minimal"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Filtros y Tabla de Transacciones -->
      <div class="dashboard-card-modern" style="margin-top: 24px; animation: fadeInUp 0.5s ease-out 0.3s backwards;">
        <div class="dashboard-card-header-modern">
          <div class="card-header-content">
            <div class="card-icon-header success">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"/>
                <path d="M14 2V8H20"/>
                <path d="M16 13H8"/>
                <path d="M16 17H8"/>
                <path d="M10 9H9H8"/>
              </svg>
            </div>
            <div>
              <h3 class="card-title-modern">Historial de Transacciones</h3>
              <p class="card-subtitle-modern" id="transactions-count">Cargando...</p>
            </div>
          </div>
          <div style="display: flex; gap: 8px; align-items: center;">
            <button class="btn btn-secondary" id="refresh-btn" style="padding: 8px 16px; height: 36px;" title="Actualizar datos">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21.5 2V8M21.5 8H15.5M21.5 8L18.3 5.29C17.0903 3.94276 15.5503 2.94907 13.8302 2.40678C12.1101 1.86449 10.2752 1.79412 8.51911 2.20299C6.76301 2.61186 5.15281 3.48563 3.85679 4.73545C2.56077 5.98527 1.62479 7.56479 1.15 9.29999"/>
                <path d="M2.5 22V16M2.5 16H8.5M2.5 16L5.7 18.71C6.90974 20.0572 8.44972 21.0509 10.1698 21.5932C11.8899 22.1355 13.7248 22.2059 15.4809 21.797C17.237 21.3881 18.8472 20.5144 20.1432 19.2645C21.4392 18.0147 22.3752 16.4352 22.85 14.7"/>
              </svg>
            </button>
          </div>
        </div>
        <div class="dashboard-card-content">
          <!-- Filtros -->
          <div class="filters-container" style="margin-bottom: 24px;">
            <div class="filters-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
              <div class="form-group">
                <label class="form-label-modern" style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-tertiary); margin-bottom: 8px; display: block;">Tipo</label>
                <select id="filter-type" class="input" style="height: 40px;">
                  <option value="">Todos</option>
                  <option value="INCOME">Ingresos</option>
                  <option value="EXPENSE">Egresos</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label-modern" style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-tertiary); margin-bottom: 8px; display: block;">Categoría</label>
                <select id="filter-category" class="input" style="height: 40px;">
                  <option value="">Todas</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label-modern" style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-tertiary); margin-bottom: 8px; display: block;">Fecha Inicio</label>
                <input type="date" id="filter-start-date" class="input" style="height: 40px;">
              </div>
              <div class="form-group">
                <label class="form-label-modern" style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-tertiary); margin-bottom: 8px; display: block;">Fecha Fin</label>
                <input type="date" id="filter-end-date" class="input" style="height: 40px;">
              </div>
            </div>
            <div style="display: flex; gap: 12px; margin-top: 16px;">
              <button class="btn btn-primary" id="apply-filters-btn" style="height: 40px; padding: 0 20px;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px;">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
                </svg>
                Aplicar Filtros
              </button>
              <button class="btn btn-secondary" id="clear-filters-btn" style="height: 40px; padding: 0 20px;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px;">
                  <path d="M18 6L6 18M6 6L18 18"/>
                </svg>
                Limpiar
              </button>
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
    this.renderCategoriesChart();
  },

  renderStats() {
    const container = document.getElementById('finance-stats');
    if (!this.stats) return;

    const profitColor = this.stats.netProfit >= 0 ? 'var(--success)' : 'var(--danger)';
    const profitTrend = this.stats.netProfit >= 0 ? 'up' : 'down';
    const trendIcon = this.stats.netProfit >= 0 
      ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M7 17L17 7M17 7H7M17 7V17"/></svg>'
      : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M7 7L17 17M17 17H7M17 17V7"/></svg>';

    container.innerHTML = `
      <div class="stat-card-modern stat-income" style="transition: all 0.3s ease;">
        <div class="stat-card-header">
          <div class="stat-icon-container success">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M12 2V22M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6"/>
            </svg>
          </div>
          <span class="stat-label-modern">Ingresos Totales</span>
        </div>
        <div class="stat-value-modern" style="color: var(--success);">$${this.formatMoney(this.stats.totalIncome)}</div>
        <div style="margin-top: 8px; font-size: 12px; color: var(--text-tertiary); display: flex; align-items: center; gap: 4px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M7 17L17 7M17 7H7M17 7V17"/>
          </svg>
          Dinero que entra al negocio
        </div>
      </div>

      <div class="stat-card-modern stat-expense" style="transition: all 0.3s ease;">
        <div class="stat-card-header">
          <div class="stat-icon-container danger">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M16 21V5C16 4.46957 15.7893 3.96086 15.4142 3.58579C15.0391 3.21071 14.5304 3 14 3H5C4.46957 3 3.96086 3.21071 3.58579 3.58579C3.21071 3.96086 3 4.46957 3 5V21M16 21H21M16 21H3M3 21H0M21 21V10C21 9.46957 20.7893 8.96086 20.4142 8.58579C20.0391 8.21071 19.5304 8 19 8H16M7 7H12M7 11H12M7 15H12"/>
            </svg>
          </div>
          <span class="stat-label-modern">Egresos Totales</span>
        </div>
        <div class="stat-value-modern" style="color: var(--danger);">$${this.formatMoney(this.stats.totalExpense)}</div>
        <div style="margin-top: 8px; font-size: 12px; color: var(--text-tertiary); display: flex; align-items: center; gap: 4px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M7 7L17 17M17 17H7M17 17V7"/>
          </svg>
          Gastos operativos
        </div>
      </div>

      <div class="stat-card-modern stat-profit" style="transition: all 0.3s ease;">
        <div class="stat-card-header">
          <div class="stat-icon-container ${profitTrend === 'up' ? 'success' : 'danger'}">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M3 3V16C3 16.5304 3.21071 17.0391 3.58579 17.4142C3.96086 17.7893 4.46957 18 5 18H21"/>
              <path d="M18 9L13 14L9 10L3 16"/>
            </svg>
          </div>
          <span class="stat-label-modern">Ganancia Neta</span>
        </div>
        <div class="stat-value-modern" style="color: ${profitColor}; display: flex; align-items: center; gap: 8px;">
          <span>$${this.formatMoney(this.stats.netProfit)}</span>
          <span style="color: ${profitColor}; opacity: 0.8;">${trendIcon}</span>
        </div>
        <div style="margin-top: 8px; font-size: 12px; color: var(--text-tertiary);">
          ${this.stats.netProfit >= 0 ? 'Balance positivo' : 'Balance negativo'}
        </div>
      </div>

      <div class="stat-card-modern stat-margin" style="transition: all 0.3s ease;">
        <div class="stat-card-header">
          <div class="stat-icon-container primary">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M9 11L12 14L22 4"/>
              <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16"/>
            </svg>
          </div>
          <span class="stat-label-modern">Margen de Ganancia</span>
        </div>
        <div class="stat-value-modern" style="color: var(--primary);">
          ${this.stats.profitMargin.toFixed(1)}%
        </div>
        <div style="margin-top: 8px; font-size: 12px; color: var(--text-tertiary);">
          Rentabilidad del negocio
        </div>
      </div>
    `;
  },

  async renderMonthlyChart() {
    const chartContainer = document.getElementById('monthly-chart');
    
    // Esperar a que ApexCharts esté disponible
    if (typeof ApexCharts === 'undefined') {
      console.error('ApexCharts no está disponible');
      return;
    }

    // Destruir gráfica anterior si existe
    if (this.charts.monthly) {
      this.charts.monthly.destroy();
    }

    const categories = this.monthlyData.map(d => {
      const [year, month] = d.month.split('-');
      const date = new Date(year, month - 1);
      return date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
    });

    const incomeData = this.monthlyData.map(d => d.income);
    const expenseData = this.monthlyData.map(d => d.expense);
    const profitData = this.monthlyData.map(d => d.profit);

    const options = {
      series: [
        {
          name: 'Ingresos',
          data: incomeData,
          color: '#10B981',
        },
        {
          name: 'Egresos',
          data: expenseData,
          color: '#EF4444',
        },
        {
          name: 'Ganancia',
          data: profitData,
          color: '#8B5CF6',
        },
      ],
      chart: {
        type: 'area',
        height: 280,
        toolbar: {
          show: false,
        },
        fontFamily: 'Inter, sans-serif',
        zoom: {
          enabled: false,
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        curve: 'smooth',
        width: 2,
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.4,
          opacityTo: 0.1,
          stops: [0, 90, 100],
        },
      },
      xaxis: {
        categories: categories,
        labels: {
          style: {
            colors: '#64748b',
            fontSize: '12px',
            fontWeight: 500,
          },
        },
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
      },
      yaxis: {
        labels: {
          style: {
            colors: '#64748b',
            fontSize: '12px',
            fontWeight: 500,
          },
          formatter: function (value) {
            return '$' + value.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
          },
        },
      },
      legend: {
        show: true,
        position: 'top',
        horizontalAlign: 'right',
        fontSize: '13px',
        fontWeight: 500,
        labels: {
          colors: '#64748b',
        },
        markers: {
          width: 10,
          height: 10,
          radius: 3,
        },
        itemMargin: {
          horizontal: 12,
        },
      },
      grid: {
        borderColor: '#e2e8f0',
        strokeDashArray: 4,
        xaxis: {
          lines: {
            show: false,
          },
        },
        yaxis: {
          lines: {
            show: true,
          },
        },
        padding: {
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
        },
      },
      tooltip: {
        theme: 'light',
        x: {
          show: true,
        },
        y: {
          formatter: function (value) {
            return '$' + value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
          },
        },
      },
    };

    chartContainer.innerHTML = '';
    this.charts.monthly = new ApexCharts(chartContainer, options);
    this.charts.monthly.render();
  },

  async renderCategoriesChart() {
    const chartContainer = document.getElementById('categories-chart');
    
    if (typeof ApexCharts === 'undefined') {
      console.error('ApexCharts no está disponible');
      return;
    }

    if (this.charts.categories) {
      this.charts.categories.destroy();
    }

    // Agrupar transacciones por categoría (solo EXPENSE)
    const expenseTransactions = this.transactions.filter(t => t.type === 'EXPENSE');
    const categoryTotals = {};
    
    expenseTransactions.forEach(t => {
      const catName = t.category?.name || 'Sin categoría';
      categoryTotals[catName] = (categoryTotals[catName] || 0) + Number(t.amount);
    });

    const labels = Object.keys(categoryTotals);
    const series = Object.values(categoryTotals);

    if (labels.length === 0) {
      chartContainer.innerHTML = '<p style="text-align: center; padding: 40px; color: var(--text-secondary);">No hay datos de egresos por categoría</p>';
      return;
    }

    const options = {
      series: series,
      chart: {
        type: 'donut',
        height: 280,
        fontFamily: 'Inter, sans-serif',
      },
      labels: labels,
      colors: ['#EF4444', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#10B981'],
      plotOptions: {
        pie: {
          donut: {
            size: '65%',
            labels: {
              show: true,
              name: {
                show: true,
                fontSize: '14px',
                fontWeight: 600,
                color: '#1e293b',
              },
              value: {
                show: true,
                fontSize: '24px',
                fontWeight: 700,
                color: '#0f172a',
                formatter: function (val) {
                  return '$' + Number(val).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                },
              },
              total: {
                show: true,
                label: 'Total Egresos',
                fontSize: '13px',
                fontWeight: 500,
                color: '#64748b',
                formatter: function (w) {
                  const total = w.globals.seriesTotals.reduce((a, b) => a + b, 0);
                  return '$' + total.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                },
              },
            },
          },
        },
      },
      dataLabels: {
        enabled: false,
      },
      legend: {
        show: true,
        position: 'bottom',
        fontSize: '13px',
        fontWeight: 500,
        labels: {
          colors: '#64748b',
        },
        markers: {
          width: 10,
          height: 10,
          radius: 3,
        },
        itemMargin: {
          horizontal: 8,
          vertical: 6,
        },
      },
      tooltip: {
        theme: 'light',
        y: {
          formatter: function (value) {
            return '$' + value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
          },
        },
      },
    };

    chartContainer.innerHTML = '';
    this.charts.categories = new ApexCharts(chartContainer, options);
    this.charts.categories.render();
  },

  renderTransactions() {
    const tbody = document.getElementById('transactions-tbody');
    const countElement = document.getElementById('transactions-count');
    
    // Actualizar contador
    if (countElement) {
      countElement.textContent = `${this.transactions.length} ${this.transactions.length === 1 ? 'transacción' : 'transacciones'}`;
    }
    
    if (this.transactions.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 60px 20px;">
            <div style="display: flex; flex-direction: column; align-items: center; gap: 16px; opacity: 0.6;">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color: var(--text-tertiary);">
                <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"/>
                <path d="M14 2V8H20"/>
                <path d="M16 13H8"/>
                <path d="M16 17H8"/>
                <path d="M10 9H9H8"/>
              </svg>
              <div>
                <p style="font-size: 16px; font-weight: 600; color: var(--text-secondary); margin-bottom: 8px;">
                  No hay transacciones registradas
                </p>
                <p style="font-size: 14px; color: var(--text-tertiary);">
                  Las transacciones se crean automáticamente al cumplir ventas o recibir compras
                </p>
              </div>
            </div>
          </td>
        </tr>
      `;
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
            <span style="display: inline-flex; align-items: center; gap: 8px;">
              <div style="width: 8px; height: 8px; border-radius: 50%; background-color: ${t.category.color || '#64748b'};"></div>
              ${t.category.name}
            </span>
          </td>
          <td style="color: var(--text-secondary);">${t.description || '-'}</td>
          <td style="font-weight: 600; color: ${amountColor}; font-size: 14px;">
            ${t.type === 'INCOME' ? '+' : '-'}$${this.formatMoney(t.amount)}
          </td>
          <td style="font-size: 13px; color: var(--text-tertiary);">${t.reference || '-'}</td>
          <td>
            <div class="action-buttons">
              <button class="btn-icon btn-icon-danger" onclick="financesView.deleteTransaction('${t.id}')" title="Eliminar">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
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

    // Botón exportar
    document.getElementById('export-btn')?.addEventListener('click', () => {
      this.exportData();
    });

    // Botón refrescar
    document.getElementById('refresh-btn')?.addEventListener('click', async () => {
      const btn = document.getElementById('refresh-btn');
      btn.disabled = true;
      btn.style.opacity = '0.5';
      await this.loadData();
      btn.disabled = false;
      btn.style.opacity = '1';
      showToast('Datos actualizados', 'success');
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
                      ${c.name}
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

  exportData() {
    if (this.transactions.length === 0) {
      showToast('No hay transacciones para exportar', 'warning');
      return;
    }

    // Crear CSV
    const headers = ['Fecha', 'Tipo', 'Categoría', 'Descripción', 'Monto', 'Referencia'];
    const rows = this.transactions.map(t => [
      new Date(t.transactionDate).toLocaleDateString('es-ES'),
      t.type === 'INCOME' ? 'Ingreso' : 'Egreso',
      t.category.name,
      t.description || '',
      t.amount,
      t.reference || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Descargar archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `finanzas_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Reporte exportado exitosamente', 'success');
  },
};

// Exportar
window.financesView = financesView;
