import { PickupRequest } from '@/types';
import { apiCall } from './api';

// User-focused pickup service wired to Flask /api/pickups endpoints (url_prefix=/api/pickups)
export const pickupService = {
  /**
   * Normalize weight field from various backend formats
   */
  _normalizeWeight(pickup: any): number {
    return (
      Number(pickup?.weight ?? 0) ||
      Number(pickup?.totalWeight ?? 0) ||
      Number(pickup?.total_weight ?? 0) ||
      Number(pickup?.weight_kg ?? 0) ||
      0
    );
  },

  /**
   * GET /api/pickups - current user's pickups (identity from JWT, no params)
   */
  async getMyPickups(): Promise<PickupRequest[]> {
    const res = await apiCall<any>('/pickups', { method: 'GET' });
    const list =
      (Array.isArray(res) && res) ||
      (Array.isArray(res?.data) && res.data) ||
      (Array.isArray(res?.pickups) && res.pickups) ||
      [];
    
    // Normalize weight fields for all pickups
    return list.map((p: any) => ({
      ...p,
      totalWeight: this._normalizeWeight(p),
      items: Array.isArray(p.items) ? p.items : [],
    })) as PickupRequest[];
  },

  /**
   * Backwards-compatible alias used by some existing user pages.
   * Filters are ignored because backend uses JWT identity.
   */
  async getAll(): Promise<PickupRequest[]> {
    return this.getMyPickups();
  },

  /**
   * GET /api/pickups/<id> - single pickup by id, bound to JWT identity on backend
   */
  async getById(id: string): Promise<PickupRequest | null> {
    const res = await apiCall<any>(`/pickups/${id}`, { method: 'GET' });
    const raw = (res?.data ?? res?.pickup ?? res) as any;
    if (!raw) return null;
    
    // Normalize weight field
    return {
      ...raw,
      totalWeight: this._normalizeWeight(raw),
      items: Array.isArray(raw.items) ? raw.items : [],
    } as PickupRequest;
  },

  /**
   * POST /api/pickups - create pickup for current user (identity from JWT).
   * Backend returns a minimal payload: { message, pickup_id }.
   */
  async createPickup(data: unknown): Promise<PickupRequest> {
    const res = await apiCall<any>('/pickups', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const payload = (res?.data ?? res) as { pickup_id?: string; id?: string };
    const id = payload?.pickup_id ?? payload?.id ?? '';
    return { id } as PickupRequest;
  },

  /**
   * Convenience alias for older code paths.
   */
  async create(data: unknown): Promise<PickupRequest> {
    return this.createPickup(data);
  },

  /**
   * PUT /api/pickups/<id>/cancel - cancel pickup for current user (if supported by backend).
   */
  async cancelPickup(id: string): Promise<boolean> {
    const res = await apiCall<any>(`/pickups/${id}/cancel`, {
      method: 'PUT',
    });
    const data = res?.data ?? res;
    if (typeof data === 'boolean') return data;
    if (data && typeof data.success === 'boolean') return data.success;
    return true;
  },

  /**
   * POST /api/pickups/<id>/feedback - Add feedback to completed pickup.
   * Backend validates ownership and completion.
   */
  async addFeedback(
    pickupId: string,
    rating: number,
    comment?: string
  ): Promise<any> {
    const res = await apiCall<any>(`/pickups/${pickupId}/feedback`, {
      method: 'POST',
      body: JSON.stringify({ rating, comment }),
    });
    return res?.data ?? res;
  },

  /**
   * PATCH /api/admin/pickups/<id>/assign - Admin assigns a collector to a pickup.
   * Requires ADMIN role. Same endpoint used for reassign.
   */
  async assignCollector(
    pickupId: string,
    collectorId: string,
    _collectorName?: string
  ): Promise<void> {
    await apiCall<any>(`/admin/pickups/${pickupId}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ collector_id: collectorId }),
    });
  },

  /**
   * Same as assignCollector; backend treats assign and reassign identically.
   */
  async reassignCollector(
    pickupId: string,
    collectorId: string,
    collectorName?: string
  ): Promise<void> {
    return this.assignCollector(pickupId, collectorId, collectorName);
  },
};

export default pickupService;
