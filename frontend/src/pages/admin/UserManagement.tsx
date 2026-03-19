import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { AuthLoader } from '@/components/auth/AuthLoader';
import adminService from '@/services/adminService';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Search,
  Eye,
  Ban,
  CheckCircle,
  UserCircle,
  Mail,
  Phone,
  MapPin,
  Calendar,
} from 'lucide-react';
// Removed mock data imports - will be replaced with API calls
import { toast } from '@/hooks/use-toast';

type UserType = 'all' | 'users' | 'collectors' | 'recyclers';

interface UserViewModalProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
  onSuspend: () => void;
  onActivate: () => void;
  onDelete: () => void;
}

function UserViewModal({ user, isOpen, onClose, onSuspend, onActivate, onDelete }: UserViewModalProps) {
  if (!user) return null;

  const isSuspended = user.approvalStatus === 'SUSPENDED';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg">{user.name}</h3>
              <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                {user.role}
              </Badge>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{user.email}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{user.phone}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{user.address}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                Joined{' '}
                {user.createdAt || user.created_at
                  ? new Date(user.createdAt || user.created_at).toLocaleDateString()
                  : '—'}
              </span>
            </div>
          </div>

          {user.role === 'COLLECTOR' && (
            <div className="pt-2 border-t space-y-2">
              <p className="text-sm"><strong>Vehicle:</strong> {user.vehicleType}</p>
              <p className="text-sm"><strong>License:</strong> {user.licenseNumber}</p>
              <p className="text-sm"><strong>Total Pickups:</strong> {user.totalPickups}</p>
              <p className="text-sm"><strong>Rating:</strong> {user.rating}/5</p>
            </div>
          )}

          {user.role === 'RECYCLER' && (
            <div className="pt-2 border-t space-y-2">
              <p className="text-sm"><strong>Facility:</strong> {user.facilityName}</p>
              <p className="text-sm"><strong>Certification:</strong> {user.certification}</p>
              <p className="text-sm"><strong>Total Processed:</strong> {user.totalProcessed} kg</p>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            {isSuspended ? (
              <Button onClick={onActivate} className="flex-1">
                <CheckCircle className="h-4 w-4 mr-2" />
                Activate User
              </Button>
            ) : (
              <Button onClick={onSuspend} variant="secondary" className="flex-1">
                <Ban className="h-4 w-4 mr-2" />
                Suspend User
              </Button>
            )}
            <Button onClick={onDelete} variant="destructive" className="flex-1">
              Delete User
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function UserManagement() {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<UserType>('all');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userStatuses, setUserStatuses] = useState<Record<string, string>>({});

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const list = await adminService.getUsers();
      setUsers(list);
    } catch (err) {
      console.error('[UserManagement] failed to fetch users', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchUsers();
  }, [isAuthenticated]);

  if (authLoading) return <AuthLoader />;
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;

  const getFilteredUsers = () => {
    let list = users;
    
    if (activeTab === 'users') {
      list = users.filter(u => u.role === 'USER');
    } else if (activeTab === 'collectors') {
      list = users.filter(u => u.role === 'COLLECTOR');
    } else if (activeTab === 'recyclers') {
      list = users.filter(u => u.role === 'RECYCLER');
    }

    if (searchTerm) {
      list = list.filter(u => 
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return list;
  };

  const getStatusBadge = (user: any) => {
    const derivedStatus =
      userStatuses[user.id] ||
      (!user.isActive ? 'SUSPENDED' : user.approvalStatus || 'APPROVED');
    const status = derivedStatus.toUpperCase();

    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-200">Pending</Badge>;
      case 'SUSPENDED':
        return <Badge variant="destructive">Suspended</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge className="bg-primary/10 text-primary border-primary/20">Active</Badge>;
    }
  };

  const handleViewUser = (user: any) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleSuspend = () => {
    if (selectedUser) {
      adminService
        .suspendUser(selectedUser.id)
        .then((ok) => {
          if (ok) {
            setUserStatuses((prev) => ({ ...prev, [selectedUser.id]: 'SUSPENDED' }));
            setUsers((prev) =>
              prev.map((u) =>
                u.id === selectedUser.id ? { ...u, isActive: false } : u
              )
            );
            toast({
              title: 'User Suspended',
              description: `${selectedUser.name} has been suspended.`,
            });
          } else {
            toast({
              title: 'Suspend Failed',
              description: 'Could not suspend user.',
              variant: 'destructive',
            });
          }
        })
        .catch((err) => {
          console.error('[UserManagement] Suspend failed:', err);
          toast({
            title: 'Suspend Failed',
            description: 'Could not suspend user.',
            variant: 'destructive',
          });
        })
        .finally(() => setIsModalOpen(false));
    }
  };

  const handleActivate = () => {
    if (selectedUser) {
      adminService
        .activateUser(selectedUser.id)
        .then((ok) => {
          if (ok) {
            setUserStatuses((prev) => ({ ...prev, [selectedUser.id]: 'APPROVED' }));
            setUsers((prev) =>
              prev.map((u) =>
                u.id === selectedUser.id ? { ...u, isActive: true } : u
              )
            );
            toast({
              title: 'User Activated',
              description: `${selectedUser.name} has been activated.`,
            });
          } else {
            toast({
              title: 'Activate Failed',
              description: 'Could not activate user.',
              variant: 'destructive',
            });
          }
        })
        .catch((err) => {
          console.error('[UserManagement] Activate failed:', err);
          toast({
            title: 'Activate Failed',
            description: 'Could not activate user.',
            variant: 'destructive',
          });
        })
        .finally(() => setIsModalOpen(false));
    }
  };

  const handleDelete = () => {
    if (selectedUser) {
      const target = selectedUser;
      adminService
        .deleteUser(target.id)
        .then((ok) => {
          if (ok) {
            setUsers((prev) => prev.filter((u) => u.id !== target.id));
            setUserStatuses((prev) => {
              const copy = { ...prev };
              delete copy[target.id];
              return copy;
            });
            toast({
              title: 'User Deleted',
              description: `${target.name} and their data have been removed.`,
            });
          } else {
            toast({
              title: 'Delete Failed',
              description: 'Could not delete user.',
              variant: 'destructive',
            });
          }
        })
        .catch((err) => {
          console.error('[UserManagement] Delete failed:', err);
          toast({
            title: 'Delete Failed',
            description: 'Could not delete user.',
            variant: 'destructive',
          });
        })
        .finally(() => setIsModalOpen(false));
    }
  };

  const approveUser = async (userId: string, role: string) => {
    try {
      if (role === 'COLLECTOR') {
        await adminService.approveCollector(userId);
      } else if (role === 'RECYCLER') {
        await adminService.approveRecycler(userId);
      }
      setUserStatuses(prev => ({ ...prev, [userId]: 'APPROVED' }));
      window.dispatchEvent(new Event('admin-badges-refresh'));
      toast({
        title: 'User Approved',
        description: `${role} has been approved successfully.`,
      });
      fetchUsers();
    } catch (err) {
      console.error('[UserManagement] Approval failed:', err);
      toast({
        title: 'Approval Failed',
        description: 'Could not approve user.',
        variant: 'destructive',
      });
    }
  };

  const filteredUsers = getFilteredUsers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">User Management</h1>
        <p className="text-muted-foreground">Manage all users, collectors, and recyclers</p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '—' : users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Collectors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '—' : users.filter(u => u.role === 'COLLECTOR').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Recyclers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '—' : users.filter(u => u.role === 'RECYCLER').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Approval</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{loading ? '—' : users.filter(u => u.approvalStatus === 'PENDING').length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle>All Users</CardTitle>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as UserType)}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All ({users.length})</TabsTrigger>
              <TabsTrigger value="users">Users ({users.filter(u => u.role === 'USER').length})</TabsTrigger>
              <TabsTrigger value="collectors">Collectors ({users.filter(u => u.role === 'COLLECTOR').length})</TabsTrigger>
              <TabsTrigger value="recyclers">Recyclers ({users.filter(u => u.role === 'RECYCLER').length})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-0">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
  {users && users.length > 0 ? (
    users.map((user) => (
      <TableRow key={user.id}>
        <TableCell>
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </TableCell>
        <TableCell>
          <Badge variant="outline">{user.role}</Badge>
        </TableCell>
        <TableCell>{getStatusBadge(user)}</TableCell>
        <TableCell className="text-muted-foreground">
          {user.createdAt || user.created_at
            ? new Date(user.createdAt || user.created_at).toLocaleDateString()
            : '—'}
        </TableCell>
        <TableCell className="text-right">
          {user.approvalStatus === 'PENDING' ? (
            <Button
              size="sm"
              onClick={() => approveUser(user.id, user.role)}
              className="gap-1"
            >
              <CheckCircle className="h-4 w-4" />
              Approve
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleViewUser(user)}
              className="gap-1"
            >
              <Eye className="h-4 w-4" />
              View
            </Button>
          )}
        </TableCell>
      </TableRow>
    ))
  ) : (
    <TableRow>
      <TableCell colSpan={5} className="text-center">
        No users found
      </TableCell>
    </TableRow>
  )}
</TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <UserViewModal
        user={selectedUser}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuspend={handleSuspend}
        onActivate={handleActivate}
        onDelete={handleDelete}
      />
    </div>
  );
}
