import { PickupRequest, Recycler } from '@/types';
import { apiCall } from './api';

/**
 * Collector Service  methods used by collector-facing pages.
 *
 * All functions return normalized data or `null`/`[]` when no result.
 * The service is exported as the default export; consumers should
 * `import collectorService from '@/services/collectorService';`.
 */

const collectorService = {
  /* ================= PICKUPS ================= */

  async getPickups(): Promise<PickupRequest[]> {
    const res = await apiCall<any>('/collector/pickups', { method: 'GET' });
    const list = Array.isArray(res?.data)
      ? res.data
      : Array.isArray(res)
      ? res
      : [];
    return list as PickupRequest[];
  },

  async getTodaysPickups(): Promise<PickupRequest[]> {
    const res = await apiCall<any>(
      '/collector/pickups/today',
      { method: 'GET' }
    );
    const list = Array.isArray(res?.data)
      ? res.data
      : Array.isArray(res)
      ? res
      : [];
    return list as PickupRequest[];
  },

  async getCompletedPickups(): Promise<PickupRequest[]> {
    const res = await apiCall<any>(
      '/collector/pickups/completed',
      { method: 'GET' }
    );
    const list = Array.isArray(res?.data)
      ? res.data
      : Array.isArray(res)
      ? res
      : [];
    return list as PickupRequest[];
  },

  /* ---------------- ACTIONS ---------------- */

  async acceptPickup(pickupId: string): Promise<boolean> {
    const res = await apiCall<any>(
      `/collector/pickups/${pickupId}/accept`,
      { method: 'POST' }
    );
    return res?.success ?? true;
  },

  async startPickup(pickupId: string): Promise<PickupRequest | null> {
    const res = await apiCall<any>(
      `/collector/pickups/${pickupId}/start`,
      { method: 'PUT' }
    );
    const data = res?.data ?? res?.pickup ?? res;
    return (data as PickupRequest) || null;
  },

  async markCollected(
    pickupId: string,
    notes?: string,
    photos?: string[]
  ): Promise<PickupRequest | null> {
    const body: any = {};
    if (notes !== undefined) body.notes = notes;
    if (photos && photos.length > 0) body.photos = photos;

    const res = await apiCall<any>(
      `/collector/pickups/${pickupId}/collect`,
      { method: 'PUT', body: JSON.stringify(body) }
    );
    const data = res?.data ?? res?.pickup ?? res;
    return (data as PickupRequest) || null;
  },

  async handToRecycler(
    pickupId: string,
    recyclerId: string,
    recyclerName: string
  ): Promise<PickupRequest | null> {
    const res = await apiCall<any>(
      `/collector/pickups/${pickupId}/handover`,
      {
        method: 'PUT',
        body: JSON.stringify({ recyclerId, recyclerName }),
      }
    );
    const data = res?.data ?? res?.pickup ?? res;
    return (data as PickupRequest) || null;
  },

  async addNotes(
    pickupId: string,
    notes: string
  ): Promise<PickupRequest | null> {
    const res = await apiCall<any>(
      `/collector/pickups/${pickupId}/notes`,
      { method: 'PUT', body: JSON.stringify({ notes }) }
    );
    const data = res?.data ?? res?.pickup ?? res;
    return (data as PickupRequest) || null;
  },

  /* ================= STATS ================= */

  async getStats(): Promise<any> {
    const res = await apiCall<any>('/collector/stats', { method: 'GET' });
    return res?.data ?? res;
  },

  /* ================= NOTIFICATIONS ================= */

  async getNotifications(): Promise<any[]> {
    const res = await apiCall<any>(
      '/collector/notifications',
      { method: 'GET' }
    );
    return res?.data ?? [];
  },

  async markNotificationRead(id: string): Promise<boolean> {
    const res = await apiCall<any>(
      `/collector/notifications/${id}/read`,
      { method: 'PATCH' }
    );
    return res?.success ?? true;
  },

  async deleteNotification(id: string): Promise<boolean> {
    const res = await apiCall<any>(
      `/collector/notifications/${id}`,
      { method: 'DELETE' }
    );
    return res?.success ?? true;
  },
};

export default collectorService;
