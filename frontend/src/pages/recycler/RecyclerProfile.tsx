import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Building,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Key,
  Save,
  Camera,
  Recycle,
  Award,
  Scale,
  Leaf,
} from 'lucide-react';
import recyclerService from '@/services/recyclerService';
import authService from '@/services/authService';
import { Recycler } from '@/types';
import { toast } from '@/hooks/use-toast';

export default function RecyclerProfile() {
  const { user, updateUser } = useAuth();
  const [recycler, setRecycler] = useState<Recycler | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_weight: 0,
    pickups_handled: 0,
    items_processed: 0,
    certificates: 0,
  });
  
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    facilityName: '',
    certification: '',
    description: 'State-of-the-art e-waste recycling facility with ISO 14001 certification. Specializing in safe and environmentally responsible disposal of electronic waste.',
  });

  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const [profileData, statsData] = await Promise.all([
          recyclerService.getRecyclerProfile(),
          recyclerService.getStats(user.id),
        ]);

        if (!mounted) return;

        setRecycler(profileData);
        if (profileData) {
          setProfile(prev => ({
            ...prev,
            name: profileData.name || '',
            email: profileData.email || '',
            phone: profileData.phone || '',
            address: profileData.address || '',
            facilityName: profileData.facilityName || '',
            certification: profileData.certification || '',
          }));
        }

        setStats({
          total_weight: statsData?.total_weight ?? 0,
          pickups_handled: statsData?.pickups_handled ?? 0,
          items_processed: statsData?.items_processed ?? 0,
          certificates: statsData?.certificates ?? 0,
        });
      } catch (error: any) {
        if (!mounted) return;
        toast({
          title: 'Error',
          description: error?.message || 'Failed to load profile',
          variant: 'destructive',
        });
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadProfile();
    return () => {
      mounted = false;
    };
  }, [user?.id, toast]);

  const profileStats = {
    totalProcessed: stats.total_weight,
    co2Saved: stats.total_weight * 0.5,
    materialsRecovered: stats.items_processed,
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
        facility_name: profile.facilityName,
        certification: profile.certification,
      });
      toast({
        title: "Profile Updated",
        description: "Your facility profile has been updated successfully.",
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!recycler) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Facility Profile</h1>
          <p className="text-muted-foreground">Manage your recycling facility information</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">No profile found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Facility Profile</h1>
        <p className="text-muted-foreground">Manage your recycling facility information</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={recycler.avatar || user?.avatar} alt={recycler.name || user?.name} />
                  <AvatarFallback className="text-2xl">
                    {(recycler.name || user?.name || '?').charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
                  onClick={handleAvatarClick}
                  disabled={uploadingAvatar}
                >
                  {uploadingAvatar ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
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
              <h2 className="mt-4 text-xl font-semibold">{recycler.facilityName}</h2>
              <p className="text-sm text-muted-foreground">{recycler.name}</p>
              <div className="mt-2 flex items-center gap-2">
                <Badge className="gap-1">
                  <Recycle className="h-3 w-3" />
                  Recycler
                </Badge>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                  Certified
                </Badge>
              </div>
              <Separator className="my-4" />
              <div className="w-full space-y-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{recycler.email}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{recycler.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Award className="h-4 w-4" />
                  <span>{recycler.certification}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{recycler.address}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Partner since {new Date(recycler.createdAt).toLocaleDateString()}</span>
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
                    <Scale className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{profileStats.totalProcessed.toLocaleString()} kg</p>
                    <p className="text-sm text-muted-foreground">Total Processed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Leaf className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{Math.round(profileStats.co2Saved).toLocaleString()} kg</p>
                    <p className="text-sm text-muted-foreground">CO₂ Saved</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Recycle className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{profileStats.materialsRecovered.toLocaleString()} items</p>
                    <p className="text-sm text-muted-foreground">Materials Recovered</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Edit Profile Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Edit Facility Details
              </CardTitle>
              <CardDescription>Update your facility and contact information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="facilityName">Facility Name</Label>
                  <Input
                    id="facilityName"
                    value={profile.facilityName}
                    onChange={(e) => handleProfileChange('facilityName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="certification">Certification</Label>
                  <Input
                    id="certification"
                    value={profile.certification}
                    onChange={(e) => handleProfileChange('certification', e.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Contact Person</Label>
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
                  <Label htmlFor="address">Facility Address</Label>
                  <Input
                    id="address"
                    value={profile.address}
                    onChange={(e) => handleProfileChange('address', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Facility Description</Label>
                <Textarea
                  id="description"
                  value={profile.description}
                  onChange={(e) => handleProfileChange('description', e.target.value)}
                  rows={3}
                />
              </div>
              <Button onClick={handleSaveProfile} disabled={saving} className="gap-2">
                {saving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <Save className="h-4 w-4" />}
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
              <CardDescription>Manage your account password</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div>
                  <p className="font-medium">Password</p>
                  <p className="text-sm text-muted-foreground">Last changed 30 days ago</p>
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
              {changingPassword ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" /> : null}
              Change Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
