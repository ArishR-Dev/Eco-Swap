import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { AuthLoader } from '@/components/auth/AuthLoader';
import adminService from '@/services/adminService';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Download,
  FileSpreadsheet,
  FileText,
  Calendar as CalendarIcon,
  TrendingUp,
  Recycle,
  Leaf,
  Package,
  Users,
  Truck,
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { DateRange } from 'react-day-picker';

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(162, 63%, 60%)',
  'hsl(200, 90%, 45%)',
  'hsl(var(--muted-foreground))',
  'hsl(280, 70%, 50%)',
];

export default function Reports() {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [reportType, setReportType] = useState('overview');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  const [weeklyPickups, setWeeklyPickups] = useState<
    { name: string; day?: string; pickups: number; weight: number }[]
  >([
    { name: "Mon", pickups: 0, weight: 0 },
    { name: "Tue", pickups: 0, weight: 0 },
    { name: "Wed", pickups: 0, weight: 0 },
    { name: "Thu", pickups: 0, weight: 0 },
    { name: "Fri", pickups: 0, weight: 0 },
    { name: "Sat", pickups: 0, weight: 0 },
    { name: "Sun", pickups: 0, weight: 0 },
  ]);
  const [categoryData, setCategoryData] = useState<{ name: string; value: number }[]>([]);

  const [monthlyTrend, setMonthlyTrend] = useState([
    { month: "Jan", collected: 0 },
    { month: "Feb", collected: 0 },
    { month: "Mar", collected: 0 },
    { month: "Apr", collected: 0 },
    { month: "May", collected: 0 },
    { month: "Jun", collected: 0 },
  ]);

  const handleExport = (format: 'pdf' | 'excel') => {
    toast({
      title: `Exporting to ${format.toUpperCase()}`,
      description: "Your report is being generated...",
    });
    setTimeout(() => {
      toast({
        title: "Export Ready",
        description: `Report has been exported as ${format.toUpperCase()}.`,
      });
    }, 1500);
  };

  const loadReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminService.getReports();
      setData(res);
      if (Array.isArray(res?.weeklyPickups)) {
        setWeeklyPickups(res.weeklyPickups);
      }
      if (Array.isArray(res?.categoryData)) {
        setCategoryData(res.categoryData);
      } else {
        setCategoryData([]);
      }
      if (res?.monthlyTrend) {
        setMonthlyTrend(res.monthlyTrend);
      }
    } catch (err: any) {
      const msg = err?.message || 'Failed to load report data';
      console.error('[Reports] failed to fetch', err);
      setError(msg);
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    loadReports();
  }, [isAuthenticated]);

  if (authLoading) return <AuthLoader />;
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground">Track performance and environmental impact</p>
        </div>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <CalendarIcon className="h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, 'LLL dd')} - {format(dateRange.to, 'LLL dd, yyyy')}
                    </>
                  ) : (
                    format(dateRange.from, 'LLL dd, yyyy')
                  )
                ) : (
                  'Select dates'
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
                className={cn("pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
          <Button variant="outline" onClick={() => handleExport('excel')} className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Excel
          </Button>
          <Button variant="outline" onClick={() => handleExport('pdf')} className="gap-2">
            <FileText className="h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Pickups</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '—' : data?.summary?.total_pickups ?? '—'}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              {loading ? 'Loading...' : ''}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Weight Recycled</CardTitle>
            <Recycle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '—' : `${data?.summary?.total_weight ?? 0} kg`}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              {loading ? 'Loading...' : ''}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">CO₂ Saved</CardTitle>
            <Leaf className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '—' : `${data?.summary?.co2_saved ?? 0} kg`}
            </div>
            <p className="text-xs text-muted-foreground">
              {loading ? 'Loading...' : 'CO₂ saved'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '—' : data?.summary?.active_users ?? '—'}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              {loading ? 'Loading...' : ''}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Weekly Pickups Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Pickups</CardTitle>
            <CardDescription>Number of pickups and weight collected this week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyPickups || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Bar dataKey="pickups" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="weight" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>E-Waste by Category</CardTitle>
            <CardDescription>Distribution of collected e-waste types</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {(categoryData?.length ?? 0) > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {categoryData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
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
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Collection Trend</CardTitle>
          <CardDescription>Comparison of collected vs recycled e-waste over the past 6 months</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrend || []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
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
                  dataKey="collected" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="recycled" 
                  stroke="hsl(var(--chart-2))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--chart-2))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Collector Performance */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Collector Performance</CardTitle>
              <CardDescription>Individual collector statistics and ratings</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => handleExport('excel')}>
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(data?.collector_performance || []).length > 0 ? (
              data.collector_performance.map((collector: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Truck className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{collector.name}</p>
                    <p className="text-sm text-muted-foreground">{collector.pickups} pickups</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-right">
                    <p className="font-medium">{collector.weight} kg</p>
                    <p className="text-muted-foreground">collected</p>
                  </div>
                  <Badge variant={collector.rating >= 4.5 ? 'default' : 'secondary'}>
                    ⭐ {collector.rating || 'N/A'}
                  </Badge>
                </div>
              </div>
            ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">No collector performance data available</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
