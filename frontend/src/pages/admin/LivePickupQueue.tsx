import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { AuthLoader } from '@/components/auth/AuthLoader';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import {
  Search,
  RefreshCw,
  Eye,
  UserCheck,
  AlertCircle,
  Clock,
} from 'lucide-react';
import adminPickupService, { LivePickup } from '@/services/adminPickupService';
import { containerVariants, itemVariants } from '@/lib/motion';

type PickupStatus = 'REQUESTED' | 'ACCEPTED' | 'STARTED' | 'COLLECTED' | 'HANDED_TO_RECYCLER' | 'PROCESSING';

interface StatusBadgeConfig {
  color: string;
  bgColor: string;
  label: string;
}

const STATUS_BADGES: Record<PickupStatus, StatusBadgeConfig> = {
  REQUESTED: { color: 'text-warning', bgColor: 'bg-yellow-500/20', label: 'Requested' },
  ACCEPTED: { color: 'text-blue-600', bgColor: 'bg-blue-500/20', label: 'Accepted' },
  STARTED: { color: 'text-purple-600', bgColor: 'bg-purple-500/20', label: 'Started' },
  COLLECTED: { color: 'text-indigo-600', bgColor: 'bg-indigo-500/20', label: 'Collected' },
  HANDED_TO_RECYCLER: { color: 'text-orange-600', bgColor: 'bg-orange-500/20', label: 'Handed to Recycler' },
  PROCESSING: { color: 'text-teal-600', bgColor: 'bg-teal-500/20', label: 'Processing' },
};

export default function LivePickupQueue() {
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [pickups, setPickups] = useState<LivePickup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const loadPickups = async () => {
    try {
      setError(null);
      const data = await adminPickupService.getLivePickups();
      setPickups(data);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('[Live Pickup Queue] Failed to fetch pickups:', err);
      setError('Failed to load live pickups');
      if ((err as any).message?.includes('401') || (err as any).message?.includes('Unauthorized')) {
        logout();
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') return;
    loadPickups();

    // Auto-refresh every 15 seconds
    const refreshInterval = setInterval(() => {
      loadPickups();
    }, 15000);

    // Cleanup on unmount
    return () => clearInterval(refreshInterval);
  }, [isAuthenticated, user?.role]);

  if (authLoading) return <AuthLoader />;
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;

  const filteredPickups = pickups.filter((pickup) => {
    const searchLower = search.toLowerCase();
    return (
      pickup.user_name.toLowerCase().includes(searchLower) ||
      pickup.device_type.toLowerCase().includes(searchLower) ||
      pickup.address.toLowerCase().includes(searchLower) ||
      pickup.id.toLowerCase().includes(searchLower) ||
      (pickup.collector_name && pickup.collector_name.toLowerCase().includes(searchLower))
    );
  });

  const getStatusBadgeConfig = (status: string): StatusBadgeConfig => {
    return STATUS_BADGES[status as PickupStatus] || {
      color: 'text-gray-600',
      bgColor: 'bg-gray-500/20',
      label: status,
    };
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Operations Control Panel</h1>
            <p className="text-muted-foreground mt-1">Live pickup queue and logistics monitoring</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={loadPickups}
            className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Now
          </motion.button>
        </div>
        {lastRefresh && (
          <p className="text-xs text-muted-foreground mt-2">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </p>
        )}
      </motion.div>

      {/* Error State */}
      {error && (
        <motion.div
          variants={itemVariants}
          className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive flex items-start gap-3"
        >
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium">{error}</p>
            <p className="text-xs mt-1">Auto-refresh is enabled. The system will retry in 15 seconds.</p>
          </div>
        </motion.div>
      )}

      {/* Stats Cards */}
      <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Total Active', value: pickups.length, icon: Clock, color: 'text-primary' },
          { label: 'Requested', value: pickups.filter(p => p.status === 'REQUESTED').length, icon: AlertCircle, color: 'text-yellow-600' },
          { label: 'Assigned', value: pickups.filter(p => ['ACCEPTED', 'STARTED', 'COLLECTED'].includes(p.status)).length, icon: UserCheck, color: 'text-blue-600' },
          { label: 'At Recycler', value: pickups.filter(p => ['HANDED_TO_RECYCLER', 'PROCESSING'].includes(p.status)).length, icon: RefreshCw, color: 'text-teal-600' },
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + idx * 0.05 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Search and Table */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Active Pickups</CardTitle>
                <CardDescription>Showing {filteredPickups.length} of {pickups.length} pickups</CardDescription>
              </div>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search pickups..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="space-y-3 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-sm text-muted-foreground">Loading live pickups...</p>
                </div>
              </div>
            ) : filteredPickups.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">
                    {search ? 'No pickups match your search' : 'No active pickups at the moment'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">ID</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">User</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Device</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Collector</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Created</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredPickups.map((pickup, idx) => {
                      const statusConfig = getStatusBadgeConfig(pickup.status);
                      const createdDate = new Date(pickup.created_at);

                      return (
                        <motion.tr
                          key={pickup.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: idx * 0.05 }}
                          className="hover:bg-muted/50 transition-colors"
                        >
                          <td className="px-4 py-3 font-mono text-xs">{pickup.id.slice(0, 8)}</td>
                          <td className="px-4 py-3 font-medium">{pickup.user_name}</td>
                          <td className="px-4 py-3">{pickup.device_type}</td>
                          <td className="px-4 py-3">
                            <Badge className={`${statusConfig.bgColor} ${statusConfig.color} border-0`}>
                              {statusConfig.label}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            {pickup.collector_name ? (
                              <span className="text-sm font-medium">{pickup.collector_name}</span>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">Unassigned</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {createdDate.toLocaleDateString()} {createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium hover:bg-primary/10 text-primary transition-colors"
                                title="View Details"
                              >
                                <Eye className="h-3 w-3" />
                                Details
                              </motion.button>
                              {pickup.status === 'REQUESTED' && (
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium hover:bg-blue-500/10 text-blue-600 transition-colors"
                                  title="Assign Collector"
                                >
                                  <UserCheck className="h-3 w-3" />
                                  Assign
                                </motion.button>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Legend */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Status Legend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(STATUS_BADGES).map(([status, config]) => (
                <div key={status} className="flex items-center gap-2">
                  <Badge className={`${config.bgColor} ${config.color} border-0`}>
                    {config.label}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{status}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
