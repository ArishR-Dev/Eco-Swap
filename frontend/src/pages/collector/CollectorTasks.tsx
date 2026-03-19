import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Clock,
  Package,
  Navigation,
  Phone,
  Search,
  Filter,
  Eye,
} from 'lucide-react';
import collectorService from '@/services/collectorService';
import { PickupRequest, PickupStatus } from '@/types';
import { useToast } from '@/components/ui/use-toast';

export default function CollectorTasks() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<PickupRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | PickupStatus>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (user?.role !== 'COLLECTOR') {
      return;
    }
    loadTasks();
  }, [user?.id]);

  const loadTasks = async () => {
    try {
      if (import.meta.env.DEV) console.log('[Collector API] Fetching pickups');
      const data = await collectorService.getPickups();
      setTasks(data || []);
      if (import.meta.env.DEV) console.log('[Collector API] Loaded pickups');
    } catch (error: any) {
      console.error('[Collector API] Failed to load tasks:', error);
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        logout();
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: PickupStatus) => {
    switch (status) {
      case 'REQUESTED':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'ASSIGNED':
        return 'bg-info/10 text-info border-info/20';
      case 'EN_ROUTE':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'COLLECTED':
        return 'bg-success/10 text-success border-success/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusBadge = (status: PickupStatus) => {
    switch (status) {
      case 'REQUESTED':
        return <Badge className="bg-yellow-500/20 text-yellow-700 hover:bg-yellow-500/30">Requested</Badge>;
      case 'ASSIGNED':
        return <Badge className="bg-info/20 text-info hover:bg-info/30">Assigned</Badge>;
      case 'EN_ROUTE':
        return <Badge className="bg-warning/20 text-warning hover:bg-warning/30">En Route</Badge>;
      case 'COLLECTED':
        return <Badge className="bg-success/20 text-success hover:bg-success/30">Collected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    if (priority === 'URGENT') {
      return <Badge variant="destructive">Urgent</Badge>;
    }
    return null;
  };

  const openGoogleMaps = (address: string, latitude?: number | null, longitude?: number | null) => {
    let url: string;
    if (latitude != null && longitude != null) {
      url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    } else {
      const clean = address.replace(/\s+/g, ' ').trim();
      const encodedAddress = encodeURIComponent(clean);
      url = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
    }
    window.open(url, '_blank');
  };

  const handleCopyPhone = (phone: string) => {
    if (!phone) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(phone)
        .then(() =>
          toast({
            title: 'Phone number copied',
            description: phone,
          }),
        )
        .catch(() => {
          window.prompt('Phone number', phone);
        });
    } else {
      window.prompt('Phone number', phone);
    }
  };

  const filteredTasks = tasks.filter(task => {
    // Hide fully completed lifecycle pickups from the active tasks list.
    // These still appear under "Completed Pickups".
    const isCompletedLifecycle = task.status === 'RECYCLED';
    if (isCompletedLifecycle) return false;

    const matchesFilter = filter === 'all' || task.status === filter;
    const matchesSearch =
      task.userName.toLowerCase().includes(search.toLowerCase()) ||
      task.address.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">My Tasks</h1>
        <p className="text-muted-foreground">Manage your assigned pickup tasks</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or address..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filter} onValueChange={(value) => setFilter(value as any)}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tasks</SelectItem>
                <SelectItem value="REQUESTED">Requested</SelectItem>
                <SelectItem value="ASSIGNED">Assigned</SelectItem>
                <SelectItem value="EN_ROUTE">En Route</SelectItem>
                <SelectItem value="COLLECTED">Collected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Task List */}
      <div className="space-y-4">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => (
            <Card key={task.id} className={`border-l-4 ${getStatusColor(task.status)}`}>
              <CardContent className="pt-6">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="rounded-full bg-primary/10 p-3">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold">{task.userName}</p>
                        {getStatusBadge(task.status)}
                        {getPriorityBadge(task.priority)}
                      </div>
                      <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span className="line-clamp-1">{task.address}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {task.scheduledDate} • {task.scheduledTimeSlot}
                        </span>
                        {task.latitude != null && task.longitude != null && (
                          <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            Precise location available
                          </span>
                        )}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1">
                        {(task.items || []).map((item, idx) => (
                          <Badge key={item.id || idx} variant="secondary" className="text-xs">
                            {item.category} ({item.estimatedWeight || 0}kg)
                          </Badge>
                        ))}
                      </div>
                      <p className="mt-2 text-sm">
                        <span className="font-medium">Total Weight:</span> {task.totalWeight} kg
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 lg:flex-col">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      onClick={() => handleCopyPhone(task.userPhone)}
                    >
                      <Phone className="h-3 w-3" />
                      Copy Number
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      onClick={() => openGoogleMaps(task.address, task.latitude, task.longitude)}
                    >
                      <Navigation className="h-3 w-3" />
                      {task.latitude != null && task.longitude != null ? 'Directions' : 'Navigate'}
                    </Button>
                    <Button size="sm" className="gap-1" asChild>
                      <Link to={`/collector/task/${task.id}`}>
                        <Eye className="h-3 w-3" />
                        View Details
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">No tasks found</p>
              <p className="text-sm text-muted-foreground">
                {filter !== 'all' ? 'Try changing your filter' : 'Check back later for new assignments'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
