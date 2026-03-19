import { apiCall } from './api';

/**
 * Admin Pickup Service - Live operations and control
 *
 * Exported as default. Consumers should use:
 * `import adminPickupService from '@/services/adminPickupService';`
 */

export interface LivePickup {
  id: string;
  user_name: string;
  device_type: string;
  status: string;
  address: string;
  collector_name: string | null;
  created_at: string;
}

const adminPickupService = {
  /**
   * GET /api/admin/pickups/live
   *
   * Returns active pickups for operations control panel.
   * Includes statuses: REQUESTED, ACCEPTED, STARTED, COLLECTED, 
   * HANDED_TO_RECYCLER, PROCESSING (NOT RECYCLED).
   *
   * Requires ADMIN role.
   */
  async getLivePickups(): Promise<LivePickup[]> {
    const res = await apiCall<any>('/admin/pickups/live', { method: 'GET' });

    const data = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];

    return data.map((pickup: any) => ({
      id: pickup.id || '',
      user_name: pickup.user_name || 'Unknown',
      device_type: pickup.device_type || 'Unknown',
      status: pickup.status || 'UNKNOWN',
      address: pickup.address || '',
      collector_name: pickup.collector_name || null,
      created_at: pickup.created_at || new Date().toISOString(),
    })) as LivePickup[];
  },
};

export default adminPickupService;
