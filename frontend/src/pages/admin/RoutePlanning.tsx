import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  MapPin,
  Calendar as CalendarIcon,
  Truck,
  Package,
  Clock,
  User,
  Navigation,
  Route,
} from 'lucide-react';
// Removed mock data imports - will be replaced with API calls
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function RoutePlanning() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedPickup, setSelectedPickup] = useState<any>(null);
  const [assignments, setAssignments] = useState<Record<string, string>>({});

  // Safe placeholder data until API integration
  const mockPickupRequestsPlaceholder: any[] = [];
  const mockCollectorsPlaceholder: any[] = [];
  
  const areas: string[] = [];

  const getPickupsForDate = () => {
    const dateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
    return mockPickupRequestsPlaceholder.filter(p => {
      const matchesDate = p.scheduledDate === dateStr;
      const matchesArea = selectedArea === 'all' || p.address.includes(selectedArea);
      return matchesDate && matchesArea;
    });
  };

  const pickupsForDate = getPickupsForDate();

  const availableCollectors = mockCollectorsPlaceholder.filter(c => 
    c.approvalStatus === 'APPROVED' && c.isAvailable
  );

  const handleAssignClick = (pickup: any) => {
    setSelectedPickup(pickup);
    setAssignDialogOpen(true);
  };

  const handleAssignCollector = (collectorId: string) => {
    if (selectedPickup) {
      const collector = mockCollectorsPlaceholder.find(c => c.id === collectorId);
      setAssignments(prev => ({ ...prev, [selectedPickup.id]: collectorId }));
      toast({
        title: "Collector Assigned",
        description: `${collector?.name} has been assigned to pickup at ${selectedPickup.address}`,
      });
      setAssignDialogOpen(false);
      setSelectedPickup(null);
    }
  };

  const getAssignedCollector = (pickupId: string, originalCollectorId?: string) => {
    const assignedId = assignments[pickupId] || originalCollectorId;
    return mockCollectorsPlaceholder.find(c => c.id === assignedId);
  };

  const groupPickupsByArea = () => {
    const grouped: Record<string, any[]> = {};
    pickupsForDate.forEach(pickup => {
      const area = pickup.address.split(',').slice(-2, -1)[0].trim();
      if (!grouped[area]) {
        grouped[area] = [];
      }
      grouped[area].push(pickup);
    });
    return grouped;
  };

  const groupedPickups = groupPickupsByArea();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Route Planning</h1>
        <p className="text-muted-foreground">Plan and optimize pickup routes for collectors</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Select Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className={cn("rounded-md border pointer-events-auto")}
            />
          </CardContent>
        </Card>

        {/* Pickups List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg">
                  Pickups for {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Today'}
                </CardTitle>
                <CardDescription>{pickupsForDate.length} pickups scheduled</CardDescription>
              </div>
              <Select value={selectedArea} onValueChange={setSelectedArea}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by area" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Areas</SelectItem>
                  {areas.map(area => (
                    <SelectItem key={area} value={area}>{area}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {pickupsForDate.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                  <CalendarIcon className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-1">No Pickups Scheduled</h3>
                <p className="text-muted-foreground">There are no pickups for this date.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedPickups).map(([area, pickups]) => (
                  <div key={area}>
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold">{area}</h3>
                      <Badge variant="secondary">{pickups.length} pickups</Badge>
                    </div>
                    <div className="space-y-3 pl-6 border-l-2 border-primary/20">
                      {pickups.map(pickup => {
                        const assignedCollector = getAssignedCollector(pickup.id, pickup.collectorId);
                        return (
                          <Card key={pickup.id} className="bg-muted/30">
                            <CardContent className="p-4">
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">{pickup.userName}</span>
                                    <Badge variant="outline" className="text-xs">
                                      {pickup.scheduledTimeSlot}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Package className="h-3 w-3" />
                                    <span>{pickup.items.length} items • {pickup.totalWeight} kg</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <MapPin className="h-3 w-3" />
                                    <span className="truncate max-w-xs">{pickup.address}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {assignedCollector ? (
                                    <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-lg">
                                      <Avatar className="h-8 w-8">
                                        <AvatarImage src={assignedCollector.avatar} />
                                        <AvatarFallback>{assignedCollector.name.charAt(0)}</AvatarFallback>
                                      </Avatar>
                                      <span className="text-sm font-medium">{assignedCollector.name}</span>
                                    </div>
                                  ) : (
                                    <Button 
                                      size="sm" 
                                      onClick={() => handleAssignClick(pickup)}
                                    >
                                      <Truck className="h-4 w-4 mr-1" />
                                      Assign
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Map Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Route className="h-5 w-5" />
            Route Map
          </CardTitle>
          <CardDescription>Visualize pickup locations and optimize routes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] bg-muted/50 rounded-lg flex items-center justify-center border-2 border-dashed border-muted-foreground/20">
            <div className="text-center">
              <Navigation className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-1">Map Integration</h3>
              <p className="text-muted-foreground text-sm">
                Google Maps integration will be available here
              </p>
              <p className="text-muted-foreground text-sm">
                to visualize and optimize pickup routes
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assign Collector Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Collector</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select a collector for pickup at:<br />
              <strong>{selectedPickup?.address}</strong>
            </p>
            <div className="space-y-2">
              {availableCollectors.map(collector => (
                <Card 
                  key={collector.id} 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleAssignCollector(collector.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={collector.avatar} />
                          <AvatarFallback>{collector.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{collector.name}</p>
                          <p className="text-sm text-muted-foreground">{collector.vehicleType}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary">⭐ {collector.rating}</Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {collector.totalPickups} pickups
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
