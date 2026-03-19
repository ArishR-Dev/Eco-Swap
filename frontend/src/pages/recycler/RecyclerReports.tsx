import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart3,
  Download,
  Scale,
  Leaf,
  Recycle,
  FileCheck,
  TrendingUp,
  Package,
} from 'lucide-react';
import recyclerService from '@/services/recyclerService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { RecyclingCertificate } from '@/types';

interface RecyclerStats {
  total_weight: number;
  pickups_handled: number;
  items_processed: number;
  certificates: number;
  materialBreakdown?: { type: string; weight: number }[];
}

const COLORS = ['#4ade80', '#60a5fa', '#a78bfa', '#fbbf24', '#f87171', '#94a3b8'];

const DEFAULT_STATS: RecyclerStats = {
  total_weight: 0,
  pickups_handled: 0,
  items_processed: 0,
  certificates: 0,
  materialBreakdown: [],
};

export default function RecyclerReports() {
  const { user } = useAuth();
  const [stats, setStats] = useState<RecyclerStats>(DEFAULT_STATS);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [monthlyData, setMonthlyData] = useState<Array<{ month: string; weight: number; items: number }>>([]);
  const [certificates, setCertificates] = useState<RecyclingCertificate[]>([]);

  useEffect(() => {
    if (user?.id) {
      loadStats();
    }
  }, [user?.id]);

  const loadStats = async () => {
    if (!user?.id) return;
    try {
      const [statsData, certsData] = await Promise.all([
        recyclerService.getStats(user.id),
        recyclerService.getCertificates(user.id),
      ]);
      setStats({ ...DEFAULT_STATS, ...statsData, materialBreakdown: statsData?.materialBreakdown ?? [] });
      setCertificates(certsData || []);

      // Compute monthly data from certificates
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthlyMap = new Map<string, { weight: number; items: number }>();
      monthNames.forEach(month => monthlyMap.set(month, { weight: 0, items: 0 }));

      certsData?.forEach((cert: RecyclingCertificate) => {
        const issuedAt = cert.issuedAt ?? (cert as any).issued_at;
        const totalWeight = cert.totalWeight ?? (cert as any).total_weight ?? 0;
        if (issuedAt) {
          const date = new Date(issuedAt);
          const monthName = monthNames[date.getMonth()];
          const current = monthlyMap.get(monthName) || { weight: 0, items: 0 };
          monthlyMap.set(monthName, {
            weight: current.weight + totalWeight,
            items: current.items + 1,
          });
        }
      });

      setMonthlyData(monthNames.map(month => ({
        month,
        weight: monthlyMap.get(month)?.weight || 0,
        items: monthlyMap.get(month)?.items || 0,
      })));
    } catch (err) {
      console.error(err);
      setStats(DEFAULT_STATS);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: 'pdf' | 'excel') => {
    if (format === 'excel') {
      const rows: string[] = [
        'EcoSwap Recycler Report',
        '',
        'Summary',
        'Metric,Value',
        `Total Weight (kg),${stats.total_weight}`,
        `Batches Processed,${stats.pickups_handled}`,
        `Items Processed,${stats.items_processed}`,
        `Certificates Issued,${stats.certificates}`,
        '',
        'Monthly Recycling Trend',
        'Month,Weight (kg),Batches',
        ...monthlyData.map((r) => `${r.month},${r.weight},${r.items}`),
        '',
        'Certificates',
        'Certificate ID,Pickup ID,Weight (kg),Issued',
      ];
      certificates.forEach((c) => {
        const w = c.totalWeight ?? (c as any).total_weight ?? 0;
        const d = c.issuedAt ?? (c as any).issued_at ?? '';
        rows.push(`${c.id},${(c as any).pickup_id ?? c.pickupId ?? ''},${w},${d}`);
      });
      const csv = rows.join('\r\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recycler_report_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }
    // PDF: open printable report in new window so user can Save as PDF
    const co2Est = Math.round((stats.total_weight || 0) * 0.5);
    const html = `
<!DOCTYPE html><html><head><meta charset="utf-8"><title>Recycler Report</title>
<style>body{font-family:system-ui,sans-serif;max-width:800px;margin:2rem auto;padding:1rem;}
h1{color:#0d9488;} table{width:100%;border-collapse:collapse;} th,td{border:1px solid #ccc;padding:8px;text-align:left;}
th{background:#f1f5f9;} @media print{body{margin:1rem;}}</style></head><body>
<h1>EcoSwap Recycler Report</h1>
<p>Generated ${new Date().toLocaleDateString()}.</p>
<h2>Summary</h2>
<table><tr><th>Metric</th><th>Value</th></tr>
<tr><td>Total Weight Processed</td><td>${stats.total_weight} kg</td></tr>
<tr><td>Batches Processed</td><td>${stats.pickups_handled}</td></tr>
<tr><td>Items Processed</td><td>${stats.items_processed}</td></tr>
<tr><td>Certificates Issued</td><td>${stats.certificates}</td></tr>
<tr><td>CO₂ Impact (est.)</td><td>${co2Est} kg</td></tr></table>
<h2>Monthly Trend</h2>
<table><tr><th>Month</th><th>Weight (kg)</th><th>Batches</th></tr>
${monthlyData.map((r) => `<tr><td>${r.month}</td><td>${r.weight}</td><td>${r.items}</td></tr>`).join('')}
</table>
<h2>Certificates</h2>
<table><tr><th>Certificate ID</th><th>Pickup ID</th><th>Weight (kg)</th><th>Issued</th></tr>
${certificates.map((c) => {
  const w = c.totalWeight ?? (c as any).total_weight ?? 0;
  const d = c.issuedAt ?? (c as any).issued_at ?? '';
  const pid = (c as any).pickup_id ?? (c as any).pickupId ?? '';
  return `<tr><td>${c.id}</td><td>${pid}</td><td>${w}</td><td>${d}</td></tr>`;
}).join('')}
</table></body></html>`;
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 300);
    } else {
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const materialBreakdown = stats.materialBreakdown || [];
  const pieData = materialBreakdown.length > 0
    ? materialBreakdown.map((m) => ({
        name: m.type.replace('_', ' '),
        value: m.weight
      }))
    : (stats.total_weight > 0 ? [{ name: 'E-Waste', value: stats.total_weight }] : []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Recycling Reports</h1>
          <p className="text-muted-foreground">Analytics and environmental impact data</p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => handleExport('excel')}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Processed</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pickups_handled}</div>
            <p className="text-xs text-muted-foreground">Batches recycled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Weight Processed</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_weight} kg</div>
            <p className="text-xs text-muted-foreground">Total e-waste recycled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">CO₂ Saved</CardTitle>
            <Leaf className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{Math.round(stats.total_weight * 0.5)} kg</div>
            <p className="text-xs text-muted-foreground">Environmental impact</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Certificates</CardTitle>
            <FileCheck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.certificates}</div>
            <p className="text-xs text-muted-foreground">Issued to date</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Monthly Recycling Trend
            </CardTitle>
            <CardDescription>Weight processed over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData.length > 0 ? monthlyData : [{ month: 'No data', weight: 0, items: 0 }]}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="weight" name="Weight (kg)" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Material Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Recycle className="h-5 w-5 text-primary" />
              Material Breakdown
            </CardTitle>
            <CardDescription>Recovered materials by type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {(pieData || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => `${value.toFixed(1)} kg`}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              {(pieData || []).map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-1 text-xs">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span>{entry.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Environmental Impact Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Leaf className="h-5 w-5 text-success" />
            Environmental Impact Summary
          </CardTitle>
          <CardDescription>Your contribution to sustainability</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="text-center p-6 bg-success/10 rounded-lg">
              <Leaf className="mx-auto h-8 w-8 text-success mb-2" />
              <p className="text-3xl font-bold text-success">{Math.round(stats.total_weight * 0.5)}</p>
              <p className="text-sm text-muted-foreground">kg CO₂ emissions prevented</p>
            </div>
            <div className="text-center p-6 bg-primary/10 rounded-lg">
              <Recycle className="mx-auto h-8 w-8 text-primary mb-2" />
              <p className="text-3xl font-bold text-primary">{stats.total_weight}</p>
              <p className="text-sm text-muted-foreground">kg e-waste diverted from landfill</p>
            </div>
            <div className="text-center p-6 bg-info/10 rounded-lg">
              <Scale className="mx-auto h-8 w-8 text-info mb-2" />
              <p className="text-3xl font-bold text-info">
                {Math.round((stats.materialBreakdown || []).reduce((sum, m) => sum + m.weight, 0))}
              </p>
              <p className="text-sm text-muted-foreground">kg raw materials recovered</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Export Reports</CardTitle>
          <CardDescription>Download detailed reports for your records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button variant="outline" onClick={() => handleExport('pdf')}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF Report
            </Button>
            <Button variant="outline" onClick={() => handleExport('excel')}>
              <Download className="h-4 w-4 mr-2" />
              Download Excel Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
