import { api } from '../../../api/apiClient';

// Helper to determine the correct base path based on role
const getRolePath = (role) => {
    switch (role?.toLowerCase()) {
        case 'freelancer': return '/freelancers';
        case 'employer': return '/employers';
        case 'admin': return '/admin';
        case 'manager': return '/managers';
        case 'staff': return '/staff';
        default: return '/freelancers';
    }
};

export const userApi = {
    getUserProfile: async (role, id) => {
        return await api.get(`${getRolePath(role)}/${id}`);
    },
    
    updateUserProfile: async (role, id, data) => {
        return await api.put(`${getRolePath(role)}/${id}/profile`, data);
    },
    
    deleteUserAccount: async (role, id, confirmationText) => {
        return await api.delete(`${getRolePath(role)}/${id}?confirmationText=${confirmationText}`);
    }
};
