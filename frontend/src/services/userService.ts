import { Collector, Recycler } from '@/types';
import { apiCall, apiCallBlob } from './api';

/**
 * User Service - API-ready data layer
 * Handles user-related operations (stats, notifications, feedback, collector/recycler lookup)
 */
export const userService = {
  /**
   * GET /api/collectors/:id - Get collector by ID (for pickup details)
   */
  async getCollectorById(id: string): Promise<Collector | null> {
    const res = await apiCall<any>(`/collectors/${id}`, { method: 'GET' });
    const collector = (res?.data ?? res) as Collector | null;
    return collector || null;
  },

  /**
   * GET /api/recyclers - Get all recyclers
   */
  async getAllRecyclers(): Promise<Recycler[]> {
    const res = await apiCall<any>('/recyclers', { method: 'GET' });
    return (res?.data ?? res) as Recycler[];
  },

  /**
   * GET /api/recyclers/approved - Get approved recyclers
   */
  async getApprovedRecyclers(): Promise<Recycler[]> {
    const res = await apiCall<any>('/recyclers/approved', { method: 'GET' });
    return (res?.data ?? res) as Recycler[];
  },

  /**
   * GET /api/recyclers/:id - Get recycler by ID
   */
  async getRecyclerById(id: string): Promise<Recycler | null> {
    const res = await apiCall<any>(`/recyclers/${id}`, { method: 'GET' });
    const recycler = (res?.data ?? res) as Recycler | null;
    return recycler || null;
  },

  /**
   * Download certificate PDF for a pickup (user dashboard).
   * GET /api/certificates/download-by-pickup/:pickupId
   */
  async downloadCertificateByPickupId(pickupId: string): Promise<void> {
    const blob = await apiCallBlob(`/certificates/download-by-pickup/${pickupId}`, { method: 'GET' });
    if (!blob.type?.includes('application/pdf')) {
      throw new Error('Server did not return a PDF file');
    }
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `recycling_certificate_${pickupId}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  /**
   * GET /api/user/stats - Get authenticated user's pickup/certificate stats
   */
  async getUserStats(): Promise<{
    total_pickups: number;
    pending: number;
    collected: number;
    processing: number;
    completed: number;
    certificates: number;
  }> {
    const res = await apiCall<any>('/user/stats', { method: 'GET' });
    return (res?.data ?? res) as {
      total_pickups: number;
      pending: number;
      collected: number;
      processing: number;
      completed: number;
      certificates: number;
    };
  },

  /**
   * GET /api/user/notifications - Get authenticated user's notifications
   */
  /**
   * PATCH /api/user/notifications/:id/read - Mark notification as read
   */
  async markNotificationRead(id: string): Promise<boolean> {
    const res = await apiCall<any>(`/user/notifications/${id}/read`, { method: 'PATCH' });
    return res?.success ?? true;
  },

  /**
   * DELETE /api/user/notifications/:id - Delete notification
   */
  async deleteNotification(id: string): Promise<boolean> {
    const res = await apiCall<any>(`/user/notifications/${id}`, { method: 'DELETE' });
    return res?.success ?? true;
  },

  async getUserNotifications(): Promise<
    Array<{
      id: string;
      message: string;
      type: string;
      isRead: boolean;
      createdAt: string | null;
    }>
  > {
    const res = await apiCall<any>('/user/notifications', { method: 'GET' });
    const list =
      (Array.isArray(res) && res) ||
      (Array.isArray(res?.data) && res.data) ||
      [];
    return list as Array<{
      id: string;
      message: string;
      type: string;
      isRead: boolean;
      createdAt: string | null;
    }>;
  },

  /**
   * GET /api/user/feedback - Get feedback submitted by the authenticated user
   */
  async getUserFeedback(): Promise<
    Array<{
      id: string;
      pickupId: string;
      rating: number;
      comment: string;
      createdAt: string | null;
      collectorName?: string | null;
    }>
  > {
    const res = await apiCall<any>('/user/feedback', { method: 'GET' });
    const list =
      (Array.isArray(res) && res) ||
      (Array.isArray(res?.data) && res.data) ||
      [];
    return list as Array<{
      id: string;
      pickupId: string;
      rating: number;
      comment: string;
      createdAt: string | null;
      collectorName?: string | null;
    }>;
  },
};

export default userService;
