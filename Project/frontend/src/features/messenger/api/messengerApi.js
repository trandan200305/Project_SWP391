import { api } from '../../../api/apiClient.js';

export const messengerApi = {
  getTickets: () => api.get('/chat/tickets'),
  claimTicket: (ticketId, staffId) => api.post(`/chat/tickets/${ticketId}/claim?staffId=${staffId}`),
  getOrCreateTicket: (userId, role) => api.get(`/chat/tickets/get-or-create?userId=${userId}&role=${role}`),
  getMessages: (ticketId) => api.get(`/chat/messages/${ticketId}`),
  uploadFile: (formData) => {
    return fetch('http://localhost:8080/api/upload', {
      method: 'POST',
      body: formData,
    }).then(res => res.json());
  },
  getUsers: () => api.get('/admin/users'),
  getDeletedTickets: () => api.get('/chat/tickets/deleted'),
  deleteTicket: (ticketId) => api.post(`/chat/tickets/${ticketId}/delete`),
  restoreTicket: (ticketId) => api.post(`/chat/tickets/${ticketId}/restore`),
  blockUser: (ticketId, days) => api.post(`/chat/tickets/${ticketId}/block?days=${days}`),
  getEmployerProfile: (employerId) => api.get(`/employers/${employerId}/profile`),
  getFreelancerProfile: (freelancerId) => api.get(`/freelancers/${freelancerId}`),
  getOrCreateDirectChat: (freelancerId, employerId) => api.get(`/v1/direct-chats/get-or-create?freelancerId=${freelancerId}&employerId=${employerId}`),
  getUserDirectChats: (userId, role) => api.get(`/v1/direct-chats/user/${userId}?role=${role}`),
  getDirectMessages: (chatId) => api.get(`/v1/direct-chats/${chatId}/messages`),
  deleteDirectChat: (chatId, userId, role) => api.post(`/v1/direct-chats/${chatId}/delete?userId=${userId}&role=${role}`),
  restoreDirectChat: (chatId, userId, role) => api.post(`/v1/direct-chats/${chatId}/restore?userId=${userId}&role=${role}`),
  blockDirectChat: (chatId, userId, role) => api.post(`/v1/direct-chats/${chatId}/block?userId=${userId}&role=${role}`),
  unblockDirectChat: (chatId, userId, role) => api.post(`/v1/direct-chats/${chatId}/unblock?userId=${userId}&role=${role}`),
};
