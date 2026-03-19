import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle,
  TrendingUp,
  Star,
  Package,
  Clock,
  Award,
  Calendar,
  Scale,
} from 'lucide-react';
import collectorService from '@/services/collectorService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface PerformanceStats {
  totalPickups: number;
  completedThisWeek: number;
  completedThisMonth: number;
  averageRating: number;
  totalWeight: number;
  onTimeRate: number;
}

export default function CollectorPerformance() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [weeklyData, setWeeklyData] = useState<Array<{ day: string; pickups: number }>>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<Array<{ week: string; pickups: number }>>([]);

  useEffect(() => {
    if (user?.role !== 'COLLECTOR') {
      return;
    }
    loadStats();
  }, [user?.id]);

  const loadStats = async () => {
    try {
      if (import.meta.env.DEV) console.log('[Collector API] Fetching performance stats');
      const [statsData, completedPickups] = await Promise.all([
        collectorService.getStats(),
        collectorService.getCompletedPickups(),
      ]);
      
      setStats(statsData);
      
      // Calculate weekly data from completed pickups
      const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const weekly = weekDays.map(day => ({ day, pickups: 0 }));
      completedPickups.forEach(pickup => {
        if (pickup.scheduledDate) {
          const date = new Date(pickup.scheduledDate);
          const dayIndex = (date.getDay() + 6) % 7; // Monday = 0
          if (dayIndex >= 0 && dayIndex < 7) {
            weekly[dayIndex].pickups += 1;
          }
        }
      });
      setWeeklyData(weekly);
      
      // Calculate monthly trend (simplified - 4 weeks)
      const monthly = [
        { week: 'Week 1', pickups: Math.floor(statsData.completedThisMonth * 0.25) },
        { week: 'Week 2', pickups: Math.floor(statsData.completedThisMonth * 0.25) },
        { week: 'Week 3', pickups: Math.floor(statsData.completedThisMonth * 0.25) },
        { week: 'Week 4', pickups: statsData.completedThisMonth - Math.floor(statsData.completedThisMonth * 0.75) },
      ];
      setMonthlyTrend(monthly);
      
      if (import.meta.env.DEV) console.log('[Collector API] Performance stats loaded');
    } catch (error: any) {
      console.error('[Collector API] Failed to load stats:', error);
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        logout();
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load performance data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">My Performance</h1>
        <p className="text-muted-foreground">Track your collection performance and ratings</p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Pickups</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPickups}</div>
            <p className="text-xs text-muted-foreground">All-time completions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.completedThisWeek}</div>
            <p className="text-xs text-muted-foreground">Pickups completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Rating</CardTitle>
            <Star className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1">
              <span className="text-2xl font-bold">{stats.averageRating}</span>
              <span className="text-muted-foreground">/5</span>
            </div>
            <div className="flex items-center gap-1 mt-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${
                    i < Math.round(stats.averageRating)
                      ? 'text-warning fill-warning'
                      : 'text-muted-foreground'
                  }`}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">On-Time Rate</CardTitle>
            <Clock className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.onTimeRate}%</div>
            <Progress value={stats.onTimeRate} className="mt-2 h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Weekly Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Activity</CardTitle>
            <CardDescription>Pickups completed this week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="day" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="pickups" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Trend</CardTitle>
            <CardDescription>Pickup trend over the month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="week" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="pickups" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" />
              Weight Collected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <p className="text-4xl font-bold">{stats.totalWeight}</p>
              <p className="text-muted-foreground">kilograms total</p>
            </div>
            <div className="mt-4 p-4 bg-success/10 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Estimated CO₂ Saved</p>
              <p className="text-2xl font-bold text-success">
                {Math.round(stats.totalWeight * 0.5)} kg
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="rounded-full bg-warning/20 p-2">
                  <Star className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="font-medium">Top Rated Collector</p>
                  <p className="text-sm text-muted-foreground">Maintained 4.5+ rating</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="rounded-full bg-primary/20 p-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">100+ Pickups</p>
                  <p className="text-sm text-muted-foreground">Century milestone reached</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="rounded-full bg-success/20 p-2">
                  <Clock className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="font-medium">Punctual Performer</p>
                  <p className="text-sm text-muted-foreground">90%+ on-time rate</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
