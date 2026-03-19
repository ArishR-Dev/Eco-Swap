import { apiCall } from './api';

export interface ProfileUpdateData {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  // Collector fields
  vehicle_type?: string;
  license_number?: string;
  // Recycler fields
  facility_name?: string;
  certification?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  role: string;
  created_at: string | null;
}

const authService = {
  async getProfile(): Promise<UserProfile> {
    return apiCall<UserProfile>('/auth/me', { method: 'GET' });
  },

  async updateProfile(data: ProfileUpdateData): Promise<UserProfile> {
    return apiCall<UserProfile>('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean }> {
    return apiCall<{ success: boolean }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  async forgotPassword(email: string): Promise<{ message: string; reset_link?: string }> {
    return apiCall<{ message: string; reset_link?: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean }> {
    return apiCall<{ success: boolean }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  },

  async uploadAvatar(file: File): Promise<{ avatar: string }> {
    const formData = new FormData();
    formData.append('file', file);

    return apiCall<{ avatar: string }>('/auth/profile/avatar', {
      method: 'POST',
      body: formData,
    });
  },
};

export default authService;
