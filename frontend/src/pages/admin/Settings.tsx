import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Settings as SettingsIcon,
  Bell,
  Clock,
  MapPin,
  Mail,
  Shield,
  Database,
  Save,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function Settings() {
  const [settings, setSettings] = useState({
    // General
    systemName: 'E-Waste Management System',
    supportEmail: 'support@ewaste.com',
    supportPhone: '+1234567890',
    timezone: 'UTC',
    
    // Operations
    workingHoursStart: '09:00',
    workingHoursEnd: '18:00',
    workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    maxPickupsPerDay: 50,
    defaultTimeSlotDuration: 3,
    
    // Notifications
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true,
    notifyOnNewRequest: true,
    notifyOnStatusChange: true,
    notifyOnCollectorAssigned: true,
    
    // Auto-assignment
    autoAssignEnabled: false,
    priorityBasedAssignment: true,
    considerCollectorRating: true,
    maxDistanceKm: 25,
  });

  const handleToggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleChange = (key: keyof typeof settings, value: string | number) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    toast({
      title: "Settings Saved",
      description: "Your settings have been saved successfully.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">System Settings</h1>
          <p className="text-muted-foreground">Configure system preferences and operations</p>
        </div>
        <Button onClick={handleSave} className="gap-2">
          <Save className="h-4 w-4" />
          Save Changes
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general" className="gap-2">
            <SettingsIcon className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="operations" className="gap-2">
            <Clock className="h-4 w-4" />
            Operations
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="automation" className="gap-2">
            <Database className="h-4 w-4" />
            Automation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Basic system configuration and contact information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="systemName">System Name</Label>
                  <Input
                    id="systemName"
                    value={settings.systemName}
                    onChange={(e) => handleChange('systemName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select 
                    value={settings.timezone}
                    onValueChange={(value) => handleChange('timezone', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="EST">Eastern Time (EST)</SelectItem>
                      <SelectItem value="PST">Pacific Time (PST)</SelectItem>
                      <SelectItem value="IST">India Standard Time (IST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Contact Information
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="supportEmail">Support Email</Label>
                    <Input
                      id="supportEmail"
                      type="email"
                      value={settings.supportEmail}
                      onChange={(e) => handleChange('supportEmail', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supportPhone">Support Phone</Label>
                    <Input
                      id="supportPhone"
                      value={settings.supportPhone}
                      onChange={(e) => handleChange('supportPhone', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operations">
          <Card>
            <CardHeader>
              <CardTitle>Operations Settings</CardTitle>
              <CardDescription>Configure working hours and pickup limits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Working Hours
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="workingHoursStart">Start Time</Label>
                    <Input
                      id="workingHoursStart"
                      type="time"
                      value={settings.workingHoursStart}
                      onChange={(e) => handleChange('workingHoursStart', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="workingHoursEnd">End Time</Label>
                    <Input
                      id="workingHoursEnd"
                      type="time"
                      value={settings.workingHoursEnd}
                      onChange={(e) => handleChange('workingHoursEnd', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Pickup Configuration
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="maxPickupsPerDay">Max Pickups Per Day</Label>
                    <Input
                      id="maxPickupsPerDay"
                      type="number"
                      value={settings.maxPickupsPerDay}
                      onChange={(e) => handleChange('maxPickupsPerDay', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="defaultTimeSlotDuration">Time Slot Duration (hours)</Label>
                    <Select 
                      value={settings.defaultTimeSlotDuration.toString()}
                      onValueChange={(value) => handleChange('defaultTimeSlotDuration', parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 hour</SelectItem>
                        <SelectItem value="2">2 hours</SelectItem>
                        <SelectItem value="3">3 hours</SelectItem>
                        <SelectItem value="4">4 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure how and when notifications are sent</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium">Notification Channels</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Send notifications via email</p>
                    </div>
                    <Switch
                      checked={settings.emailNotifications}
                      onCheckedChange={() => handleToggle('emailNotifications')}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>SMS Notifications</Label>
                      <p className="text-sm text-muted-foreground">Send notifications via SMS</p>
                    </div>
                    <Switch
                      checked={settings.smsNotifications}
                      onCheckedChange={() => handleToggle('smsNotifications')}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">Send browser push notifications</p>
                    </div>
                    <Switch
                      checked={settings.pushNotifications}
                      onCheckedChange={() => handleToggle('pushNotifications')}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium">Notification Triggers</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>New Pickup Request</Label>
                      <p className="text-sm text-muted-foreground">Notify when a new request is created</p>
                    </div>
                    <Switch
                      checked={settings.notifyOnNewRequest}
                      onCheckedChange={() => handleToggle('notifyOnNewRequest')}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Status Changes</Label>
                      <p className="text-sm text-muted-foreground">Notify when pickup status changes</p>
                    </div>
                    <Switch
                      checked={settings.notifyOnStatusChange}
                      onCheckedChange={() => handleToggle('notifyOnStatusChange')}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Collector Assigned</Label>
                      <p className="text-sm text-muted-foreground">Notify when collector is assigned</p>
                    </div>
                    <Switch
                      checked={settings.notifyOnCollectorAssigned}
                      onCheckedChange={() => handleToggle('notifyOnCollectorAssigned')}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation">
          <Card>
            <CardHeader>
              <CardTitle>Automation Settings</CardTitle>
              <CardDescription>Configure automatic assignment and routing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Auto-Assignment</Label>
                  <p className="text-sm text-muted-foreground">Automatically assign collectors to pickup requests</p>
                </div>
                <Switch
                  checked={settings.autoAssignEnabled}
                  onCheckedChange={() => handleToggle('autoAssignEnabled')}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium">Assignment Rules</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Priority-Based Assignment</Label>
                      <p className="text-sm text-muted-foreground">Assign urgent requests first</p>
                    </div>
                    <Switch
                      checked={settings.priorityBasedAssignment}
                      onCheckedChange={() => handleToggle('priorityBasedAssignment')}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Consider Collector Rating</Label>
                      <p className="text-sm text-muted-foreground">Prefer higher-rated collectors</p>
                    </div>
                    <Switch
                      checked={settings.considerCollectorRating}
                      onCheckedChange={() => handleToggle('considerCollectorRating')}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="maxDistanceKm">Maximum Distance (km)</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Only assign collectors within this distance from pickup location
                </p>
                <Input
                  id="maxDistanceKm"
                  type="number"
                  value={settings.maxDistanceKm}
                  onChange={(e) => handleChange('maxDistanceKm', parseInt(e.target.value))}
                  className="max-w-xs"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
