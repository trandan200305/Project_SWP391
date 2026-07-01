import { api } from '../../../api/apiClient.js';

export const adminApi = {
  getStats: (period) => api.get(`/admin/stats?period=${period}`),
  getFeeConfig: () => api.get('/admin/fee-config'),
  updateFeeConfig: (newFee) => api.post(`/admin/fee-config?fee=${newFee}`),
  getAuditLogs: () => api.get('/admin/audit-logs'),
  inviteStaffOrManager: (email, role, departmentId, managerId, fullName, phone, citizenId, displayName) => api.post('/admin/invite', { email, role, departmentId, managerId, fullName, phone, citizenId, displayName }),
  getDepartments: () => api.get('/admin/departments'),
  getDepartmentSessions: (deptId) => api.get(`/admin/departments/${deptId}/sessions`),
  getDepartmentLogs: (deptId) => api.get(`/admin/departments/${deptId}/logs`),
  transferDepartmentMember: (payload) => api.post('/admin/departments/transfer', payload),
  getStaffProfile: (id) => api.get(`/staff/${id}`),
  getManagerProfile: (id) => api.get(`/managers/${id}`),
  getDepartmentTransfers: (deptId) => api.get(`/admin/departments/${deptId}/transfers`),
  getDepartmentMemberCounts: (deptId) => api.get(`/admin/departments/${deptId}/member-counts`),
  getUsers: (params) => {
    if (params) {
      const searchParams = new URLSearchParams();
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          searchParams.append(key, params[key]);
        }
      });
      return api.get(`/admin/users?${searchParams.toString()}`);
    }
    return api.get('/admin/users');
  },
  getUserCredentials: (role, userId) => api.get(`/admin/users/${role}/${userId}/credentials`),
  regenerateUserPassword: (role, userId) => api.post(`/admin/users/${role}/${userId}/regenerate-password`),
  getUserGrowth: () => api.get('/admin/charts/user-growth'),
  getRevenueGrowth: () => api.get('/admin/charts/revenue'),
  getManagers: () => api.get('/admin/managers'),
  getStaff: () => api.get('/admin/staff'),
  getPendingProjects: () => api.get('/admin/moderation/projects/pending'),
  getWithdrawals: () => api.get('/admin/finance/withdrawals'),
  getJobCategories: () => api.get('/admin/job-categories'),
  getKycRequests: () => api.get('/admin/kyc/requests'),
  requireMoreInfoKyc: (id, role, reason, adminId) => {
    const headers = {};
    if (adminId) headers['X-Admin-Id'] = adminId.toString();
    return fetch(`http://localhost:8080/api/admin/kyc/requests/${id}/require-more-info?role=${role}`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reason })
    }).then(res => res.json());
  },
  getDisputes: () => api.get('/admin/disputes'),
  resolveDispute: (id, status, note, adminId) => {
    const headers = {};
    if (adminId) headers['X-Admin-Id'] = adminId.toString();
    return fetch(`http://localhost:8080/api/admin/disputes/${id}/resolve?status=${status}&note=${note || ''}`, {
      method: 'PUT',
      headers
    }).then(res => res.json());
  },
  getReports: () => api.get('/admin/moderation/reports'),
  resolveReport: (id, status, adminId) => {
    const headers = {};
    if (adminId) headers['X-Admin-Id'] = adminId.toString();
    return fetch(`http://localhost:8080/api/admin/moderation/reports/${id}/resolve?status=${status}`, {
      method: 'PUT',
      headers
    }).then(res => res.json());
  },
  getWarningTemplates: () => api.get('/admin/warning-templates'),
  getArticles: () => api.get('/admin/moderation/articles'),
  getTickets: () => api.get('/admin/support/tickets'),
  getBugReports: () => api.get('/admin/support/bug-reports'),
  updateBugReportStatus: (id, status, adminId) => api.put(`/admin/support/bug-reports/${id}/status?status=${status}`, null, { headers: { 'X-Admin-Id': adminId } }),
  getSeoConfigs: () => api.get('/admin/seo-configs'),
  getProfileRequests: () => api.get('/admin/kyc/profile-requests'),
  moderateProfileRequest: (requestId, approve, reasonParam, adminId) => {
    const headers = {};
    if (adminId) headers['X-Admin-Id'] = adminId.toString();
    return fetch(`http://localhost:8080/api/admin/kyc/profile-requests/${requestId}/moderate?approve=${approve}&reason=${reasonParam}`, {
      method: 'PUT',
      headers
    }).then(res => res.json());
  },
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
    return fetch(`http://localhost:8080/api/admin/moderation/projects/${projectId}/moderate?approve=${approve}&reason=${reasonParam}`, {
      method: 'PUT',
      headers
    }).then(res => res.json());
  },
  processWithdrawal: (withdrawalId, status, adminId, reason) => {
    const headers = {};
    if (adminId) headers['X-Admin-Id'] = adminId.toString();
    let url = `http://localhost:8080/api/admin/finance/withdrawals/${withdrawalId}/process?status=${status}`;
    if (reason) url += `&reason=${encodeURIComponent(reason)}`;
    return fetch(url, {
      method: 'PUT',
      headers
    }).then(res => res.json());
  },
  getVerificationTasks: () => api.get('/admin/verification-tasks'),
  createVerificationTask: (payload) => api.post('/admin/verification-tasks', payload),
  moderateKycRequest: (requestId, approve, role, adminId) => {
    const headers = {};
    if (adminId) headers['X-Admin-Id'] = adminId.toString();
    return fetch(`http://localhost:8080/api/admin/kyc/requests/${requestId}/moderate?approve=${approve}&role=${role}`, {
      method: 'PUT',
      headers
    }).then(res => res.json());
  },
  claimVerificationTask: (taskId) => api.post(`/admin/verification-tasks/${taskId}/claim`),
  submitTaskSignoff: (taskId, data) => api.post(`/admin/verification-tasks/${taskId}/signoff`, data),
  escalateVerificationTask: (taskId, reason) => api.post(`/admin/verification-tasks/${taskId}/escalate`, { reason }),
  getVnpayConfig: () => api.get('/admin/vnpay-config'),
  saveVnpayConfig: (config) => api.post('/admin/vnpay-config', config),
  getVnpayTransactions: () => api.get('/admin/finance/vnpay-transactions'),
  reconcileVnpayTransaction: (id) => api.post(`/admin/finance/vnpay-transactions/${id}/reconcile`),
  getPendingGigs: () => api.get('/admin/moderation/gigs/pending'),
  moderateGig: (gigId, approve, reasonParam, adminId) => {
    const headers = {};
    if (adminId) headers['X-Admin-Id'] = adminId.toString();
    return fetch(`http://localhost:8080/api/admin/moderation/gigs/${gigId}/moderate?approve=${approve}&reason=${reasonParam}`, {
      method: 'PUT',
      headers
    }).then(res => res.json());
  },
  queryVnpayTransaction: (id) => api.post(`/admin/finance/vnpay-transactions/${id}/query`),
  refundVnpayTransaction: (id, payload) => api.post(`/admin/finance/vnpay-transactions/${id}/refund`, payload),
  getTransferRequests: () => api.get('/admin/transfers/requests'),
  submitTransferRequest: (payload) => api.post('/admin/transfers/requests', payload),
  approveTransferRequest: (id, status, reason) => api.put(`/admin/transfers/requests/${id}/approve?status=${status}&reason=${reason}`),
  lookupBankAccount: (bankCode, accountNumber) => api.post('/admin/payment/lookup-account', { bankCode, accountNumber }),
  createTestVnpayUrl: (projectId) => api.post(`/payment/create-url?projectId=${projectId}`),
  createPayosUrl: (projectId) => api.post(`/payment/payos/create-url?projectId=${projectId}`),
  queryPayosTransaction: (txnRef) => api.post(`/payment/payos/query?txnRef=${txnRef}`),
  
  // Notification API
  getNotifications: (role, userId) => api.get(`/notifications/${role}/${userId}`),
  markNotificationAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllNotificationsAsRead: (role, userId) => api.put(`/notifications/read-all/${role}/${userId}`),
  seedTestNotifications: (role, userId) => api.post(`/notifications/test-seed/${role}/${userId}`)
};
