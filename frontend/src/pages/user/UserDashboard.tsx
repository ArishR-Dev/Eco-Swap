import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { pickupService } from '@/services/pickupService';
import { userService } from '@/services/userService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import {
  Plus,
  ClipboardList,
  History,
  Leaf,
  Recycle,
  ArrowRight,
  Package,
} from 'lucide-react';
import { CountUp } from '@/components/animations';
import { containerVariants, itemVariants } from '@/lib/motion';

export default function UserDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({
    total_pickups: 0,
    pending: 0,
    completed: 0,
    certificates: 0,
  });
  const [activePickups, setActivePickups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Load stats
      const statsData = await userService.getUserStats();
      setStats(statsData);

      // Load active pickups for display
      const pickups = await pickupService.getMyPickups();
      const active = pickups.filter(
        (p: any) => p.status && !['RECYCLED', 'CANCELLED'].includes(p.status)
      );
      setActivePickups(active.slice(0, 3)); // Show only first 3
    } catch (error: any) {
      console.error('[DASHBOARD] Failed to load:', error);
      const msg = String(error?.message || error);
      if (msg.includes('401') || msg.toLowerCase().includes('unauthorized')) {
        logout();
        navigate('/login');
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  // Calculate weight from completed pickups (approximate from stats)
  const totalWeight = stats.completed * 5; // Rough estimate, backend should provide this
  const co2Saved = totalWeight * 0.5;

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
      REQUESTED: { label: 'Requested', variant: 'secondary' },
      ASSIGNED: { label: 'Assigned', variant: 'default' },
      EN_ROUTE: { label: 'En Route', variant: 'default' },
      COLLECTED: { label: 'Collected', variant: 'default' },
      RECYCLED: { label: 'Recycled', variant: 'outline' },
      CANCELLED: { label: 'Cancelled', variant: 'destructive' },
    };
    const config = variants[status] || { label: status, variant: 'secondary' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
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
            <h2 className="text-2xl font-bold">Welcome, {user?.name}!</h2>
            <p className="mt-1 opacity-90">
              Thank you for contributing to a greener planet.
            </p>
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.15, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="absolute right-4 top-1/2 -translate-y-1/2"
        >
          <Leaf className="h-24 w-24" />
        </motion.div>
      </motion.div>

      {/* Impact Stats */}
      <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-3">
        {[
          { title: 'E-Waste Recycled', value: totalWeight, icon: Recycle, suffix: ' kg' },
          { title: 'CO₂ Saved', value: co2Saved, icon: Leaf, suffix: ' kg' },
          { title: 'Total Pickups', value: stats.total_pickups, icon: Package, suffix: '', subtitle: `${stats.pending} active` },
        ].map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.1, duration: 0.4 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
          >
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  <CountUp value={stat.value} suffix={stat.suffix} />
                </div>
                <p className="text-xs text-muted-foreground">{stat.subtitle || 'Total items recycled'}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-3">
        {[
          { title: 'Schedule Pickup', desc: 'Request a new e-waste collection', icon: Plus, href: '/user/new-pickup' },
          { title: 'Track Request', desc: 'View status of your pickups', icon: ClipboardList, href: '/user/track' },
          { title: 'View History', desc: 'Past pickups & certificates', icon: History, href: '/user/history' },
        ].map((action, index) => (
          <motion.div
            key={action.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.1, duration: 0.4 }}
            whileHover={{ y: -4 }}
          >
            <Card className="cursor-pointer group h-full">
              <Link to={action.href}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <motion.div 
                      whileHover={{ scale: 1.1 }}
                      className="rounded-xl bg-primary p-2.5 text-primary-foreground"
                    >
                      <action.icon className="h-5 w-5" />
                    </motion.div>
                    <div>
                      <CardTitle className="text-lg">{action.title}</CardTitle>
                      <CardDescription>{action.desc}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Link>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Active Pickups */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Active Pickups</CardTitle>
              <CardDescription>Your ongoing pickup requests</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/user/track">
                View All <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : activePickups.length > 0 ? (
              <div className="space-y-4">
                {activePickups.map((pickup, index) => (
                  <motion.div
                    key={pickup.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1, duration: 0.3 }}
                    whileHover={{ scale: 1.01 }}
                    className="flex items-center justify-between rounded-xl border p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="rounded-full bg-primary/10 p-3">
                        <Package className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {((pickup.items || []).map((i: any) => i?.category || 'Unknown').join(', ') || 'No items')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {pickup.scheduledDate || pickup.scheduled_date || 'Date N/A'} • {pickup.scheduledTimeSlot || pickup.time_slot || 'Time N/A'}
                        </p>
                        {pickup.collectorName && (
                          <p className="text-sm text-muted-foreground">
                            Collector: {pickup.collectorName}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(pickup.status)}
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button size="sm" variant="ghost" asChild>
                          <Link to={`/user/track/${pickup.id}`}>
                            Track
                          </Link>
                        </Button>
                      </motion.div>
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
                <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-2 text-muted-foreground">No active pickups</p>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button className="mt-4" asChild>
                    <Link to="/user/new-pickup">
                      <Plus className="mr-2 h-4 w-4" />
                      Schedule Your First Pickup
                    </Link>
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
