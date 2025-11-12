// Cliente API para comunicación con el backend
class APIClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  // Obtener token del localStorage
  getToken() {
    return localStorage.getItem('authToken');
  }

  // Obtener headers con autenticación
  getHeaders(customHeaders = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...customHeaders
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  // Método genérico para hacer peticiones
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      ...options,
      headers: this.getHeaders(options.headers)
    };

    try {
      const response = await fetch(url, config);
      
      // Si es 401, el token expiró o es inválido
      if (response.status === 401) {
        const json = await response.json();
        
        // Solo recargar si estamos intentando acceder a una ruta protegida
        // y tenemos un token (significa que expiró)
        if (this.getToken()) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('currentUser');
          window.location.reload();
        }
        
        const errorMessage = json.error?.message || json.message || 'No autorizado';
        throw new Error(errorMessage);
      }

      const json = await response.json();

      if (!response.ok) {
        console.error('❌ Error del servidor:', {
          status: response.status,
          statusText: response.statusText,
          body: json
        });
        
        // Extraer mensaje de error de diferentes estructuras posibles
        let errorMessage = 'Error en la petición';
        
        if (json.error?.message) {
          errorMessage = json.error.message;
        } else if (json.message) {
          // Si message es un array (ValidationPipe), unir los mensajes
          if (Array.isArray(json.message)) {
            errorMessage = json.message.join(', ');
          } else {
            errorMessage = json.message;
          }
        }
        
        throw new Error(errorMessage);
      }

      // El backend devuelve { data: ..., meta: ... }
      // Si hay data, retornar solo el contenido de data
      // Si no hay data pero hay otras propiedades, retornar el json completo
      if (json.data !== undefined) {
        // Si también hay meta (paginación), retornar ambos
        if (json.meta) {
          return { data: json.data, meta: json.meta };
        }
        // Si solo hay data, retornar solo el contenido
        return json.data;
      }

      // Si no tiene la estructura esperada, retornar tal cual
      return json;
    } catch (error) {
      console.error('💥 API Error:', error);
      throw error;
    }
  }

  // Métodos HTTP
  async get(endpoint, params = {}) {
    // Limpiar parámetros undefined, null y strings vacíos
    const cleanParams = {};
    Object.keys(params).forEach(key => {
      const value = params[key];
      if (value !== undefined && value !== null && value !== '') {
        cleanParams[key] = value;
      }
    });
    
    const queryString = new URLSearchParams(cleanParams).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(url, { method: 'GET' });
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async patch(endpoint, data) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // ============ AUTH ENDPOINTS ============
  async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }

  // ============ PRODUCTS ENDPOINTS ============
  async getProducts(params = {}) {
    return this.get('/products', params);
  }

  async getProduct(id) {
    return this.get(`/products/${id}`);
  }

  async createProduct(data) {
    return this.post('/products', data);
  }

  async updateProduct(id, data) {
    return this.patch(`/products/${id}`, data);
  }

  async deleteProduct(id) {
    return this.delete(`/products/${id}`);
  }

  // ============ INVENTORY ENDPOINTS ============
  async getInventoryLevels(params = {}) {
    return this.get('/inventory/levels', params);
  }

  async adjustInventory(data) {
    return this.post('/inventory/adjust', data);
  }

  // ============ CATEGORIES ENDPOINTS ============
  async getCategories(params = {}) {
    return this.get('/categories', params);
  }

  async createCategory(data) {
    return this.post('/categories', data);
  }

  async getCategory(id) {
    return this.get(`/categories/${id}`);
  }

  async updateCategory(id, data) {
    return this.patch(`/categories/${id}`, data);
  }

  async deleteCategory(id) {
    return this.delete(`/categories/${id}`);
  }

  // ============ WAREHOUSES ENDPOINTS ============
  async getWarehouses(params = {}) {
    return this.get('/warehouses', params);
  }

  async getWarehouse(id) {
    return this.get(`/warehouses/${id}`);
  }

  async createWarehouse(data) {
    return this.post('/warehouses', data);
  }

  async updateWarehouse(id, data) {
    return this.patch(`/warehouses/${id}`, data);
  }

  async deleteWarehouse(id) {
    return this.delete(`/warehouses/${id}`);
  }

  // ============ STOCK MOVEMENTS ENDPOINTS ============
  async getStockMovements(params = {}) {
    return this.get('/stock-movements', params);
  }

  async stockIn(data) {
    return this.post('/stock-movements/in', data);
  }

  async stockOut(data) {
    return this.post('/stock-movements/out', data);
  }

  // ============ PURCHASE ORDERS ENDPOINTS ============
  async getPurchaseOrders(params = {}) {
    return this.get('/purchase-orders', params);
  }

  async getPurchaseOrder(id) {
    return this.get(`/purchase-orders/${id}`);
  }

  async createPurchaseOrder(data) {
    return this.post('/purchase-orders', data);
  }

  async updatePurchaseOrder(id, data) {
    return this.patch(`/purchase-orders/${id}`, data);
  }

  async orderPurchaseOrder(id) {
    return this.post(`/purchase-orders/${id}/order`);
  }

  async receivePurchaseOrder(id, data) {
    return this.post(`/purchase-orders/${id}/receive`, data);
  }

  async cancelPurchaseOrder(id) {
    return this.post(`/purchase-orders/${id}/cancel`);
  }

  // ============ SALES ORDERS ENDPOINTS ============
  async getSalesOrders(params = {}) {
    return this.get('/sales-orders', params);
  }

  async getSalesOrder(id) {
    return this.get(`/sales-orders/${id}`);
  }

  async createSalesOrder(data) {
    return this.post('/sales-orders', data);
  }

  async updateSalesOrder(id, data) {
    return this.patch(`/sales-orders/${id}`, data);
  }

  async confirmSalesOrder(id) {
    return this.post(`/sales-orders/${id}/confirm`);
  }

  async fulfillSalesOrder(id, data) {
    return this.post(`/sales-orders/${id}/fulfill`, data);
  }

  async cancelSalesOrder(id) {
    return this.post(`/sales-orders/${id}/cancel`);
  }

  // ============ SUPPLIERS ENDPOINTS ============
  async getSuppliers(params = {}) {
    return this.get('/suppliers', params);
  }

  async getSupplier(id) {
    return this.get(`/suppliers/${id}`);
  }

  async createSupplier(data) {
    return this.post('/suppliers', data);
  }

  async updateSupplier(id, data) {
    return this.patch(`/suppliers/${id}`, data);
  }

  async deleteSupplier(id) {
    return this.delete(`/suppliers/${id}`);
  }

  // ============ CUSTOMERS ENDPOINTS ============
  async getCustomers(params = {}) {
    return this.get('/customers', params);
  }

  async getCustomer(id) {
    return this.get(`/customers/${id}`);
  }

  async createCustomer(data) {
    return this.post('/customers', data);
  }

  async updateCustomer(id, data) {
    return this.patch(`/customers/${id}`, data);
  }

  async deleteCustomer(id) {
    return this.delete(`/customers/${id}`);
  }

  // ============ USERS ENDPOINTS ============
  async getUsers(params = {}) {
    return this.get('/users', params);
  }

  async getUser(id) {
    return this.get(`/users/${id}`);
  }

  async createUser(data) {
    return this.post('/users', data);
  }

  async updateUser(id, data) {
    return this.patch(`/users/${id}`, data);
  }

  async deleteUser(id) {
    return this.delete(`/users/${id}`);
  }
}

// Crear instancia global del API client
window.api = new APIClient(CONFIG.API_BASE_URL);
