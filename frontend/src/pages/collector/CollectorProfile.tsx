import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Key,
  Save,
  Camera,
  Truck,
  Star,
  Package,
  Award,
  Loader2,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import authService from '@/services/authService';
import collectorService from '@/services/collectorService';
import { apiCall } from '@/services/api';

export default function CollectorProfile() {
  const { user, refreshUser, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [stats, setStats] = useState({
    totalPickups: 0,
    rating: 0,
    completedThisMonth: 0,
  });
  
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    vehicleType: '',
    licenseNumber: '',
  });

  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (user) {
        // First load from context
        setProfile({
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
          address: user.address || '',
          vehicleType: (user as any).vehicleType || '',
          licenseNumber: (user as any).licenseNumber || '',
        });
        
        // Then refresh from server to get latest data including role-specific fields
        try {
          const data = await apiCall<any>('/auth/me', { method: 'GET' });
          if (data) {
            setProfile({
              name: data.name || '',
              email: data.email || '',
              phone: data.phone || '',
              address: data.address || '',
              vehicleType: data.vehicle_type || '',
              licenseNumber: data.license_number || '',
            });
          }
        } catch (error) {
          console.error('Failed to load profile:', error);
        }
        
        loadStats();
      }
      setLoading(false);
    };
    loadProfile();
  }, [user]);

  const loadStats = async () => {
    try {
      const data = await collectorService.getStats();
      setStats({
        totalPickups: data?.totalPickups || 0,
        rating: data?.averageRating || 0,
        completedThisMonth: data?.completedThisMonth || 0,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleProfileChange = (key: keyof typeof profile, value: string) => {
    setProfile(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await authService.updateProfile({
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        address: profile.address,
        vehicle_type: profile.vehicleType,
        license_number: profile.licenseNumber,
      });
      if (refreshUser) {
        await refreshUser();
      }
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to update profile.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwords.new !== passwords.confirm) {
      toast({
        title: "Error",
        description: "New passwords do not match.",
        variant: "destructive",
      });
      return;
    }
    if (passwords.new.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters.",
        variant: "destructive",
      });
      return;
    }

    setChangingPassword(true);
    try {
      await authService.changePassword(passwords.current, passwords.new);
      toast({
        title: "Password Changed",
        description: "Your password has been changed successfully.",
      });
      setIsPasswordDialogOpen(false);
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (error: any) {
      const msg = error?.message || 'Failed to change password.';
      toast({
        title: "Error",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file",
        description: "Please upload an image file.",
        variant: "destructive",
      });
      return;
    }

    setUploadingAvatar(true);
    try {
      const result = await authService.uploadAvatar(file);
      const newAvatar = result?.avatar;

      if (newAvatar) {
        updateUser({ avatar: newAvatar } as any);
      }
      if (refreshUser) {
        await refreshUser();
      }

      toast({
        title: "Profile Photo Updated",
        description: "Your profile picture has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to upload profile picture.",
        variant: "destructive",
      });
    } finally {
      setUploadingAvatar(false);
      event.target.value = '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Please log in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
        <p className="text-muted-foreground">View and manage your collector profile</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="text-2xl">{user.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
                  onClick={handleAvatarClick}
                  disabled={uploadingAvatar}
                >
                  {uploadingAvatar ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
              <h2 className="mt-4 text-xl font-semibold">{user.name}</h2>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <div className="mt-2 flex items-center gap-2">
                <Badge className="gap-1">
                  <Truck className="h-3 w-3" />
                  Collector
                </Badge>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                  On Duty
                </Badge>
              </div>
              <Separator className="my-4" />
              <div className="w-full space-y-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{user.phone || 'Not set'}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Truck className="h-4 w-4" />
                  <span>{profile.vehicleType || 'N/A'} • {profile.licenseNumber || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{user.address || 'Not set'}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Joined {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats & Edit Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalPickups}</p>
                    <p className="text-sm text-muted-foreground">Total Pickups</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <Star className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.rating}</p>
                    <p className="text-sm text-muted-foreground">Rating</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Award className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.completedThisMonth}</p>
                    <p className="text-sm text-muted-foreground">This Month</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Edit Profile Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Edit Profile
              </CardTitle>
              <CardDescription>Update your personal and vehicle information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => handleProfileChange('name', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => handleProfileChange('email', e.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={profile.phone}
                    onChange={(e) => handleProfileChange('phone', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={profile.address}
                    onChange={(e) => handleProfileChange('address', e.target.value)}
                  />
                </div>
              </div>
              <Separator />
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="vehicleType">Vehicle Type</Label>
                  <Input
                    id="vehicleType"
                    value={profile.vehicleType}
                    onChange={(e) => handleProfileChange('vehicleType', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="licenseNumber">License Number</Label>
                  <Input
                    id="licenseNumber"
                    value={profile.licenseNumber}
                    onChange={(e) => handleProfileChange('licenseNumber', e.target.value)}
                  />
                </div>
              </div>
              <Button onClick={handleSaveProfile} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Changes
              </Button>
            </CardContent>
          </Card>

          {/* Security Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Security
              </CardTitle>
              <CardDescription>Manage your password</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div>
                  <p className="font-medium">Password</p>
                  <p className="text-sm text-muted-foreground">Change your account password</p>
                </div>
                <Button variant="outline" onClick={() => setIsPasswordDialogOpen(true)}>
                  Change Password
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Change Password Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and a new password.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                value={passwords.current}
                onChange={(e) => setPasswords(prev => ({ ...prev, current: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={passwords.new}
                onChange={(e) => setPasswords(prev => ({ ...prev, new: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={passwords.confirm}
                onChange={(e) => setPasswords(prev => ({ ...prev, confirm: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleChangePassword} disabled={changingPassword}>
              {changingPassword ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Change Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
