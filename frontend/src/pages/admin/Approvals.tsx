import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { AuthLoader } from '@/components/auth/AuthLoader';
import adminService from '@/services/adminService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  CheckCircle,
  XCircle,
  Clock,
  Truck,
  Recycle,
  Mail,
  Phone,
  MapPin,
  FileText,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

interface Collector {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  vehicle_type: string;
  license_number: string;
  approval_status: string;
  created_at: string;
  avatar?: string;
}

interface Recycler {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  facility_name: string;
  certification: string;
  approval_status: string;
  created_at: string;
  avatar?: string;
}

export default function Approvals() {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [pendingCollectors, setPendingCollectors] = useState<Collector[]>([]);
  const [pendingRecyclers, setPendingRecyclers] = useState<Recycler[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isApproving, setIsApproving] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    if (!isAuthenticated) return;
    loadPendingApprovals();
  }, [isAuthenticated]);

  if (authLoading) return <AuthLoader />;
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;

  const loadPendingApprovals = async () => {
    try {
      setLoading(true);
      setError(null);
      const approvals = await adminService.getPendingApprovals();
      
      // Add avatar URLs to collectors
      const collectorsWithAvatars = (approvals.collectors || []).map((c: any) => ({
        ...c,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.name}`,
      }));

      // Add avatar URLs to recyclers
      const recyclersWithAvatars = (approvals.recyclers || []).map((r: any) => ({
        ...r,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.name}`,
      }));

      setPendingCollectors(collectorsWithAvatars);
      setPendingRecyclers(recyclersWithAvatars);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load pending approvals';
      setError(errorMessage);
      console.error('Error loading pending approvals:', err);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (item: Collector | Recycler, type: 'collector' | 'recycler') => {
    setIsApproving(item.user_id);
    try {
      if (type === 'collector') {
        await adminService.approveCollector(item.user_id);
        setPendingCollectors(prev => prev.filter(c => c.user_id !== item.user_id));
      } else {
        await adminService.approveRecycler(item.user_id);
        setPendingRecyclers(prev => prev.filter(r => r.user_id !== item.user_id));
      }

      window.dispatchEvent(new Event('admin-badges-refresh'));
      toast({
        title: 'Approved Successfully',
        description: `${item.name} has been approved and can now access the system.`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to approve account';
      console.error('Error approving:', err);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsApproving(null);
    }
  };

  const handleRejectClick = (item: any, type: 'collector' | 'recycler') => {
    setSelectedItem({ ...item, type });
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = async () => {
    if (!selectedItem) return;
    setIsApproving(selectedItem.user_id);
    try {
      if (selectedItem.type === 'collector') {
        await adminService.rejectCollector(selectedItem.user_id);
        setPendingCollectors(prev => prev.filter(c => c.user_id !== selectedItem.user_id));
      } else {
        await adminService.rejectRecycler(selectedItem.user_id);
        setPendingRecyclers(prev => prev.filter(r => r.user_id !== selectedItem.user_id));
      }
      window.dispatchEvent(new Event('admin-badges-refresh'));
      toast({
        title: "Application Rejected",
        description: `${selectedItem.name}'s application has been rejected.`,
        variant: "destructive",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reject application';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsApproving(null);
      setRejectDialogOpen(false);
      setRejectReason('');
      setSelectedItem(null);
    }
  };

  const ApprovalCard = ({ item, type }: { item: Collector | Recycler; type: 'collector' | 'recycler' }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={item.avatar} alt={item.name} />
              <AvatarFallback>{item.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{item.name}</h3>
                <Badge variant="outline" className="gap-1">
                  {type === 'collector' ? (
                    <><Truck className="h-3 w-3" /> Collector</>
                  ) : (
                    <><Recycle className="h-3 w-3" /> Recycler</>
                  )}
                </Badge>
              </div>
              <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3" /> {item.email}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" /> {item.phone}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {item.address}
                </span>
              </div>
            </div>
          </div>
          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-200 gap-1">
            <Clock className="h-3 w-3" /> Pending
          </Badge>
        </div>

        <div className="mt-4 p-3 bg-muted/50 rounded-lg space-y-2 text-sm">
          {type === 'collector' && 'vehicle_type' in item ? (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vehicle Type:</span>
                <span className="font-medium">{item.vehicle_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">License Number:</span>
                <span className="font-medium">{item.license_number}</span>
              </div>
            </>
          ) : type === 'recycler' && 'facility_name' in item ? (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Facility Name:</span>
                <span className="font-medium">{item.facility_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Certification:</span>
                <span className="font-medium">{item.certification}</span>
              </div>
            </>
          ) : null}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Applied On:</span>
            <span className="font-medium">{new Date(item.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button 
            onClick={() => handleApprove(item, type)} 
            disabled={isApproving === item.user_id}
            className="flex-1 gap-2"
          >
            {isApproving === item.user_id ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Approving...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Approve
              </>
            )}
          </Button>
          <Button 
            variant="destructive" 
            onClick={() => handleRejectClick(item, type)}
            disabled={isApproving === item.user_id}
            className="flex-1 gap-2"
          >
            <XCircle className="h-4 w-4" />
            Reject
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const ApprovalEmptyState = ({ type }: { type: string }) => (
    <EmptyState
      icon={<CheckCircle className="h-7 w-7 text-primary" />}
      title="All Caught Up!"
      description={`No pending ${type} approvals at the moment.`}
    />
  );

  if (loading) return <AuthLoader />;

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pending Approvals</h1>
          <p className="text-muted-foreground">Review and approve collector and recycler registrations</p>
        </div>
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-destructive mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-destructive mb-1">Error Loading Approvals</h3>
                <p className="text-sm text-destructive/80">{error}</p>
              </div>
              <Button variant="outline" size="sm" onClick={loadPendingApprovals}>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Pending Approvals</h1>
        <p className="text-muted-foreground">Review and approve collector and recycler registrations</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" /> Total Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {pendingCollectors.length + pendingRecyclers.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Truck className="h-4 w-4" /> Pending Collectors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCollectors.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Recycle className="h-4 w-4" /> Pending Recyclers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRecyclers.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Approval Queue</CardTitle>
          <CardDescription>Review applications and verify credentials before approving</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">
                All ({pendingCollectors.length + pendingRecyclers.length})
              </TabsTrigger>
              <TabsTrigger value="collectors">
                Collectors ({pendingCollectors.length})
              </TabsTrigger>
              <TabsTrigger value="recyclers">
                Recyclers ({pendingRecyclers.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              {pendingCollectors.length === 0 && pendingRecyclers.length === 0 ? (
                <ApprovalEmptyState type="applications" />
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {pendingCollectors.map(collector => (
                    <ApprovalCard key={collector.user_id} item={collector} type="collector" />
                  ))}
                  {pendingRecyclers.map(recycler => (
                    <ApprovalCard key={recycler.user_id} item={recycler} type="recycler" />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="collectors">
              {pendingCollectors.length === 0 ? (
                <ApprovalEmptyState type="collector" />
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {pendingCollectors.map(collector => (
                    <ApprovalCard key={collector.user_id} item={collector} type="collector" />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="recyclers">
              {pendingRecyclers.length === 0 ? (
                <ApprovalEmptyState type="recycler" />
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {pendingRecyclers.map(recycler => (
                    <ApprovalCard key={recycler.user_id} item={recycler} type="recycler" />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Reject Application
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to reject {selectedItem?.name}'s application? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">Rejection Reason (Optional)</label>
            <Textarea
              placeholder="Provide a reason for rejection..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRejectConfirm}>
              Reject Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
