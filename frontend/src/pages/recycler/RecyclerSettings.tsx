import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Settings,
  Bell,
  Clock,
  FileText,
  Moon,
  Save,
  Calendar,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function RecyclerSettings() {
  const [settings, setSettings] = useState({
    // Working Hours
    workingHoursStart: '08:00',
    workingHoursEnd: '18:00',
    workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    acceptWeekendDeliveries: false,
    
    // Notifications
    pushNotifications: true,
    emailNotifications: true,
    smsNotifications: false,
    notifyNewDelivery: true,
    notifyBatchReady: true,
    notifyAdminMessages: true,
    notifyReportGenerated: true,
    
    // Report Preferences
    autoGenerateReports: true,
    reportFrequency: 'weekly',
    reportFormat: 'pdf',
    includeCharts: true,
    
    // Display Preferences
    theme: 'system',
    language: 'en',
    weightUnit: 'kg',
  });

  const handleToggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleChange = (key: keyof typeof settings, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    toast({
      title: "Settings Saved",
      description: "Your preferences have been updated successfully.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage facility preferences and notifications</p>
        </div>
        <Button onClick={handleSave} className="gap-2">
          <Save className="h-4 w-4" />
          Save Changes
        </Button>
      </div>

      {/* Working Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Working Hours
          </CardTitle>
          <CardDescription>Set your facility's operating hours</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="workingHoursStart">Opening Time</Label>
              <Input
                id="workingHoursStart"
                type="time"
                value={settings.workingHoursStart}
                onChange={(e) => handleChange('workingHoursStart', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="workingHoursEnd">Closing Time</Label>
              <Input
                id="workingHoursEnd"
                type="time"
                value={settings.workingHoursEnd}
                onChange={(e) => handleChange('workingHoursEnd', e.target.value)}
              />
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>Accept Weekend Deliveries</Label>
              <p className="text-sm text-muted-foreground">Allow collectors to deliver on Saturdays and Sundays</p>
            </div>
            <Switch
              checked={settings.acceptWeekendDeliveries}
              onCheckedChange={() => handleToggle('acceptWeekendDeliveries')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>Choose how you want to be notified</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Channels
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">Browser notifications</p>
                </div>
                <Switch
                  checked={settings.pushNotifications}
                  onCheckedChange={() => handleToggle('pushNotifications')}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive updates via email</p>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={() => handleToggle('emailNotifications')}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>SMS Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive updates via text message</p>
                </div>
                <Switch
                  checked={settings.smsNotifications}
                  onCheckedChange={() => handleToggle('smsNotifications')}
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Alert Types
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>New Delivery Received</Label>
                  <p className="text-sm text-muted-foreground">When a collector delivers e-waste</p>
                </div>
                <Switch
                  checked={settings.notifyNewDelivery}
                  onCheckedChange={() => handleToggle('notifyNewDelivery')}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Batch Ready for Processing</Label>
                  <p className="text-sm text-muted-foreground">When a batch reaches minimum threshold</p>
                </div>
                <Switch
                  checked={settings.notifyBatchReady}
                  onCheckedChange={() => handleToggle('notifyBatchReady')}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Admin Messages</Label>
                  <p className="text-sm text-muted-foreground">Important messages from administrators</p>
                </div>
                <Switch
                  checked={settings.notifyAdminMessages}
                  onCheckedChange={() => handleToggle('notifyAdminMessages')}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Report Generated</Label>
                  <p className="text-sm text-muted-foreground">When scheduled reports are ready</p>
                </div>
                <Switch
                  checked={settings.notifyReportGenerated}
                  onCheckedChange={() => handleToggle('notifyReportGenerated')}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Report Preferences
          </CardTitle>
          <CardDescription>Configure automatic report generation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label>Auto-Generate Reports</Label>
              <p className="text-sm text-muted-foreground">Automatically create reports on schedule</p>
            </div>
            <Switch
              checked={settings.autoGenerateReports}
              onCheckedChange={() => handleToggle('autoGenerateReports')}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Report Frequency</Label>
              <Select
                value={settings.reportFrequency}
                onValueChange={(value) => handleChange('reportFrequency', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Report Format</Label>
              <Select
                value={settings.reportFormat}
                onValueChange={(value) => handleChange('reportFormat', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Include Charts</Label>
              <p className="text-sm text-muted-foreground">Add visual charts to reports</p>
            </div>
            <Switch
              checked={settings.includeCharts}
              onCheckedChange={() => handleToggle('includeCharts')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Display Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Moon className="h-5 w-5" />
            Display Preferences
          </CardTitle>
          <CardDescription>Customize your experience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Theme</Label>
              <Select
                value={settings.theme}
                onValueChange={(value) => handleChange('theme', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Language</Label>
              <Select
                value={settings.language}
                onValueChange={(value) => handleChange('language', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Weight Unit</Label>
              <Select
                value={settings.weightUnit}
                onValueChange={(value) => handleChange('weightUnit', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">Kilograms (kg)</SelectItem>
                  <SelectItem value="lb">Pounds (lb)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
