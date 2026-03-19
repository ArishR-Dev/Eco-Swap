import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Package,
  Recycle,
  FileCheck,
  TrendingUp,
  Leaf,
  ArrowRight,
  CheckCircle,
  Clock,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { CountUp } from '@/components/animations';
import { containerVariants, itemVariants } from '@/lib/motion';
import recyclerService from '@/services/recyclerService';
import { PickupRequest } from '@/types';

export default function RecyclerDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_weight: 0,
    pickups_handled: 0,
    items_processed: 0,
    certificates: 0,
  });
  const [incomingItems, setIncomingItems] = useState<PickupRequest[]>([]);
  const [processingItems, setProcessingItems] = useState<PickupRequest[]>([]);
  const [completedItems, setCompletedItems] = useState<PickupRequest[]>([]);
  const [reviews, setReviews] = useState<Array<{
    rating: number;
    feedback: string;
    user: string;
    created_at: string;
  }>>([]);
  const [weeklyData, setWeeklyData] = useState<Array<{ name: string; weight: number }>>([]);

  useEffect(() => {
    if (!user?.id) return;
    loadDashboardData();
  }, [user?.id]);

  const loadDashboardData = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [statsData, incomingData, processingData, completedData, reviewsData] = await Promise.all([
        recyclerService.getStats(user.id),
        recyclerService.getIncomingItems(user.id),
        recyclerService.getProcessingItems(user.id),
        recyclerService.getCompletedItems(user.id),
        recyclerService.getReviews(user.id),
      ]);

      setStats({
        total_weight: statsData?.total_weight ?? 0,
        pickups_handled: statsData?.pickups_handled ?? 0,
        items_processed: statsData?.items_processed ?? 0,
        certificates: statsData?.certificates ?? 0,
      });
      setIncomingItems(incomingData || []);
      setProcessingItems(processingData || []);
      setCompletedItems(completedData || []);
      setReviews(reviewsData || []);

      // Compute weekly chart from completed items (group by day of week)
      const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const weeklyMap = new Map<string, number>();
      weekDays.forEach(day => weeklyMap.set(day, 0));

      completedData?.forEach((item: PickupRequest) => {
        const createdAt = item.createdAt ?? (item as any).created_at;
        const weight = item.totalWeight ?? (item as any).total_weight ?? 0;
        if (createdAt) {
          const date = new Date(createdAt);
          const dayIndex = date.getDay();
          const dayName = weekDays[dayIndex === 0 ? 6 : dayIndex - 1];
          const current = weeklyMap.get(dayName) || 0;
          weeklyMap.set(dayName, current + weight);
        }
      });

      setWeeklyData(weekDays.map(name => ({ name, weight: weeklyMap.get(name) || 0 })));
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalProcessed = stats.total_weight;
  const co2Saved = totalProcessed * 0.5;

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
      COLLECTED: { label: 'Awaiting', variant: 'secondary' },
      HANDED_TO_RECYCLER: { label: 'Received', variant: 'default' },
      PROCESSING: { label: 'Processing', variant: 'default' },
      RECYCLED: { label: 'Completed', variant: 'outline' },
    };
    const item = config[status] || { label: status, variant: 'secondary' };
    return <Badge variant={item.variant}>{item.label}</Badge>;
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
              You have {incomingItems.length} items awaiting processing.
            </p>
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
          animate={{ opacity: 0.15, scale: 1, rotate: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute right-4 top-1/2 -translate-y-1/2"
        >
          <Recycle className="h-24 w-24" />
        </motion.div>
      </motion.div>

      {/* Stats */}
      <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-4">
        {[
          { title: 'Incoming', value: incomingItems.length, icon: Package, subtitle: 'Items to process' },
          { title: 'Processing', value: processingItems.length, icon: Clock, subtitle: 'In progress', color: 'text-amber-600' },
          { title: 'Total Recycled', value: totalProcessed, icon: Recycle, subtitle: 'Total weight', suffix: ' kg', color: 'text-emerald-600' },
          { title: 'CO₂ Saved', value: Math.round(co2Saved), icon: Leaf, subtitle: 'Environmental impact', suffix: ' kg', color: 'text-primary' },
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
                  <CountUp value={stat.value} suffix={stat.suffix} />
                </div>
                <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Chart & Incoming Items */}
      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Weekly Processing</CardTitle>
              <CardDescription>Weight processed per day (kg)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData.length > 0 ? weeklyData : [{ name: 'No data', weight: 0 }]}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '12px',
                      }}
                    />
                    <Bar dataKey="weight" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Incoming Items</CardTitle>
                <CardDescription>Items awaiting processing</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/recycler/incoming">
                  View All <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {incomingItems.length > 0 ? (
                <div className="space-y-3">
                  {incomingItems.slice(0, 4).map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.1, duration: 0.3 }}
                      whileHover={{ scale: 1.01 }}
                      className="flex items-center justify-between rounded-xl border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-primary/10 p-2">
                          <Package className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {item.address || 'Pickup'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.totalWeight ?? (item as any).total_weight ?? 0} kg • Status: {item.status}
                          </p>
                          {(item.items?.length ?? 0) > 0 && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {(item.items || []).map((i: { category?: string; quantity?: number }) => {
                                const cat = (i.category || 'OTHER').replace(/_/g, ' ');
                                const q = i.quantity ?? 1;
                                return q > 1 ? `${cat} × ${q}` : cat;
                              }).join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(item.status)}
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
                  <p className="mt-2 text-muted-foreground">No pending items</p>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Reviews & Ratings */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Customer Reviews</CardTitle>
                <CardDescription>Feedback from users</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.slice(0, 5).map((review, index) => (
                    <motion.div
                      key={review.created_at}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + index * 0.1, duration: 0.3 }}
                      className="rounded-xl border p-4 space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">⭐</span>
                          <span className="font-medium">{review.rating}/5</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{review.feedback}</p>
                      <p className="text-xs text-muted-foreground">by {review.user}</p>
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
                  <p className="mt-2 text-muted-foreground">No reviews yet</p>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-3">
        {[
          { title: 'Log Recycling', desc: 'Record processed items', icon: Recycle, href: '/recycler/log' },
          { title: 'Certificates', desc: 'Generate & manage', icon: FileCheck, href: '/recycler/certificates' },
          { title: 'Reports', desc: 'View statistics', icon: TrendingUp, href: '/recycler/reports' },
        ].map((action, index) => (
          <motion.div
            key={action.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + index * 0.1, duration: 0.4 }}
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
    </motion.div>
  );
}
