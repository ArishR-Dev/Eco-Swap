import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  MapPin,
  Clock,
  Package,
  Search,
  CheckCircle,
  Star,
} from 'lucide-react';
import collectorService from '@/services/collectorService';
import { PickupRequest } from '@/types';

export default function CollectorCompleted() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<PickupRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (user?.role !== 'COLLECTOR') {
      return;
    }
    loadTasks();
  }, [user?.id]);

  const loadTasks = async () => {
    try {
      if (import.meta.env.DEV) console.log('[Collector API] Fetching completed pickups');
      const data = await collectorService.getCompletedPickups();
      setTasks(data || []);
      if (import.meta.env.DEV) console.log('[Collector API] Loaded completed pickups');
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

  const filteredTasks = tasks.filter(task =>
    task.userName.toLowerCase().includes(search.toLowerCase()) ||
    task.address.toLowerCase().includes(search.toLowerCase())
  );

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
        <h1 className="text-2xl font-bold">Completed Pickups</h1>
        <p className="text-muted-foreground">Your completed collection history</p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search completed pickups..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Completed List */}
      <div className="space-y-4">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => (
            <Card key={task.id} className="border-l-4 border-l-success">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="rounded-full bg-success/10 p-3">
                      <CheckCircle className="h-5 w-5 text-success" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold">{task.userName}</p>
                        <Badge variant="outline" className="bg-success/10 text-success">
                          Completed
                        </Badge>
                      </div>
                      <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span className="line-clamp-1">{task.address}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {task.completedAt ? new Date(task.completedAt).toLocaleDateString() : task.scheduledDate}
                        </span>
                        <span>•</span>
                        <span>{task.totalWeight} kg</span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1">
                        {(task.items || []).map((item, idx) => (
                          <Badge key={item.id || idx} variant="secondary" className="text-xs">
                            {item.category}
                          </Badge>
                        ))}
                      </div>
                      
                      {/* Feedback */}
                      {(task as any).feedback && (
                        <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < (task as any).feedback!.rating
                                    ? 'text-warning fill-warning'
                                    : 'text-muted-foreground'
                                }`}
                              />
                            ))}
                            <span className="ml-2 text-sm font-medium">
                              {(task as any).feedback.rating}/5
                            </span>
                          </div>
                          {(task as any).feedback.comment && (
                            <p className="mt-1 text-sm text-muted-foreground">
                              "{(task as any).feedback.comment}"
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {task.recyclerName && (
                      <div className="text-sm">
                        <p className="text-muted-foreground">Handed to:</p>
                        <p className="font-medium">{task.recyclerName}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">No completed pickups yet</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
