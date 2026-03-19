import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { pickupService } from '@/services/pickupService';
import { userService } from '@/services/userService';
import { PickupRequest, PickupStatus } from '@/types';
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
import { Package, Search, Download, Eye, Filter, Calendar } from 'lucide-react';

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

export default function PickupHistory() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [pickups, setPickups] = useState<PickupRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadPickups();
  }, [user]);

  const loadPickups = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const data = await pickupService.getMyPickups();
      // Normalize weight fields
      const normalized = data.map((p: any) => ({
        ...p,
        totalWeight: Number(p?.weight ?? 0) ||
          Number(p?.totalWeight ?? 0) ||
          Number(p?.total_weight ?? 0) ||
          Number(p?.weight_kg ?? 0) ||
          0,
        items: Array.isArray(p.items) ? p.items : [],
      }));
      setPickups(normalized);
    } catch (error: any) {
      console.error('Failed to load pickups:', error);
      const msg = String(error?.message || error);
      if (msg.includes('401') || msg.toLowerCase().includes('unauthorized')) {
        logout();
        navigate('/login');
        return;
      }
      setPickups([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredPickups = pickups.filter(pickup => {
    const idStr = pickup?.id != null ? String(pickup.id) : '';
    const addressStr = pickup?.address != null ? String(pickup.address) : '';
    const matchesSearch =
      idStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      addressStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (pickup.items || []).some(item =>
        ewasteCategories.find(c => c.category === item?.category)?.label
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase())
      );

    const matchesStatus = statusFilter === 'all' || pickup.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleDownloadCertificate = async (pickupId: string) => {
    try {
      await userService.downloadCertificateByPickupId(pickupId);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Download certificate error:', error);
      const msg = error instanceof Error ? error.message : 'Failed to download certificate';
      alert(msg);
    }
  };

  if (loading) {
    return (
      <div className="container py-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Pickup History</h1>
        <p className="text-muted-foreground">View all your past and current pickup requests</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by ID, address, or item..."
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
                <SelectItem value="REQUESTED">Pending</SelectItem>
                <SelectItem value="ASSIGNED">Assigned</SelectItem>
                <SelectItem value="EN_ROUTE">En Route</SelectItem>
                <SelectItem value="COLLECTED">Collected</SelectItem>
                <SelectItem value="RECYCLED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {filteredPickups.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium text-foreground mb-2">No Pickups Found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {pickups.length === 0 
                ? "You haven't made any pickup requests yet."
                : "No pickups match your search criteria."}
            </p>
            {pickups.length === 0 && (
              <Button onClick={() => navigate('/user/new-pickup')}>
                Schedule Your First Pickup
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            {/* Mobile View */}
            <div className="sm:hidden divide-y">
              {filteredPickups.map((pickup) => (
                <div key={pickup.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <Badge 
                      variant="outline" 
                      className={statusColors[pickup.status]}
                    >
                      {statusLabels[pickup.status]}
                    </Badge>
                    <span className="text-xs text-muted-foreground font-mono">
                      {pickup.id.slice(0, 12)}...
                    </span>
                  </div>
                  <p className="font-medium mb-1">
                    {(pickup.items?.length || 0)} item{(pickup.items?.length || 0) > 1 ? 's' : ''} • {pickup.totalWeight || 0} kg
                  </p>
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                    {pickup.address}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <Calendar className="w-4 h-4" />
                    <span>{pickup.scheduledDate}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => navigate(`/user/track/${pickup.id}`)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Details
                    </Button>
                    {pickup.status === 'RECYCLED' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDownloadCertificate(pickup.id)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View */}
            <div className="hidden sm:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPickups.map((pickup, idx) => (
                    <TableRow key={pickup?.id ?? `row-${idx}`}>
                      <TableCell className="font-mono text-sm">
                        {pickup.id != null ? String(pickup.id).slice(0, 15) : '—'}...
                      </TableCell>
                      <TableCell>{pickup.scheduledDate}</TableCell>
                      <TableCell>{(pickup.items?.length || 0)} item(s)</TableCell>
                      <TableCell>{pickup.totalWeight || 0} kg</TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={statusColors[pickup.status]}
                        >
                          {statusLabels[pickup.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => navigate(`/user/track/${pickup.id}`)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          {pickup.status === 'RECYCLED' && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDownloadCertificate(pickup.id)}
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Certificate
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      {pickups.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{pickups.length}</p>
              <p className="text-sm text-muted-foreground">Total Requests</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">
                {pickups.filter(p => p.status === 'RECYCLED').length}
              </p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">
                {pickups.reduce((sum, p) => sum + (p.totalWeight || 0), 0).toFixed(1)}
              </p>
              <p className="text-sm text-muted-foreground">kg Recycled</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-eco-teal">
                {(pickups.filter(p => p.status === 'RECYCLED')
                  .reduce((sum, p) => sum + (p.totalWeight || 0), 0) * 0.5).toFixed(1)}
              </p>
              <p className="text-sm text-muted-foreground">kg CO₂ Saved</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
