import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercept request to attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('smartspend_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

export const authService = {
  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },
  register: async (userData) => {
    const res = await api.post('/auth/register', userData);
    return res.data;
  },
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  }
};

export const analyticsService = {
  getStats: async () => {
    const res = await api.get('/analytics/stats');
    return res.data.data;
  },
  getFraudTrends: async () => {
    const res = await api.get('/analytics/fraud-trends');
    return res.data.data.trends;
  },
  getRiskDistribution: async () => {
    const res = await api.get('/analytics/risk-distribution');
    return res.data.data;
  },
  getTypeBreakdown: async () => {
    const res = await api.get('/analytics/type-breakdown');
    return res.data.data.breakdown;
  },
  getRecentAlerts: async () => {
    const res = await api.get('/analytics/recent-alerts');
    return res.data.data.alerts;
  }
};

export const transactionService = {
  getTransactions: async (params = {}) => {
    const res = await api.get('/transactions', { params });
    return res.data.data;
  },
  getTransactionById: async (id) => {
    const res = await api.get(`/transactions/${id}`);
    return res.data.data.transaction;
  },
  createTransaction: async (data) => {
    const res = await api.post('/transactions', data);
    return res.data.data;
  },
  updateStatus: async (id, status, notes) => {
    const res = await api.patch(`/transactions/${id}/status`, { status, notes });
    return res.data.data.transaction;
  },
  batchIngest: async (transactions) => {
    const res = await api.post('/transactions/batch', { transactions });
    return res.data.data;
  },
  getExportUrl: () => `${API_BASE_URL}/transactions/export/csv`
};

export const modelService = {
  getMetrics: async () => {
    const res = await api.get('/model/metrics');
    return res.data.data;
  },
  getHealth: async () => {
    const res = await api.get('/model/health');
    return res.data.data;
  },
  simulatePredict: async (data) => {
    const res = await api.post('/model/predict', data);
    return res.data.data;
  }
};

export const graphService = {
  getTopology: async (limit = 40) => {
    const res = await api.get('/graph/topology', { params: { limit } });
    return res.data.data;
  },
  getMuleRings: async () => {
    const res = await api.get('/graph/mule-rings');
    return res.data.data;
  },
  freezeRing: async (ringId) => {
    const res = await api.post('/graph/freeze-ring', { ringId });
    return res.data.data;
  }
};

export default api;
