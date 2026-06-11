import { api } from '../../../api/apiClient.js';
import { ENDPOINTS } from '../../../api/endpoints.js';

export const authApi = {
  login: (credentials) => api.post(ENDPOINTS.AUTH.LOGIN, credentials),
  register: (userData) => api.post(ENDPOINTS.AUTH.REGISTER, userData),
  verifyRegistration: (data) => api.post(ENDPOINTS.AUTH.VERIFY_REGISTRATION, data),
  forgotPassword: (email) => api.post(ENDPOINTS.AUTH.FORGOT_PASSWORD, { email }),
  verifyCode: (data) => api.post(ENDPOINTS.AUTH.VERIFY_CODE, data),
  setPin: (pinData) => api.post(ENDPOINTS.AUTH.SET_PIN, pinData),
  verifyPin: (pinData) => api.post(ENDPOINTS.AUTH.VERIFY_PIN, pinData),
  forgotPin: (email) => api.post(ENDPOINTS.AUTH.FORGOT_PIN, { email }),
  verifyInvitation: (token) => api.get(`${ENDPOINTS.AUTH.VERIFY_INVITATION}?token=${token}`),
  sendInvitationCode: (token) => api.post(`${ENDPOINTS.AUTH.SEND_INVITATION_CODE}?token=${token}`),
  acceptInvitation: (onboardData) => api.post(ENDPOINTS.AUTH.ACCEPT_INVITATION, onboardData),
  resetPassword: (resetData) => api.post(ENDPOINTS.AUTH.RESET_PASSWORD, resetData),
};
