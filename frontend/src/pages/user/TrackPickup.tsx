import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { pickupService } from '@/services/pickupService';
import { PickupRequest } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, ChevronRight, Clock, AlertTriangle } from 'lucide-react';

const statusColors: Record<string, string> = {
  REQUESTED: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  ASSIGNED: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  EN_ROUTE: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  COLLECTED: 'bg-teal-500/10 text-teal-600 border-teal-500/20',
  HANDED_TO_RECYCLER: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
  PROCESSING: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  RECYCLED: 'bg-green-500/10 text-green-600 border-green-500/20',
  CANCELLED: 'bg-red-500/10 text-red-600 border-red-500/20',
};

const statusLabels: Record<string, string> = {
  REQUESTED: 'Pending',
  ASSIGNED: 'Assigned',
  EN_ROUTE: 'En Route',
  COLLECTED: 'Collected',
  HANDED_TO_RECYCLER: 'With Recycler',
  PROCESSING: 'Processing',
  RECYCLED: 'Completed',
  CANCELLED: 'Cancelled',
};

export default function TrackPickup() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  // Safe default - always initialize as empty array
  const [pickups, setPickups] = useState<PickupRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPickups();
  }, [user]);

  const loadPickups = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      if (import.meta.env.DEV) console.log('[USER TRACK] Fetching pickups for user:', user.id);
      const res = await pickupService.getMyPickups();
      if (import.meta.env.DEV) console.log('[USER TRACK] API response:', res);
      
      // Service already normalizes weight, but ensure items array is safe
      const normalizedPickups = res.map((p: any) => ({
        ...p,
        scheduledDate: p.scheduledDate || p.scheduled_date || p.date || '',
        scheduledTimeSlot: p.scheduledTimeSlot || p.time_slot || '',
        items: Array.isArray(p.items) ? p.items : [],
        collectorName: p.collectorName || p.collector_name || null,
        recyclerName: p.recyclerName || p.recycler_name || null,
      }));
      
      // Filter only active pickups (not completed or cancelled)
      const activePickups = normalizedPickups.filter(p => 
        p.status && !['RECYCLED', 'CANCELLED'].includes(p.status)
      );
      
      setPickups(activePickups);
      if (import.meta.env.DEV) console.log('[USER TRACK] Loaded pickups:', activePickups.length);
    } catch (error: any) {
      console.error('[USER TRACK] Failed to load pickups:', error);
      const msg = String(error?.message || error);
      // Handle 401 - redirect to login
      if (msg.includes('401') || msg.toLowerCase().includes('unauthorized') || msg.toLowerCase().includes('authorization')) {
        logout();
        navigate('/login');
        return;
      }
      // Set empty array on error to prevent crashes
      setPickups([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Track Your Pickups</h1>
        <p className="text-muted-foreground">Monitor the status of your active pickup requests</p>
      </div>

      {(pickups?.length || 0) === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium text-foreground mb-2">No Active Pickups</h3>
            <p className="text-sm text-muted-foreground mb-4">
              You don't have any active pickup requests at the moment.
            </p>
            <Button onClick={() => navigate('/user/new-pickup')}>
              Schedule New Pickup
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {(pickups || []).map((pickup) => (
            <Card 
              key={pickup.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/user/track/${pickup.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge 
                        variant="outline" 
                        className={statusColors[pickup.status]}
                      >
                        {statusLabels[pickup.status]}
                      </Badge>
                      {pickup.priority === 'URGENT' && (
                        <Badge variant="outline" className="border-orange-500 text-orange-500">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Urgent
                        </Badge>
                      )}
                    </div>

                    <h4 className="font-medium text-foreground mb-1">
                      {(pickup.items?.length || 0)} item{(pickup.items?.length || 0) > 1 ? 's' : ''} • {pickup.totalWeight || 0} kg
                    </h4>
                    
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {pickup.address || 'Address not available'}
                    </p>

                    {(pickup.scheduledDate || pickup.scheduledTimeSlot) && (
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>
                            {pickup.scheduledDate || ''} 
                            {pickup.scheduledDate && pickup.scheduledTimeSlot ? ' • ' : ''}
                            {pickup.scheduledTimeSlot || ''}
                          </span>
                        </div>
                      </div>
                    )}

                    {pickup.collectorName && (
                      <p className="text-sm text-primary mt-2">
                        Collector: {pickup.collectorName}
                      </p>
                    )}
                  </div>

                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
