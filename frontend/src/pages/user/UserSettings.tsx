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
import {
  Settings,
  Bell,
  Mail,
  Smartphone,
  Globe,
  Moon,
  Save,
  Shield,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function UserSettings() {
  const [settings, setSettings] = useState({
    // Notifications
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true,
    pickupReminders: true,
    statusUpdates: true,
    promotionalEmails: false,
    
    // Preferences
    language: 'en',
    theme: 'system',
    dateFormat: 'MM/DD/YYYY',
    
    // Privacy
    showProfilePublicly: false,
    allowDataAnalytics: true,
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
          <p className="text-muted-foreground">Manage your preferences and notifications</p>
        </div>
        <Button onClick={handleSave} className="gap-2">
          <Save className="h-4 w-4" />
          Save Changes
        </Button>
      </div>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
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
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive updates via email</p>
                  </div>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={() => handleToggle('emailNotifications')}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label>SMS Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive updates via text message</p>
                  </div>
                </div>
                <Switch
                  checked={settings.smsNotifications}
                  onCheckedChange={() => handleToggle('smsNotifications')}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">Browser notifications</p>
                  </div>
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
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Alert Types
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Pickup Reminders</Label>
                  <p className="text-sm text-muted-foreground">Reminders before scheduled pickups</p>
                </div>
                <Switch
                  checked={settings.pickupReminders}
                  onCheckedChange={() => handleToggle('pickupReminders')}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Status Updates</Label>
                  <p className="text-sm text-muted-foreground">When pickup status changes</p>
                </div>
                <Switch
                  checked={settings.statusUpdates}
                  onCheckedChange={() => handleToggle('statusUpdates')}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Promotional Emails</Label>
                  <p className="text-sm text-muted-foreground">Tips and offers from E-Waste Management</p>
                </div>
                <Switch
                  checked={settings.promotionalEmails}
                  onCheckedChange={() => handleToggle('promotionalEmails')}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Display Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Display Preferences
          </CardTitle>
          <CardDescription>Customize your experience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
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
                  <SelectItem value="de">Deutsch</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
              <Label>Date Format</Label>
              <Select
                value={settings.dateFormat}
                onValueChange={(value) => handleChange('dateFormat', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy Settings
          </CardTitle>
          <CardDescription>Control your data and privacy</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Public Profile</Label>
              <p className="text-sm text-muted-foreground">Show your profile to other users</p>
            </div>
            <Switch
              checked={settings.showProfilePublicly}
              onCheckedChange={() => handleToggle('showProfilePublicly')}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Analytics & Improvements</Label>
              <p className="text-sm text-muted-foreground">Help us improve by sharing usage data</p>
            </div>
            <Switch
              checked={settings.allowDataAnalytics}
              onCheckedChange={() => handleToggle('allowDataAnalytics')}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
