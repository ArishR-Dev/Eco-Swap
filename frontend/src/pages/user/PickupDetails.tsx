import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { pickupService } from '@/services/pickupService';
import { userService } from '@/services/userService';
import { PickupRequest, Collector } from '@/types';
import { ewasteCategories } from '@/data/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import StatusTimeline from '@/components/user/StatusTimeline';
import CollectorCard from '@/components/user/CollectorCard';
import { ArrowLeft, Package, MapPin, Calendar, Clock, AlertTriangle, Navigation } from 'lucide-react';

export default function PickupDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [pickup, setPickup] = useState<PickupRequest | null>(null);
  const [collector, setCollector] = useState<Collector | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    loadPickupDetails();
  }, [id]);

  const loadPickupDetails = async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    try {
      if (import.meta.env.DEV) {
        console.log('[USER] loading pickup details', id);
      }
      setNotFound(false);
      setLoadError(null);

      if (import.meta.env.DEV) {
        console.log('[USER DETAILS] Fetching pickup:', id);
      }
      const pickupData = await pickupService.getById(id);
      if (import.meta.env.DEV) {
        console.log('[USER DETAILS] API response:', pickupData);
      }
      
      if (!pickupData) {
        // Treat null as not found (service normalizes 404s to null in some cases)
        setNotFound(true);
        setPickup(null);
        return;
      }

      // Normalize response shape (direct object vs { data: ... } vs { pickup: ... })
      let raw: any = pickupData as any;
      if (raw && typeof raw === 'object') {
        if ('data' in raw && (raw as any).data) raw = (raw as any).data;
        if ('pickup' in raw && (raw as any).pickup) raw = (raw as any).pickup;
      }

      const safeItems = Array.isArray(raw?.items) ? raw.items : [];
      const computedWeight = safeItems.reduce((sum: number, item: any) => {
        const qty = Number(item?.quantity ?? 1) || 1;
        const w = Number(item?.estimatedWeight ?? item?.weight ?? 0) || 0;
        return sum + qty * w;
      }, 0);
      
      // Normalize weight from various backend formats
      const normalizeWeight = (p: any): number => {
        const weight = Number(p?.weight ?? 0) ||
          Number(p?.totalWeight ?? 0) ||
          Number(p?.total_weight ?? 0) ||
          Number(p?.weight_kg ?? 0) ||
          0;
        return weight > 0 ? weight : computedWeight;
      };
      
      // Normalize pickup data with safe defaults
      const normalizedPickup = {
        ...raw,
        items: safeItems,
        totalWeight: normalizeWeight(raw),
        scheduledDate: raw?.scheduledDate ?? raw?.scheduled_date ?? raw?.date ?? '',
        scheduledTimeSlot: raw?.scheduledTimeSlot ?? raw?.time_slot ?? '',
        address: raw?.address ?? '',
        status: raw?.status ?? 'REQUESTED',
        priority: raw?.priority ?? 'NORMAL',
        collectorId: raw?.collectorId ?? raw?.collector_id ?? null,
        collectorName: raw?.collectorName ?? raw?.collector_name ?? null,
      };
      
      setPickup(normalizedPickup);
      if (import.meta.env.DEV) {
        console.log('[USER] pickup loaded', normalizedPickup.id);
      }

      // Load collector details if collectorId exists
      if (normalizedPickup.collectorId) {
        try {
          const collectorData = await userService.getCollectorById(normalizedPickup.collectorId);
          setCollector(collectorData);
        } catch (err) {
          console.error('[USER DETAILS] Failed to load collector:', err);
          // Don't fail the whole page if collector load fails
        }
      }
    } catch (error: any) {
      console.error('[USER DETAILS] Failed to load pickup details:', error);
      const msg = String(error?.message || error);
      // Handle 401 - redirect to login
      if (msg.includes('401') || msg.toLowerCase().includes('unauthorized') || msg.toLowerCase().includes('authorization')) {
        logout();
        navigate('/login');
        return;
      }
      // Only show "not found" if it's a 404 error
      if (msg.includes('404') || msg.toLowerCase().includes('not found')) {
        setNotFound(true);
        setPickup(null);
      } else {
        setNotFound(false);
        setLoadError('Failed to load pickup details. Please try again.');
        setPickup(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const getCategoryLabel = (category: string) => {
    return ewasteCategories.find(c => c.category === category)?.label || category;
  };

  // Generate mock ETA based on status
  const getEta = () => {
    if (!pickup) return undefined;
    if (pickup.status === 'EN_ROUTE') return '15-20 minutes';
    if (pickup.status === 'ASSIGNED') return 'On scheduled date';
    return undefined;
  };

  if (loading) {
    return (
      <div className="container py-8 space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!pickup && notFound) {
    return (
      <div className="container py-8">
        <Card className="text-center py-12">
          <CardContent>
            <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium text-foreground mb-2">Pickup Not Found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              The pickup request you're looking for doesn't exist.
            </p>
            <Button onClick={() => navigate('/user/track')}>
              View All Pickups
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!pickup && loadError) {
    return (
      <div className="container py-8">
        <Card className="text-center py-12">
          <CardContent>
            <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium text-foreground mb-2">Something went wrong</h3>
            <p className="text-sm text-muted-foreground mb-4">{loadError}</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => { setLoading(true); loadPickupDetails(); }}>
                Retry
              </Button>
              <Button variant="outline" onClick={() => navigate('/user/track')}>
                View All Pickups
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!pickup) {
    return (
      <div className="container py-8">
        <Card className="text-center py-12">
          <CardContent>
            <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium text-foreground mb-2">Loading pickup</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Please wait...
            </p>
            <Button variant="outline" onClick={() => navigate('/user/track')}>
              View All Pickups
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const items = pickup?.items ?? [];
  const totalWeight =
    pickup?.totalWeight == null
      ? items.reduce((sum: number, item: any) => {
          const qty = Number(item?.quantity ?? 1) || 1;
          const w = Number(item?.estimatedWeight ?? item?.weight ?? 0) || 0;
          return sum + qty * w;
        }, 0)
      : pickup.totalWeight;
  const canShowTimeline = typeof pickup?.status === 'string' && pickup.status.length > 0;

  return (
    <div className="container py-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pickup Details</h1>
          <p className="text-sm text-muted-foreground font-mono">{pickup.id}</p>
        </div>
        {pickup.priority === 'URGENT' && (
          <Badge variant="outline" className="ml-auto border-orange-500 text-orange-500">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Urgent
          </Badge>
        )}
      </div>

      {/* Status Timeline */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Status Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {canShowTimeline ? (
            <StatusTimeline 
              currentStatus={pickup.status} 
              completedAt={pickup.completedAt}
            />
          ) : (
            <Badge variant="outline">{String(pickup?.status ?? 'REQUESTED')}</Badge>
          )}
        </CardContent>
      </Card>

      {/* Collector Info (if assigned) */}
      {collector && (
        <div className="mb-6">
          <h3 className="font-medium text-foreground mb-3">Assigned Collector</h3>
          <CollectorCard 
            collector={{
              id: collector.id,
              name: collector.name,
              phone: collector.phone,
              vehicleType: collector.vehicleType,
              rating: collector.rating,
              avatar: collector.avatar,
            }}
            eta={getEta()}
          />
        </div>
      )}

      {/* Map Placeholder */}
      {['ASSIGNED', 'EN_ROUTE'].includes(pickup.status) && (
        <Card className="mb-6">
          <CardContent className="p-0">
            <div className="h-48 bg-muted/30 rounded-lg flex items-center justify-center border-2 border-dashed border-muted-foreground/25">
              <div className="text-center text-muted-foreground">
                <Navigation className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Live tracking map</p>
                <p className="text-xs">(GPS integration coming soon)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Schedule Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Date</p>
              <p className="font-medium">{pickup.scheduledDate || 'Not scheduled'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Time Slot</p>
              <p className="font-medium">{pickup.scheduledTimeSlot || 'Not specified'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Address */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Pickup Address
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{pickup.address || 'Address not available'}</p>
          {pickup.latitude != null && pickup.longitude != null && (
            <p className="text-xs text-muted-foreground mt-1">
              GPS: {pickup.latitude.toFixed(5)}, {pickup.longitude.toFixed(5)}
            </p>
          )}
          {pickup.address && (
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-3"
              onClick={() => {
                let url: string;
                if (pickup.latitude != null && pickup.longitude != null) {
                  url = `https://www.google.com/maps/dir/?api=1&destination=${pickup.latitude},${pickup.longitude}`;
                } else {
                  url = `https://maps.google.com/?q=${encodeURIComponent(pickup.address)}`;
                }
                window.open(url, '_blank');
              }}
            >
              <Navigation className="w-4 h-4 mr-2" />
              Open in Maps
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Items */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Items ({items.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={item.id || index} className="flex justify-between items-center py-2 border-b last:border-0">
                <div>
                  <p className="font-medium">{getCategoryLabel(item.category)}</p>
                  {item.description && (
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-medium">x{item.quantity || 1}</p>
                  <p className="text-sm text-muted-foreground">{item.estimatedWeight || 0} kg</p>
                </div>
              </div>
            ))}
          </div>
          <Separator className="my-4" />
          <div className="flex justify-between items-center font-medium">
            <span>Total Weight</span>
            <span className="text-primary">{totalWeight || 0} kg</span>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {pickup.notes && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{pickup.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={() => navigate('/user/track')}>
          Back to Tracking
        </Button>
        {pickup.status === 'REQUESTED' && (
          <Button 
            variant="destructive" 
            className="flex-1"
            onClick={async () => {
              try {
                await pickupService.cancelPickup(pickup.id);
                navigate('/user/track');
              } catch (error: any) {
                const msg = String(error?.message || error);
                if (msg.includes('401') || msg.toLowerCase().includes('unauthorized')) {
                  logout();
                  navigate('/login');
                }
              }
            }}
          >
            Cancel Request
          </Button>
        )}
      </div>
    </div>
  );
}
