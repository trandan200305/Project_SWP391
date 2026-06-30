import { api } from './apiClient';

export const contractApi = {
  // Lấy danh sách hợp đồng của nhà tuyển dụng
  getEmployerContracts: (employerId) => {
    return api.get(`/contracts/employer?employerId=${employerId}`);
  },

  // Lấy danh sách hợp đồng của freelancer
  getFreelancerContracts: (freelancerId) => {
    return api.get(`/contracts/freelancer?freelancerId=${freelancerId}`);
  },

  // Lấy chi tiết hợp đồng bao gồm các mốc tiến độ và sản phẩm nộp
  getContractDetails: (contractId, userId) => {
    return api.get(`/contracts/${contractId}?userId=${userId}`);
  },

  // Lấy chi tiết hợp đồng theo Project ID
  getContractByProjectId: (projectId, userId) => {
    return api.get(`/contracts/project/${projectId}?userId=${userId}`);
  },

  // Nhà tuyển dụng đánh dấu hoàn thành hợp đồng
  completeContract: (contractId, employerId) => {
    return api.post(`/contracts/${contractId}/complete?employerId=${employerId}`);
  },

  // Freelancer nộp kết quả công việc/sản phẩm cho một mốc
  submitDeliverable: (milestoneId, freelancerId, submitData) => {
    return api.post(`/deliverables/milestones/${milestoneId}?freelancerId=${freelancerId}`, submitData);
  },

  // Nhà tuyển dụng đánh giá và phê duyệt sản phẩm đã nộp
  reviewDeliverable: (deliverableId, employerId, approve, feedback = '') => {
    const encodedFeedback = encodeURIComponent(feedback);
    return api.post(`/deliverables/${deliverableId}/review?employerId=${employerId}&approve=${approve}&feedback=${encodedFeedback}`);
  }
};
