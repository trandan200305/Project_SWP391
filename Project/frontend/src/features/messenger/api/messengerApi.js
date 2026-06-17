import { api } from '../../../api/apiClient.js';

export const messengerApi = {
  getTickets: () => api.get('/chat/tickets'),
  getOrCreateTicket: (userId, role) => api.get(`/chat/tickets/get-or-create?userId=${userId}&role=${role}`),
  getMessages: (ticketId) => api.get(`/chat/messages/${ticketId}`),
  uploadFile: (formData) => {
    return fetch('http://localhost:8080/api/upload', {
      method: 'POST',
      body: formData,
    }).then(res => res.json());
  },
  getUsers: () => api.get('/admin/users'),
};
