import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Badge } from '@/components/ui/badge';
import {
  Settings,
  Bell,
  Truck,
  Moon,
  Save,
  Power,
  MapPin,
  Clock,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function CollectorSettings() {
  const [settings, setSettings] = useState({
    // Availability
    isAvailable: true,
    autoAcceptPickups: false,
    maxDailyPickups: 10,
    
    // Notifications
    pushNotifications: true,
    emailNotifications: true,
    smsNotifications: true,
    notifyNewAssignment: true,
    notifyStatusChange: true,
    notifyAdminMessages: true,
    notifyReminders: true,
    
    // Preferences
    theme: 'system',
    language: 'en',
    distanceUnit: 'km',
    
    // Location
    shareLocation: true,
    locationUpdateFrequency: '30',
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
      description: "Your preferences have been updated successfully.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage your preferences and availability</p>
        </div>
        <Button onClick={handleSave} className="gap-2">
          <Save className="h-4 w-4" />
          Save Changes
        </Button>
      </div>

      {/* Availability Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Power className="h-5 w-5" />
            Availability
          </CardTitle>
          <CardDescription>Control your duty status and pickup preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-4">
              <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                settings.isAvailable ? 'bg-primary/10' : 'bg-muted'
              }`}>
                <Truck className={`h-6 w-6 ${settings.isAvailable ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <Label className="text-base">On Duty Status</Label>
                <p className="text-sm text-muted-foreground">
                  {settings.isAvailable 
                    ? 'You are currently available for pickups' 
                    : 'You are currently off duty'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={settings.isAvailable ? 'default' : 'secondary'}>
                {settings.isAvailable ? 'On Duty' : 'Off Duty'}
              </Badge>
              <Switch
                checked={settings.isAvailable}
                onCheckedChange={() => handleToggle('isAvailable')}
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-Accept Pickups</Label>
                <p className="text-sm text-muted-foreground">Automatically accept new assigned pickups</p>
              </div>
              <Switch
                checked={settings.autoAcceptPickups}
                onCheckedChange={() => handleToggle('autoAcceptPickups')}
              />
            </div>
            <div className="space-y-2">
              <Label>Maximum Daily Pickups</Label>
              <Select
                value={settings.maxDailyPickups.toString()}
                onValueChange={(value) => handleChange('maxDailyPickups', parseInt(value))}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 pickups</SelectItem>
                  <SelectItem value="10">10 pickups</SelectItem>
                  <SelectItem value="15">15 pickups</SelectItem>
                  <SelectItem value="20">20 pickups</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
                  <p className="text-sm text-muted-foreground">Browser and mobile notifications</p>
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
                  <Label>New Pickup Assignments</Label>
                  <p className="text-sm text-muted-foreground">When a new pickup is assigned to you</p>
                </div>
                <Switch
                  checked={settings.notifyNewAssignment}
                  onCheckedChange={() => handleToggle('notifyNewAssignment')}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Status Changes</Label>
                  <p className="text-sm text-muted-foreground">When pickup status is updated</p>
                </div>
                <Switch
                  checked={settings.notifyStatusChange}
                  onCheckedChange={() => handleToggle('notifyStatusChange')}
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
                  <Label>Pickup Reminders</Label>
                  <p className="text-sm text-muted-foreground">Reminders for upcoming pickups</p>
                </div>
                <Switch
                  checked={settings.notifyReminders}
                  onCheckedChange={() => handleToggle('notifyReminders')}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location
          </CardTitle>
          <CardDescription>Manage location sharing preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Share Location</Label>
              <p className="text-sm text-muted-foreground">Allow the system to track your location during pickups</p>
            </div>
            <Switch
              checked={settings.shareLocation}
              onCheckedChange={() => handleToggle('shareLocation')}
            />
          </div>
          <div className="space-y-2">
            <Label>Location Update Frequency</Label>
            <Select
              value={settings.locationUpdateFrequency}
              onValueChange={(value) => handleChange('locationUpdateFrequency', value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">Every 15 seconds</SelectItem>
                <SelectItem value="30">Every 30 seconds</SelectItem>
                <SelectItem value="60">Every 1 minute</SelectItem>
                <SelectItem value="120">Every 2 minutes</SelectItem>
              </SelectContent>
            </Select>
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
              <Label>Distance Unit</Label>
              <Select
                value={settings.distanceUnit}
                onValueChange={(value) => handleChange('distanceUnit', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="km">Kilometers</SelectItem>
                  <SelectItem value="mi">Miles</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
