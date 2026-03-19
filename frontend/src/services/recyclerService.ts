import {
  PickupRequest,
  RecyclingLog,
  RecyclingCertificate,
  MaterialBreakdown,
  Recycler
} from '@/types';

import { apiCall, apiCallBlob } from './api';

/**
 * Recycler Service
 */
const recyclerService = {

  /* ================= PROFILE ================= */

  async getRecyclerProfile(): Promise<Recycler | null> {
    const res = await apiCall<any>('/recycler/profile', { method: 'GET' });
    return (res?.data ?? res) || null;
  },

  async getRecyclers(): Promise<Recycler[]> {
    const res = await apiCall<any>('/recycler/list', { method: 'GET' });
    return Array.isArray(res) ? res : (res?.data ?? []);
  },

  /* ================= PICKUPS ================= */

  async getIncomingItems(recyclerId: string): Promise<PickupRequest[]> {
    const res = await apiCall<any>(`/recycler/${recyclerId}/incoming`, { method: 'GET' });
    const raw = (res?.data ?? res) || [];
    const list = Array.isArray(raw) ? raw : [];

    return list.map((p: any) => ({
      id: String(p.id ?? ''),
      userId: String(p.userId ?? p.user_id ?? ''),
      userName: String(p.userName ?? p.user_name ?? ''),
      userPhone: String(p.userPhone ?? p.user_phone ?? ''),
      items: (Array.isArray(p.items) ? p.items : []).map((it: any) => ({
        id: it.id ?? '',
        category: it.category ?? 'OTHER',
        quantity: Number(it.quantity ?? 1),
        estimatedWeight: Number(it.estimated_weight ?? it.estimatedWeight ?? 0),
      })),
      totalWeight: Number(p.totalWeight ?? p.total_weight ?? 0),
      status: (p.status ?? 'REQUESTED') as PickupRequest['status'],
      address: String(p.address ?? ''),
      scheduledDate: String(p.scheduledDate ?? p.scheduled_date ?? ''),
      scheduledTimeSlot: String(p.scheduledTimeSlot ?? p.time_slot ?? ''),
      collectorId: p.collectorId ?? p.collector_id,
      collectorName: p.collectorName ?? p.collector_name,
      recyclerId: p.recyclerId ?? p.recycler_id ?? recyclerId,
      recyclerName: p.recyclerName ?? p.recycler_name ?? '',
      notes: p.notes ?? '',
      priority: (p.priority ?? 'NORMAL') as 'NORMAL' | 'URGENT',
      createdAt: String(p.createdAt ?? p.created_at ?? ''),
      updatedAt: String(p.updatedAt ?? p.updated_at ?? ''),
      completedAt: p.completedAt ?? p.completed_at,
      feedback: p.feedback,
    }));
  },

  async getProcessingItems(recyclerId: string): Promise<PickupRequest[]> {
    const res = await apiCall<any>(`/recycler/${recyclerId}/processing`, { method: 'GET' });
    const raw = (res?.data ?? res) || [];
    const list = Array.isArray(raw) ? raw : [];
    return list.map((p: any) => ({
      id: String(p.id ?? ''),
      userId: String(p.userId ?? p.user_id ?? ''),
      userName: String(p.userName ?? p.user_name ?? ''),
      userPhone: String(p.userPhone ?? p.user_phone ?? ''),
      items: Array.isArray(p.items) ? p.items : [],
      totalWeight: Number(p.totalWeight ?? p.total_weight ?? 0),
      status: (p.status ?? 'PROCESSING') as PickupRequest['status'],
      address: String(p.address ?? ''),
      scheduledDate: String(p.scheduledDate ?? p.scheduled_date ?? ''),
      scheduledTimeSlot: String(p.scheduledTimeSlot ?? p.time_slot ?? ''),
      collectorId: p.collectorId ?? p.collector_id,
      collectorName: p.collectorName ?? p.collector_name,
      recyclerId: p.recyclerId ?? p.recycler_id ?? recyclerId,
      recyclerName: p.recyclerName ?? p.recycler_name ?? '',
      notes: p.notes ?? '',
      priority: (p.priority ?? 'NORMAL') as 'NORMAL' | 'URGENT',
      createdAt: String(p.createdAt ?? p.created_at ?? ''),
      updatedAt: String(p.updatedAt ?? p.updated_at ?? ''),
      completedAt: p.completedAt ?? p.completed_at,
      feedback: p.feedback,
    }));
  },

  async getCompletedItems(recyclerId: string): Promise<PickupRequest[]> {
    const res = await apiCall<any>(`/recycler/${recyclerId}/completed`, { method: 'GET' });
    const raw = (res?.data ?? res) || [];
    const list = Array.isArray(raw) ? raw : [];
    return list.map((p: any) => ({
      id: String(p.id ?? ''),
      userId: String(p.userId ?? p.user_id ?? ''),
      userName: String(p.userName ?? p.user_name ?? ''),
      userPhone: String(p.userPhone ?? p.user_phone ?? ''),
      items: Array.isArray(p.items) ? p.items : [],
      totalWeight: Number(p.totalWeight ?? p.total_weight ?? 0),
      status: (p.status ?? 'RECYCLED') as PickupRequest['status'],
      address: String(p.address ?? ''),
      scheduledDate: String(p.scheduledDate ?? p.scheduled_date ?? ''),
      scheduledTimeSlot: String(p.scheduledTimeSlot ?? p.time_slot ?? ''),
      collectorId: p.collectorId ?? p.collector_id,
      collectorName: p.collectorName ?? p.collector_name,
      recyclerId: p.recyclerId ?? p.recycler_id ?? recyclerId,
      recyclerName: p.recyclerName ?? p.recycler_name ?? '',
      notes: p.notes ?? '',
      priority: (p.priority ?? 'NORMAL') as 'NORMAL' | 'URGENT',
      createdAt: String(p.createdAt ?? p.created_at ?? ''),
      updatedAt: String(p.updatedAt ?? p.updated_at ?? ''),
      completedAt: p.completedAt ?? p.completed_at,
      feedback: p.feedback,
    }));
  },

  async receiveItem(pickupId: string): Promise<PickupRequest | null> {
    const res = await apiCall<any>(`/recycler/pickup/${pickupId}/start`, {
      method: 'PUT'
    });
    return (res?.data ?? res) || null;
  },

  async completeRecycling(
    pickupId: string,
    materials: MaterialBreakdown[]
  ): Promise<{ pickup: PickupRequest | null; log: RecyclingLog }> {

    const res = await apiCall<any>(`/recycler/pickup/${pickupId}/complete`, {
      method: 'PUT',
      body: JSON.stringify({ materials })
    });

    const data = res?.data ?? res;

    return {
      pickup: data?.pickup ?? null,
      log: data?.log ?? data
    };
  },

  /* ================= CERTIFICATES ================= */

  async getCertificates(recyclerId: string): Promise<RecyclingCertificate[]> {
    const res = await apiCall<any>(
      `/recycler/${recyclerId}/certificates`,
      { method: 'GET' }
    );
    const raw = (res?.data ?? res) || [];
    const list = Array.isArray(raw) ? raw : [];

    return list.map((c: any) => {
      const pickupId = c.pickupId ?? c.pickup_id ?? '';
      const totalWeight = Number(c.totalWeight ?? c.total_weight ?? 0);
      const co2SavedRaw = c.co2Saved ?? c.co2_saved;
      const co2Saved = co2SavedRaw != null ? Number(co2SavedRaw) : Math.round(totalWeight * 0.5);
      const issuedAt = c.issuedAt ?? c.issued_at ?? null;

      return {
        id: String(c.id ?? ''),
        pickupId: String(pickupId),
        userId: String(c.userId ?? c.user_id ?? ''),
        recyclerId: String(c.recyclerId ?? c.recycler_id ?? recyclerId),
        recyclerName: String(c.recyclerName ?? c.recycler_name ?? ''),
        items: Array.isArray(c.items) ? c.items : [],
        totalWeight,
        co2Saved,
        issuedAt: issuedAt ? String(issuedAt) : '',
      };
    });
  },

  /**
   * Download certificate PDF via apiCallBlob (token auto-attached).
   */
  async downloadCertificate(certificateId: string): Promise<void> {
    const blob = await apiCallBlob(`/recycler/certificate/${certificateId}/download`, {
      method: 'GET',
    });

    const contentType = blob.type;
    if (!contentType?.includes('application/pdf')) {
      throw new Error('Server did not return a PDF file');
    }

    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `recycling_certificate_${certificateId}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);
  },

  /* ================= NOTIFICATIONS ================= */

  async getNotifications() {
    const res = await apiCall<any>(
      '/recycler/notifications',
      { method: 'GET' }
    );
    return res?.data ?? [];
  },

  async markNotificationRead(id: string): Promise<boolean> {
    const res = await apiCall<any>(
      `/recycler/notifications/${id}/read`,
      { method: 'PATCH' }
    );
    return res?.success ?? true;
  },

  async deleteNotification(id: string): Promise<boolean> {
    const res = await apiCall<any>(
      `/recycler/notifications/${id}`,
      { method: 'DELETE' }
    );
    return res?.success ?? true;
  },

  async getStats(recyclerId: string) {
    return apiCall(`/recycler/${recyclerId}/stats`, { method: 'GET' });
  },

  async getReviews(recyclerId: string) {
    const res = await apiCall<any>(
      `/recycler/${recyclerId}/reviews`,
      { method: 'GET' }
    );
    return Array.isArray(res) ? res : (res?.data ?? []);
  }
};

export default recyclerService;