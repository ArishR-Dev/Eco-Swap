import { apiCall } from './api';

/**
 * Admin Service - Comprehensive admin operations
 *
 * NOTE: apiCall() automatically prepends /api to all endpoints.
 * So calling apiCall('/admin/users') actually requests /api/admin/users
 *
 * Exported as default. Consumers should use:
 * `import adminService from '@/services/adminService';`
 */

const adminService = {
  /* ================= DASHBOARD ================= */

  /**
   * GET /api/admin/dashboard
   * Returns aggregated system statistics
   */
  async getDashboardStats(): Promise<{
    users: number;
    collectors: number;
    recyclers: number;
    pending_pickups: number;
    unassigned_pickups: number;
    active_pickups: number;
    completed_pickups: number;
    certificates: number;
  }> {
    const res = await apiCall<any>('/admin/dashboard', { method: 'GET' });
    const data = res?.data ?? res;
    
    return {
      users: data?.users ?? 0,
      collectors: data?.collectors ?? 0,
      recyclers: data?.recyclers ?? 0,
      pending_pickups: data?.pending_pickups ?? 0,
      unassigned_pickups: data?.unassigned_pickups ?? 0,
      active_pickups: data?.active_pickups ?? 0,
      completed_pickups: data?.completed_pickups ?? 0,
      certificates: data?.certificates ?? 0,
    };
  },

  /* ================= USERS ================= */

  /**
   * GET /api/admin/users
   * Fetch all users
   */
  async getUsers(): Promise<any[]> {
    const res = await apiCall<any>('/admin/users', { method: 'GET' });
    const data = res?.data ?? res;
    return Array.isArray(data) ? data : [];
  },

  /**
   * PATCH /api/admin/users/:id/suspend
   * Suspend a user (set is_active = false)
   */
  async suspendUser(userId: string): Promise<boolean> {
    const res = await apiCall<any>(`/admin/users/${userId}/suspend`, {
      method: 'PATCH',
    });
    return !!(res && (res.success || res.message || res.id));
  },

  /**
   * PATCH /api/admin/users/:id/activate
   * Activate a user (set is_active = true)
   */
  async activateUser(userId: string): Promise<boolean> {
    const res = await apiCall<any>(`/admin/users/${userId}/activate`, {
      method: 'PATCH',
    });
    return !!(res && (res.success || res.message || res.id));
  },

  /**
   * DELETE /api/admin/users/:id
   * Delete a user and their related data
   */
  async deleteUser(userId: string): Promise<boolean> {
    const res = await apiCall<any>(`/admin/users/${userId}`, {
      method: 'DELETE',
    });
    return !!(res && (res.success || res.message || res.id));
  },

  /**
   * GET /api/admin/pending
   * Fetch pending users (collectors and recyclers awaiting approval)
   */
  async getPendingUsers(): Promise<any[]> {
    const res = await apiCall<any>('/admin/pending', { method: 'GET' });
    const data = res?.data ?? res;
    
    // Flatten both collectors and recyclers arrays
    const collectors = Array.isArray(data?.collectors) ? data.collectors : [];
    const recyclers = Array.isArray(data?.recyclers) ? data.recyclers : [];
    return [...collectors, ...recyclers];
  },

  /* ================= REPORTS ================= */

  /**
   * GET /api/admin/reports
   * Retrieve various report datasets
   */
  async getReports(): Promise<any> {
    const res = await apiCall<any>('/admin/reports', { method: 'GET' });
    const data = res?.data ?? res;
    return data || {};
  },

  /* ================= APPROVALS ================= */

  /**
   * GET /api/admin/pending
   * Fetch pending collector and recycler approvals
   */
  async getPendingApprovals(): Promise<{
    collectors: any[];
    recyclers: any[];
  }> {
    const res = await apiCall<any>('/admin/pending', { method: 'GET' });
    const data = res?.data ?? res;
    
    return {
      collectors: Array.isArray(data?.collectors) ? data.collectors : [],
      recyclers: Array.isArray(data?.recyclers) ? data.recyclers : [],
    };
  },

  /**
   * PATCH /api/admin/approve/collector/:id
   * Approve a pending collector application
   */
  async approveCollector(userId: string): Promise<boolean> {
    const res = await apiCall<any>(
      `/admin/approve/collector/${userId}`,
      { method: 'PATCH' }
    );
    return res?.success ?? res?.message ? true : false;
  },

  /**
   * PATCH /api/admin/approve/recycler/:id
   * Approve a pending recycler application
   */
  async approveRecycler(userId: string): Promise<boolean> {
    const res = await apiCall<any>(
      `/admin/approve/recycler/${userId}`,
      { method: 'PATCH' }
    );
    return res?.success ?? res?.message ? true : false;
  },

  /**
   * PATCH /api/admin/reject/collector/:id
   * Reject a pending collector application
   */
  async rejectCollector(userId: string): Promise<boolean> {
    const res = await apiCall<any>(
      `/admin/reject/collector/${userId}`,
      { method: 'PATCH' }
    );
    return res?.success ?? res?.message ? true : false;
  },

  /**
   * PATCH /api/admin/reject/recycler/:id
   * Reject a pending recycler application
   */
  async rejectRecycler(userId: string): Promise<boolean> {
    const res = await apiCall<any>(
      `/admin/reject/recycler/${userId}`,
      { method: 'PATCH' }
    );
    return res?.success ?? res?.message ? true : false;
  },

  /* ================= NOTIFICATIONS ================= */

  /**
   * GET /api/admin/notifications
   * Fetch admin notifications
   */
  async getNotifications(): Promise<any[]> {
    const res = await apiCall<any>('/admin/notifications', { method: 'GET' });
    const data = res?.data ?? res;
    return Array.isArray(data) ? data : [];
  },

  /**
   * PATCH /api/admin/notifications/:id/read
   * Mark notification as read
   */
  async markNotificationRead(id: string): Promise<boolean> {
    const res = await apiCall<any>(
      `/admin/notifications/${id}/read`,
      { method: 'PATCH' }
    );
    return res?.success ?? res?.message ? true : false;
  },

  /**
   * DELETE /api/admin/notifications/:id
   * Delete a notification
   */
  async deleteNotification(id: string): Promise<boolean> {
    const res = await apiCall<any>(
      `/admin/notifications/${id}`,
      { method: 'DELETE' }
    );
    return res?.success ?? res?.message ? true : false;
  },

  /* ================= PROFILE ================= */

  /**
   * GET /api/auth/me
   * Fetch current admin profile
   */
  async getAdminProfile(): Promise<any> {
    const res = await apiCall<any>('/auth/me', { method: 'GET' });
    const data = res?.data ?? res?.user ?? res;
    return data || null;
  },

  /**
   * PATCH /api/auth/profile
   * Update admin profile
   */
  async updateAdminProfile(updates: any): Promise<any> {
    const res = await apiCall<any>(
      '/auth/profile',
      { method: 'PATCH', body: JSON.stringify(updates) }
    );
    const data = res?.data ?? res?.user ?? res;
    return data || null;
  },

  /**
   * POST /api/auth/change-password
   * Change admin password
   */
  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<boolean> {
    const res = await apiCall<any>(
      '/auth/change-password',
      {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      }
    );
    return res?.success ?? res?.message ? true : false;
  },

  /* ================= PICKUPS (ADMIN LIST) ================= */

  /**
   * GET /api/admin/pickups
   * Fetch all pickups for admin management (assign, filter, etc.). Requires ADMIN.
   */
  async getPickups(): Promise<any[]> {
    const res = await apiCall<any>('/admin/pickups', { method: 'GET' });
    const list = Array.isArray(res) ? res : [];
    return list.map((p: any) => ({
      ...p,
      userName: p.userName ?? p.user_name ?? 'Unknown',
      userPhone: p.userPhone ?? p.user_phone ?? '',
      items: Array.isArray(p.items) ? p.items : [],
      totalWeight: Number(p.totalWeight ?? p.total_weight ?? 0),
      scheduledDate: p.scheduledDate ?? p.scheduled_date ?? '',
      scheduledTimeSlot: p.scheduledTimeSlot ?? p.scheduled_time_slot ?? p.time_slot ?? '',
      collectorId: p.collectorId ?? p.collector_id ?? null,
      collectorName: p.collectorName ?? p.collector_name ?? null,
      createdAt: p.createdAt ?? p.created_at ?? '',
      updatedAt: p.updatedAt ?? p.updated_at ?? p.createdAt ?? p.created_at ?? '',
    }));
  },

  /* ================= COLLECTORS ================= */

  /**
   * GET /api/collector/available
   * Fetch all available collectors
   */
  async getAvailableCollectors(): Promise<any[]> {
    const res = await apiCall<any>('/collector/available', { method: 'GET' });
    const data = res?.data ?? res?.collectors ?? res;
    return Array.isArray(data) ? data : [];
  },
};

export default adminService;
