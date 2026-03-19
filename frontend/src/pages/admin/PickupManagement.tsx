import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { AuthLoader } from '@/components/auth/AuthLoader';
import adminService from '@/services/adminService';
import { pickupService } from '@/services/pickupService';
import { PickupRequest, Collector, PickupStatus } from '@/types';
import { ewasteCategories } from '@/data/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Package, 
  Search, 
  Filter, 
  UserPlus, 
  ArrowUpDown, 
  AlertTriangle,
  Clock,
  CheckCircle,
  RefreshCw,
  Flag,
  Eye
} from 'lucide-react';

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

const allStatuses: PickupStatus[] = [
  'REQUESTED', 'ASSIGNED', 'EN_ROUTE', 'COLLECTED', 
  'HANDED_TO_RECYCLER', 'PROCESSING', 'RECYCLED', 'CANCELLED'
];

export default function PickupManagement() {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [pickups, setPickups] = useState<PickupRequest[]>([]);
  const [collectors, setCollectors] = useState<Collector[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal states
  const [selectedPickup, setSelectedPickup] = useState<PickupRequest | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedCollector, setSelectedCollector] = useState<string>('');
  const [newStatus, setNewStatus] = useState<PickupStatus | ''>('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [pickupData, collectorData] = await Promise.all([
        adminService.getPickups(),
        adminService.getAvailableCollectors()
      ]);
      setPickups(pickupData);
      setCollectors(collectorData);
    } catch (err) {
      console.error('Failed to load data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load pickup data';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    loadData();
  }, [isAuthenticated]);

  if (authLoading) return <AuthLoader />;
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;

  const filteredPickups = pickups.filter(pickup => {
    const idStr = pickup?.id != null ? String(pickup.id) : '';
    const nameStr = pickup?.userName != null ? String(pickup.userName) : '';
    const addressStr = pickup?.address != null ? String(pickup.address) : '';
    const matchesSearch =
      idStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      nameStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      addressStr.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || pickup.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleAssignCollector = async () => {
    if (!selectedPickup || !selectedCollector) return;

    const collector = collectors.find(c => c.id === selectedCollector);
    if (!collector) return;

    try {
      await pickupService.assignCollector(selectedPickup.id, collector.id, collector.name);
      toast({
        title: 'Collector Assigned',
        description: `${collector.name} has been assigned to the pickup.`,
      });
      setAssignModalOpen(false);
      setSelectedCollector('');
      loadData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to assign collector',
        variant: 'destructive',
      });
    }
  };

  const handleReassignCollector = async () => {
    if (!selectedPickup || !selectedCollector) return;

    const collector = collectors.find(c => c.id === selectedCollector);
    if (!collector) return;

    try {
      await pickupService.reassignCollector(selectedPickup.id, collector.id, collector.name);
      toast({
        title: 'Collector Reassigned',
        description: `Pickup reassigned to ${collector.name}.`,
      });
      setAssignModalOpen(false);
      setSelectedCollector('');
      loadData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reassign collector',
        variant: 'destructive',
      });
    }
  };

  const handleStatusChange = async () => {
    if (!selectedPickup || !newStatus) return;

    try {
      await pickupService.updateStatus(selectedPickup.id, newStatus);
      toast({
        title: 'Status Updated',
        description: `Pickup status changed to ${statusLabels[newStatus]}.`,
      });
      setStatusModalOpen(false);
      setNewStatus('');
      loadData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive',
      });
    }
  };

  const handleTogglePriority = async (pickup: PickupRequest) => {
    const newPriority = pickup.priority === 'URGENT' ? 'NORMAL' : 'URGENT';
    try {
      await pickupService.updatePriority(pickup.id, newPriority);
      toast({
        title: 'Priority Updated',
        description: `Pickup marked as ${newPriority}.`,
      });
      loadData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update priority',
        variant: 'destructive',
      });
    }
  };

  const unassignedCount = pickups.filter(p => p.status === 'REQUESTED' && !p.collectorId).length;
  const urgentCount = pickups.filter(p => p.priority === 'URGENT' && p.status !== 'RECYCLED').length;

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="h-6 w-6 text-destructive mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-destructive mb-1">Error Loading Pickups</h3>
                <p className="text-sm text-destructive/80">{error}</p>
              </div>
              <Button variant="outline" size="sm" onClick={loadData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Pickup Management</h1>
        <p className="text-muted-foreground">Manage and assign pickup requests</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{unassignedCount}</p>
              <p className="text-sm text-muted-foreground">Unassigned</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{urgentCount}</p>
              <p className="text-sm text-muted-foreground">Urgent</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{collectors.length}</p>
              <p className="text-sm text-muted-foreground">Available Collectors</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by ID, user, or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {allStatuses.map(status => (
                  <SelectItem key={status} value={status}>
                    {statusLabels[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={loadData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pickup Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request ID</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Collector</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPickups.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <Package className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No pickups found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPickups.map((pickup, idx) => (
                    <TableRow key={pickup?.id ?? `row-${idx}`}>
                      <TableCell className="font-mono text-sm">
                        {pickup.id != null ? String(pickup.id).slice(0, 12) : '—'}...
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{pickup.userName}</p>
                          <p className="text-sm text-muted-foreground">{pickup.userPhone}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {pickup.items.length} items ({pickup.totalWeight} kg)
                      </TableCell>
                      <TableCell>
                        <div>
                          <p>{pickup.scheduledDate}</p>
                          <p className="text-sm text-muted-foreground">{pickup.scheduledTimeSlot}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColors[pickup.status]}>
                          {statusLabels[pickup.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {pickup.collectorName || (
                          <span className="text-muted-foreground">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTogglePriority(pickup)}
                          className={pickup.priority === 'URGENT' ? 'text-orange-600' : 'text-muted-foreground'}
                        >
                          <Flag className={`w-4 h-4 ${pickup.priority === 'URGENT' ? 'fill-orange-600' : ''}`} />
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedPickup(pickup);
                              setDetailsModalOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedPickup(pickup);
                              setSelectedCollector(pickup.collectorId || '');
                              setAssignModalOpen(true);
                            }}
                          >
                            <UserPlus className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedPickup(pickup);
                              setNewStatus(pickup.status);
                              setStatusModalOpen(true);
                            }}
                          >
                            <ArrowUpDown className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Assign Collector Modal */}
      <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedPickup?.collectorId ? 'Reassign Collector' : 'Assign Collector'}
            </DialogTitle>
            <DialogDescription>
              {selectedPickup?.collectorId 
                ? `Current collector: ${selectedPickup.collectorName}`
                : 'Select an available collector for this pickup'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Select value={selectedCollector} onValueChange={setSelectedCollector}>
              <SelectTrigger>
                <SelectValue placeholder="Select a collector" />
              </SelectTrigger>
              <SelectContent>
                {collectors.map(collector => (
                  <SelectItem key={collector.id} value={collector.id}>
                    <div className="flex items-center gap-2">
                      <span>{collector.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {collector.vehicleType}
                      </Badge>
                      <span className="text-muted-foreground">★ {collector.rating}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={selectedPickup?.collectorId ? handleReassignCollector : handleAssignCollector}
              disabled={!selectedCollector}
            >
              {selectedPickup?.collectorId ? 'Reassign' : 'Assign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Status Modal */}
      <Dialog open={statusModalOpen} onOpenChange={setStatusModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Pickup Status</DialogTitle>
            <DialogDescription>
              Current status: {selectedPickup && statusLabels[selectedPickup.status]}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Select value={newStatus} onValueChange={(v) => setNewStatus(v as PickupStatus)}>
              <SelectTrigger>
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent>
                {allStatuses.map(status => (
                  <SelectItem key={status} value={status}>
                    <Badge variant="outline" className={statusColors[status]}>
                      {statusLabels[status]}
                    </Badge>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleStatusChange} disabled={!newStatus}>
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pickup Details Modal */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Pickup Details</DialogTitle>
            <DialogDescription className="font-mono">
              {selectedPickup?.id}
            </DialogDescription>
          </DialogHeader>
          
          {selectedPickup && (
            <div className="py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">User</p>
                  <p className="font-medium">{selectedPickup.userName}</p>
                  <p className="text-sm text-muted-foreground">{selectedPickup.userPhone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant="outline" className={statusColors[selectedPickup.status]}>
                    {statusLabels[selectedPickup.status]}
                  </Badge>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-medium">{selectedPickup.address}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{selectedPickup.scheduledDate}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Time Slot</p>
                  <p className="font-medium">{selectedPickup.scheduledTimeSlot}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Items</p>
                <div className="space-y-2">
                  {selectedPickup.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm border-b pb-2">
                      <span>{ewasteCategories.find(c => c.category === item.category)?.label || item.category}</span>
                      <span>x{item.quantity} ({item.estimatedWeight} kg)</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between font-medium">
                <span>Total Weight</span>
                <span>{selectedPickup.totalWeight} kg</span>
              </div>

              {selectedPickup.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="text-sm">{selectedPickup.notes}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
