import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { AuthLoader } from '@/components/auth/AuthLoader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  Truck,
  ClipboardList,
  Recycle,
  AlertCircle,
  ArrowUpRight,
  Leaf,
} from 'lucide-react';
import adminService from '@/services/adminService';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { CountUp } from '@/components/animations';
import { containerVariants, itemVariants } from '@/lib/motion';

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(162, 63%, 60%)',
  'hsl(200, 90%, 45%)',
  'hsl(var(--muted-foreground))',
  'hsl(280, 70%, 50%)',
];

interface DashboardStats {
  users: number;
  collectors: number;
  recyclers: number;
  pending_pickups: number;
  unassigned_pickups?: number;
  active_pickups: number;
  completed_pickups: number;
  certificates: number;
}

interface ReportsData {
  weeklyPickups?: { name: string; pickups: number }[];
  categoryData?: { name: string; value: number }[];
}

export default function AdminDashboard() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [reports, setReports] = useState<ReportsData | null>(null);
  const [pendingApprovals, setPendingApprovals] = useState<{ collectors: any[]; recyclers: any[] }>({ collectors: [], recyclers: [] });
  const [approvalsLoading, setApprovalsLoading] = useState(true);

  const loadDashboardStats = async () => {
    try {
      setError(null);
      const data = await adminService.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('[Admin Dashboard] Failed to fetch stats:', err);
      setError('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  const loadPendingApprovals = async () => {
    try {
      const approvals = await adminService.getPendingApprovals();
      setPendingApprovals({
        collectors: approvals.collectors || [],
        recyclers: approvals.recyclers || [],
      });
    } catch (err) {
      console.error('[Admin Dashboard] Failed to fetch pending approvals:', err);
    } finally {
      setApprovalsLoading(false);
    }
  };

  const loadReports = async () => {
    try {
      const data = await adminService.getReports();
      setReports({
        weeklyPickups: data?.weeklyPickups || [],
        categoryData: data?.categoryData || [],
      });
    } catch (err) {
      console.error('[Admin Dashboard] Failed to fetch reports:', err);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    loadDashboardStats();
    loadPendingApprovals();
    loadReports();

    // Auto-refresh every 30 seconds
    const refreshInterval = setInterval(() => {
      loadDashboardStats();
      loadPendingApprovals();
      loadReports();
    }, 30000);

    // Cleanup on unmount
    return () => clearInterval(refreshInterval);
  }, [isAuthenticated]);

  if (authLoading) return <AuthLoader />;
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;

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
            <h2 className="text-2xl font-bold">Welcome back, {user?.name}!</h2>
            <p className="mt-1 opacity-90">Here's what's happening in your e-waste management system today.</p>
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

      {/* Error State */}
      {error && (
        <motion.div
          variants={itemVariants}
          className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive"
        >
          <p className="text-sm font-medium">{error}</p>
        </motion.div>
      )}

      {/* Stats Grid */}
      <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: 'Total Users', value: stats?.users ?? 0, icon: Users, suffix: '' },
          { title: 'Collectors', value: stats?.collectors ?? 0, icon: Truck, suffix: '' },
          { title: 'Recyclers', value: stats?.recyclers ?? 0, icon: Recycle, suffix: '' },
          { title: 'Completed Pickups', value: stats?.completed_pickups ?? 0, icon: ClipboardList, suffix: '' },
        ].map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.1, duration: 0.4 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
          >
            <Card className="overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? (
                    <span className="text-muted-foreground text-lg">—</span>
                  ) : (
                    <CountUp value={stat.value} suffix={stat.suffix} />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {loading ? 'Loading...' : 'Real-time data'}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Additional Stats Row */}
      <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-3">
        {[
          { title: 'Pending Pickups', value: stats?.pending_pickups ?? 0, icon: ClipboardList, color: 'text-warning' },
          { title: 'Active Pickups', value: stats?.active_pickups ?? 0, icon: Truck, color: 'text-info' },
          { title: 'Certificates Issued', value: stats?.certificates ?? 0, icon: Recycle, color: 'text-success' },
        ].map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.1, duration: 0.4 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? (
                    <span className="text-muted-foreground text-lg">—</span>
                  ) : (
                    <CountUp value={stat.value} />
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>


      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Weekly Pickups</CardTitle>
              <CardDescription>Number of pickups completed this week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reports?.weeklyPickups || []}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '12px',
                      }}
                    />
                    <Bar dataKey="pickups" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>E-Waste by Category</CardTitle>
              <CardDescription>Distribution of collected items</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {(reports?.categoryData?.length ?? 0) > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={(reports?.categoryData || []).map((entry, i) => ({
                          ...entry,
                          color: CHART_COLORS[i % CHART_COLORS.length],
                        }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {(reports?.categoryData || []).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    No category data yet
                  </div>
                )}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {(reports?.categoryData || []).map((item, i) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                    />
                    <span className="text-sm text-muted-foreground">
                      {item.name} ({item.value}%)
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Pending Actions */}
      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Pending Approvals</CardTitle>
                <CardDescription>Collectors awaiting verification</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/admin/approvals">
                  View All <ArrowUpRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {approvalsLoading ? (
                <p className="text-center text-muted-foreground py-8">Loading approvals...</p>
              ) : (pendingApprovals.collectors.length + pendingApprovals.recyclers.length) > 0 ? (
                <div className="space-y-3">
                  {[...pendingApprovals.collectors, ...pendingApprovals.recyclers].slice(0, 5).map((item, index) => (
                    <motion.div
                      key={item.user_id || item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.1, duration: 0.3 }}
                      whileHover={{ scale: 1.01 }}
                      className="flex items-center justify-between rounded-xl border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10 text-warning">
                          <AlertCircle className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium">{item.name || 'Unknown'}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.email || 'No email'} · {item.role || 'Pending'}
                          </p>
                        </div>
                      </div>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button size="sm" asChild>
                          <Link to="/admin/approvals">Review</Link>
                        </Button>
                      </motion.div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No pending approvals
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Unassigned Pickups</CardTitle>
                <CardDescription>Requests awaiting collector assignment</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/admin/pickups">
                  View All <ArrowUpRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {(stats?.unassigned_pickups ?? 0) > 0 ? (
                <div className="space-y-3">
                  <p className="text-center text-lg font-semibold text-warning">
                    {stats.unassigned_pickups} pickup{stats.unassigned_pickups !== 1 ? 's' : ''} awaiting assignment
                  </p>
                  <p className="text-center text-sm text-muted-foreground">
                    Assign collectors from the pickups queue
                  </p>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  All pickups are assigned
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
