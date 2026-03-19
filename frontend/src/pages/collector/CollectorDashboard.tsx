import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ClipboardList,
  MapPin,
  CheckCircle,
  Clock,
  Navigation,
  Phone,
  Package,
  ArrowRight,
  Truck,
} from 'lucide-react';
import { CountUp } from '@/components/animations';
import { containerVariants, itemVariants } from '@/lib/motion';
import collectorService from '@/services/collectorService';
import { PickupRequest } from '@/types';

export default function CollectorDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [pickups, setPickups] = useState<PickupRequest[]>([]);
  const [todaysPickups, setTodaysPickups] = useState<PickupRequest[]>([]);

  useEffect(() => {
    if (user?.role !== 'COLLECTOR') {
      return;
    }
    loadDashboardData();
  }, [user?.id]);

  const loadDashboardData = async () => {
    try {
      if (import.meta.env.DEV) console.log('[Collector API] Fetching dashboard data');
      const [allPickups, todayPickups] = await Promise.all([
        collectorService.getPickups(),
        collectorService.getTodaysPickups(),
      ]);
      
      setPickups(allPickups || []);
      setTodaysPickups(todayPickups || []);
      if (import.meta.env.DEV) console.log('[Collector API] Dashboard data loaded');
    } catch (error: any) {
      console.error('[Collector API] Failed to load dashboard:', error);
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        logout();
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  // Filter active pickups (not completed/cancelled)
  const assignedPickups = pickups.filter(p => 
    !['RECYCLED', 'CANCELLED'].includes(p.status)
  );

  // Count completed today
  const today = new Date().toISOString().split('T')[0];
  const completedToday = pickups.filter(p => 
    p.status === 'COLLECTED' && p.scheduledDate === today
  ).length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ASSIGNED':
        return 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800';
      case 'EN_ROUTE':
        return 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800';
      case 'COLLECTED':
        return 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800';
      default:
        return 'bg-muted';
    }
  };

  const getPriorityBadge = (priority: string) => {
    if (priority === 'URGENT') {
      return <Badge variant="destructive">Urgent</Badge>;
    }
    return <Badge variant="outline">Normal</Badge>;
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Welcome Banner */}
      <motion.div
        variants={itemVariants}
        className="rounded-2xl gradient-primary p-6 text-primary-foreground overflow-hidden relative"
      >
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Hello, {user?.name}!</h2>
            <p className="mt-1 opacity-90">
              You have {todaysPickups.length} pickups scheduled today.
            </p>
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.15, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="absolute right-4 top-1/2 -translate-y-1/2"
        >
          <Truck className="h-24 w-24" />
        </motion.div>
      </motion.div>

      {/* Stats */}
      <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-4">
        {[
          { title: "Today's Tasks", value: todaysPickups.length, icon: ClipboardList, subtitle: 'Scheduled pickups' },
          { title: 'Completed', value: completedToday, icon: CheckCircle, subtitle: 'Finished today', color: 'text-emerald-600' },
          { title: 'Pending', value: assignedPickups.filter(p => p.status === 'REQUESTED' || p.status === 'ASSIGNED').length, icon: Clock, subtitle: 'Awaiting pickup', color: 'text-amber-600' },
          { title: 'En Route', value: assignedPickups.filter(p => p.status === 'EN_ROUTE').length, icon: Navigation, subtitle: 'Currently traveling', color: 'text-blue-600' },
        ].map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.1, duration: 0.4 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color || 'text-muted-foreground'}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${stat.color || ''}`}>
                  <CountUp value={stat.value} />
                </div>
                <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Task List */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Assigned Tasks</CardTitle>
              <CardDescription>Your pickup schedule</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/collector/tasks">
                View All <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : assignedPickups.length > 0 ? (
              <div className="space-y-4">
                {assignedPickups.slice(0, 5).map((pickup, index) => (
                  <motion.div
                    key={pickup.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1, duration: 0.3 }}
                    whileHover={{ scale: 1.01 }}
                    className={`rounded-xl border p-4 ${getStatusColor(pickup.status)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="rounded-full bg-background p-3">
                          <Package className="h-5 w-5 text-foreground" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{pickup.userName}</p>
                            {getPriorityBadge(pickup.priority)}
                          </div>
                          <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span className="line-clamp-1">{pickup.address}</span>
                          </div>
                          <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {pickup.scheduledTimeSlot}
                            </span>
                            <span>•</span>
                            <span>{pickup.totalWeight} kg</span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {(pickup.items || []).map((item, idx) => (
                              <Badge key={item.id || idx} variant="secondary" className="text-xs">
                                {item.category}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button 
                            size="sm" 
                            variant="secondary" 
                            className="gap-1"
                            onClick={() => window.open(`tel:${pickup.userPhone || ''}`)}
                          >
                            <Phone className="h-3 w-3" />
                            Call
                          </Button>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button 
                            size="sm" 
                            className="gap-1"
                            onClick={() => {
                              const encodedAddress = encodeURIComponent(pickup.address || '');
                              window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
                            }}
                          >
                            <Navigation className="h-3 w-3" />
                            Navigate
                          </Button>
                        </motion.div>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      {pickup.status === 'ASSIGNED' && (
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                          <Button 
                            size="sm" 
                            className="w-full"
                            onClick={async () => {
                              try {
                                await collectorService.startPickup(pickup.id);
                                await loadDashboardData();
                              } catch (error) {
                                console.error('Failed to start pickup:', error);
                              }
                            }}
                          >
                            Start Pickup
                          </Button>
                        </motion.div>
                      )}
                      {pickup.status === 'EN_ROUTE' && (
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                          <Button 
                            size="sm" 
                            className="w-full"
                            onClick={async () => {
                              try {
                                await collectorService.markCollected(pickup.id);
                                await loadDashboardData();
                              } catch (error) {
                                console.error('Failed to mark collected:', error);
                              }
                            }}
                          >
                            Mark as Collected
                          </Button>
                        </motion.div>
                      )}
                      {pickup.status === 'COLLECTED' && (
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                          <Button size="sm" className="w-full" asChild>
                            <Link to={`/collector/task/${pickup.id}`}>
                              Hand to Recycler
                            </Link>
                          </Button>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8"
              >
                <CheckCircle className="mx-auto h-12 w-12 text-emerald-500/50" />
                <p className="mt-2 text-muted-foreground">All tasks completed!</p>
                <p className="text-sm text-muted-foreground">Check back later for new assignments.</p>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
