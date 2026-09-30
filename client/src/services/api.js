import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('pos_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Global response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'A network or server error occurred.';

    if (error.response?.status === 401) {
      // Clear token and user on session expiration
      localStorage.removeItem('pos_token');
      localStorage.removeItem('pos_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login?expired=true';
      }
    }

    return Promise.reject(new Error(message));
  }
);

// Auth endpoints
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  getMe: () => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// Users endpoints (Admin only)
export const userService = {
  getUsers: (params) => api.get('/users', { params }),
  getUserById: (id) => api.get(`/users/${id}`),
  createUser: (data) => api.post('/users', data),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  toggleStatus: (id) => api.patch(`/users/${id}/toggle-status`),
  resetPassword: (id, newPassword) => api.put(`/users/${id}/reset-password`, { newPassword }),
  deleteUser: (id) => api.delete(`/users/${id}`),
};

// Categories endpoints
export const categoryService = {
  getCategories: (params) => api.get('/categories', { params }),
  createCategory: (data) => api.post('/categories', data),
  updateCategory: (id, data) => api.put(`/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/categories/${id}`),
};

// Menu endpoints
export const menuService = {
  getMenuItems: (params) => api.get('/menu', { params }),
  getMenuItemById: (id) => api.get(`/menu/${id}`),
  createMenuItem: (data) => api.post('/menu', data),
  updateMenuItem: (id, data) => api.put(`/menu/${id}`, data),
  toggleAvailability: (id) => api.patch(`/menu/${id}/toggle-availability`),
  deleteMenuItem: (id) => api.delete(`/menu/${id}`),
};

// Tables endpoints
export const tableService = {
  getTables: (params) => api.get('/tables', { params }),
  getTableById: (id) => api.get(`/tables/${id}`),
  createTable: (data) => api.post('/tables', data),
  updateTable: (id, data) => api.put(`/tables/${id}`, data),
  updateTableStatus: (id, status) => api.patch(`/tables/${id}/status`, { status }),
  deleteTable: (id) => api.delete(`/tables/${id}`),
};

// Orders endpoints
export const orderService = {
  createOrder: (data) => api.post('/orders', data),
  getOrders: (params) => api.get('/orders', { params }),
  getOrderById: (id) => api.get(`/orders/${id}`),
  updateOrderStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),
};

// Payments endpoints
export const paymentService = {
  processPayment: (data) => api.post('/payments', data),
  getPayments: (params) => api.get('/payments', { params }),
  getReceipt: (orderNumber) => api.get(`/payments/receipt/${orderNumber}`),
};

// Inventory endpoints (Admin only)
export const inventoryService = {
  getInventory: (params) => api.get('/inventory', { params }),
  adjustStock: (data) => api.post('/inventory/adjust', data),
  getHistory: (params) => api.get('/inventory/history', { params }),
  getLowStock: () => api.get('/inventory/low-stock'),
};

// Reports endpoints (Admin only)
export const reportService = {
  getDashboardSummary: () => api.get('/reports/dashboard-summary'),
  getDailyReport: (params) => api.get('/reports/daily', { params }),
  getWeeklyReport: (params) => api.get('/reports/weekly', { params }),
  getMonthlyReport: (params) => api.get('/reports/monthly', { params }),
  getCashierReport: (params) => api.get('/reports/cashier', { params }),
  getProductReport: (params) => api.get('/reports/products', { params }),
  getInventoryReport: () => api.get('/reports/inventory'),
};

// Settings endpoints
export const settingsService = {
  getSettings: () => api.get('/settings'),
  updateSettings: (data) => api.put('/settings', data),
};

// Backup endpoints (Admin only)
export const backupService = {
  createBackup: () => api.post('/backup/create'),
  listBackups: () => api.get('/backup/list'),
  restoreBackup: (filename) => api.post('/backup/restore', { filename }),
  deleteBackup: (filename) => api.delete(`/backup/${filename}`),
  getDownloadUrl: (filename) => `/api/backup/download/${filename}`,
};

export default api;
