import { api } from '../../../api/apiClient.js';

export const adminApi = {
  getStats: (period) => api.get(`/admin/stats?period=${period}`),
  getFeeConfig: () => api.get('/admin/fee-config'),
  updateFeeConfig: (newFee) => api.post(`/admin/fee-config?fee=${newFee}`),
  getAuditLogs: () => api.get('/admin/audit-logs'),
  inviteStaffOrManager: (email, role) => api.post('/admin/invite', { email, role }),
  getUsers: () => api.get('/admin/users'),
  getUserGrowth: () => api.get('/admin/charts/user-growth'),
  getRevenueGrowth: () => api.get('/admin/charts/revenue'),
  getManagers: () => api.get('/admin/managers'),
  getStaff: () => api.get('/admin/staff'),
  getPendingProjects: () => api.get('/admin/projects/pending'),
  getWithdrawals: () => api.get('/admin/withdrawals'),
  getJobCategories: () => api.get('/admin/job-categories'),
  getKycRequests: () => api.get('/admin/kyc-requests'),
  getDisputes: () => api.get('/admin/disputes'),
  getReports: () => api.get('/admin/reports'),
  getArticles: () => api.get('/admin/articles'),
  getTickets: () => api.get('/admin/tickets'),
  getSeoConfigs: () => api.get('/admin/seo-configs'),
  updateUserStatus: (userId, role, status, reasonParam, adminPin, adminId) => {
    const headers = {};
    if (adminId) headers['X-Admin-Id'] = adminId.toString();
    return fetch(`http://localhost:8080/api/admin/users/${userId}/status?role=${role}&status=${status}&reason=${reasonParam}&pin=${adminPin}`, {
      method: 'PUT',
      headers
    }).then(res => res.json());
  },
  moderateProject: (projectId, approve, reasonParam, adminId) => {
    const headers = {};
    if (adminId) headers['X-Admin-Id'] = adminId.toString();
    return fetch(`http://localhost:8080/api/admin/projects/${projectId}/moderate?approve=${approve}&reason=${reasonParam}`, {
      method: 'PUT',
      headers
    }).then(res => res.json());
  },
  processWithdrawal: (withdrawalId, status, adminId) => {
    const headers = {};
    if (adminId) headers['X-Admin-Id'] = adminId.toString();
    return fetch(`http://localhost:8080/api/admin/withdrawals/${withdrawalId}/process?status=${status}`, {
      method: 'PUT',
      headers
    }).then(res => res.json());
  }
};
