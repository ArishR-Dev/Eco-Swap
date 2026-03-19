import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { AuthLoader } from '@/components/auth/AuthLoader';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Clock, Truck, Recycle, Mail, Phone, MapPin, CheckCircle, XCircle, Loader2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import adminService from '@/services/adminService';
import { staggerContainer, fadeInUp } from '@/components/animations';

interface Collector {
    user_id: string;
    name: string;
    email: string;
    phone?: string;
    address?: string;
    vehicleType?: string;
    licenseNumber?: string;
    createdAt?: string;
    avatar?: string;
}

interface Recycler {
    user_id: string;
    name: string;
    email: string;
    phone?: string;
    address?: string;
    facilityName?: string;
    certification?: string;
    createdAt?: string;
    avatar?: string;
}


export default function AdminApprovals() {
    const { isAuthenticated, user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const [collectors, setCollectors] = useState<Collector[]>([]);
    const [recyclers, setRecyclers] = useState<Recycler[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [approvingId, setApprovingId] = useState<string | null>(null);
    const [search, setSearch] = useState<string>('');

    const loadApprovals = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await adminService.getPendingApprovals();
            
            const addAvatar = (name: string) => 
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;

            // Map collectors
            const mappedCollectors = (data?.collectors || []).map((c: any) => ({
                user_id: c.user_id || c.id,
                name: c.name,
                email: c.email,
                phone: c.phone,
                address: c.address,
                vehicleType: c.vehicle_type || c.vehicleType,
                licenseNumber: c.license_number || c.licenseNumber,
                createdAt: c.created_at || c.createdAt,
                avatar: c.avatar || addAvatar(c.name),
            }));

            // Map recyclers
            const mappedRecyclers = (data?.recyclers || []).map((r: any) => ({
                user_id: r.user_id || r.id,
                name: r.name,
                email: r.email,
                phone: r.phone,
                address: r.address,
                facilityName: r.facility_name || r.facilityName,
                certification: r.certification,
                createdAt: r.created_at || r.createdAt,
                avatar: r.avatar || addAvatar(r.name),
            }));

            setCollectors(mappedCollectors);
            setRecyclers(mappedRecyclers);
        } catch (err) {
            console.error('[Admin] Failed to load pending approvals:', err);
            setError('Failed to load pending approvals');
            toast({
                title: 'Error',
                description: 'Failed to load pending approvals',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!user || user.role !== 'ADMIN') return;
        loadApprovals();
    }, [user]);

    const handleApproveCollector = useCallback(async (userId: string) => {
        if (!window.confirm('Are you sure you want to approve this collector?')) return;
        
        try {
            setApprovingId(userId);
            await adminService.approveCollector(userId);
            setCollectors(prev => prev.filter(c => c.user_id !== userId));
            window.dispatchEvent(new Event('admin-badges-refresh'));
            toast({ title: 'Collector approved successfully' });
        } catch (err) {
            console.error('[Admin] Failed to approve collector:', err);
            toast({
                title: 'Error',
                description: 'Failed to approve collector',
                variant: 'destructive',
            });
        } finally {
            setApprovingId(null);
        }
    }, [toast]);

    const handleApproveRecycler = useCallback(async (userId: string) => {
        if (!window.confirm('Are you sure you want to approve this recycler?')) return;
        
        try {
            setApprovingId(userId);
            await adminService.approveRecycler(userId);
            setRecyclers(prev => prev.filter(r => r.user_id !== userId));
            window.dispatchEvent(new Event('admin-badges-refresh'));
            toast({ title: 'Recycler approved successfully' });
        } catch (err) {
            console.error('[Admin] Failed to approve recycler:', err);
            toast({
                title: 'Error',
                description: 'Failed to approve recycler',
                variant: 'destructive',
            });
        } finally {
            setApprovingId(null);
        }
    }, [toast]);

    if (authLoading) return <AuthLoader />;
    if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
    if (user.role !== 'ADMIN') return <Navigate to="/" replace />;
    if (loading) return <AuthLoader />;

    const filteredCollectors = collectors.filter(c => 
        c.email?.toLowerCase().includes(search.toLowerCase()) ||
        c.name?.toLowerCase().includes(search.toLowerCase())
    );
    const filteredRecyclers = recyclers.filter(r => 
        r.email?.toLowerCase().includes(search.toLowerCase()) ||
        r.name?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="space-y-6"
        >
            {/* Header */}
            <motion.div variants={fadeInUp}>
                <h1 className="text-2xl font-bold">Pending Approvals</h1>
                <p className="text-muted-foreground">Review and approve collector and recycler registrations</p>
            </motion.div>

            {/* Error State */}
            {error && (
                <motion.div variants={fadeInUp} className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
                    <p className="text-sm">{error}</p>
                </motion.div>
            )}

            {/* Search */}
            <motion.div variants={fadeInUp} className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    placeholder="Search by name or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                />
            </motion.div>

            {/* Tabs */}
            <motion.div variants={fadeInUp}>
                    <Tabs defaultValue="collectors" className="w-full">
                        <TabsList>
                            <TabsTrigger value="collectors" className="flex items-center gap-2">
                                <Truck className="h-4 w-4" />
                                Collectors ({collectors.length})
                            </TabsTrigger>
                            <TabsTrigger value="recyclers" className="flex items-center gap-2">
                                <Recycle className="h-4 w-4" />
                                Recyclers ({recyclers.length})
                            </TabsTrigger>
                        </TabsList>

                        {/* Collectors Tab */}
                        <TabsContent value="collectors" className="mt-6">
                            {filteredCollectors.length === 0 ? (
                                <Card>
                                    <CardContent className="flex flex-col items-center justify-center py-12">
                                        <CheckCircle className="h-8 w-8 text-muted-foreground mb-4" />
                                        <p className="text-lg font-medium">No pending collectors</p>
                                        <p className="text-sm text-muted-foreground">All collectors have been approved</p>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="grid gap-4">
                                    {filteredCollectors.map((collector, index) => (
                                        <motion.div
                                            key={collector.user_id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                        >
                                            <Card className="transition-all hover:shadow-md">
                                                <CardContent className="p-6">
                                                    <div className="flex items-start justify-between gap-4">
                                                        {/* User Info */}
                                                        <div className="flex items-start gap-4 flex-1">
                                                            <Avatar className="h-12 w-12 flex-shrink-0">
                                                                <AvatarImage src={collector.avatar} />
                                                                <AvatarFallback>{collector.name?.charAt(0)}</AvatarFallback>
                                                            </Avatar>
                                                            <div className="flex-1 min-w-0">
                                                                <h3 className="font-semibold">{collector.name}</h3>
                                                                <div className="space-y-1 mt-2 text-sm text-muted-foreground">
                                                                    <div className="flex items-center gap-2">
                                                                        <Mail className="h-4 w-4" />
                                                                        <a href={`mailto:${collector.email}`} className="hover:text-primary truncate">
                                                                            {collector.email}
                                                                        </a>
                                                                    </div>
                                                                    {collector.phone && (
                                                                        <div className="flex items-center gap-2">
                                                                            <Phone className="h-4 w-4" />
                                                                            <span>{collector.phone}</span>
                                                                        </div>
                                                                    )}
                                                                    {collector.address && (
                                                                        <div className="flex items-center gap-2">
                                                                            <MapPin className="h-4 w-4" />
                                                                            <span className="truncate">{collector.address}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                {collector.vehicleType && (
                                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                                        <Badge variant="secondary">{collector.vehicleType}</Badge>
                                                                        {collector.licenseNumber && (
                                                                            <Badge variant="outline">{collector.licenseNumber}</Badge>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Actions */}
                                                        <div className="flex gap-2 flex-shrink-0">
                                                            <Button
                                                                variant="default"
                                                                size="sm"
                                                                onClick={() => handleApproveCollector(collector.user_id)}
                                                                disabled={approvingId !== null}
                                                            >
                                                                {approvingId === collector.user_id ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                                ) : (
                                                                    <CheckCircle className="h-4 w-4 mr-2" />
                                                                )}
                                                                Approve
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        {/* Recyclers Tab */}
                        <TabsContent value="recyclers" className="mt-6">
                            {filteredRecyclers.length === 0 ? (
                                <Card>
                                    <CardContent className="flex flex-col items-center justify-center py-12">
                                        <CheckCircle className="h-8 w-8 text-muted-foreground mb-4" />
                                        <p className="text-lg font-medium">No pending recyclers</p>
                                        <p className="text-sm text-muted-foreground">All recyclers have been approved</p>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="grid gap-4">
                                    {filteredRecyclers.map((recycler, index) => (
                                        <motion.div
                                            key={recycler.user_id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                        >
                                            <Card className="transition-all hover:shadow-md">
                                                <CardContent className="p-6">
                                                    <div className="flex items-start justify-between gap-4">
                                                        {/* User Info */}
                                                        <div className="flex items-start gap-4 flex-1">
                                                            <Avatar className="h-12 w-12 flex-shrink-0">
                                                                <AvatarImage src={recycler.avatar} />
                                                                <AvatarFallback>{recycler.name?.charAt(0)}</AvatarFallback>
                                                            </Avatar>
                                                            <div className="flex-1 min-w-0">
                                                                <h3 className="font-semibold">{recycler.name}</h3>
                                                                <div className="space-y-1 mt-2 text-sm text-muted-foreground">
                                                                    <div className="flex items-center gap-2">
                                                                        <Mail className="h-4 w-4" />
                                                                        <a href={`mailto:${recycler.email}`} className="hover:text-primary truncate">
                                                                            {recycler.email}
                                                                        </a>
                                                                    </div>
                                                                    {recycler.phone && (
                                                                        <div className="flex items-center gap-2">
                                                                            <Phone className="h-4 w-4" />
                                                                            <span>{recycler.phone}</span>
                                                                        </div>
                                                                    )}
                                                                    {recycler.address && (
                                                                        <div className="flex items-center gap-2">
                                                                            <MapPin className="h-4 w-4" />
                                                                            <span className="truncate">{recycler.address}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                {recycler.facilityName && (
                                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                                        <Badge variant="secondary">{recycler.facilityName}</Badge>
                                                                        {recycler.certification && (
                                                                            <Badge variant="outline">{recycler.certification}</Badge>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Actions */}
                                                        <div className="flex gap-2 flex-shrink-0">
                                                            <Button
                                                                variant="default"
                                                                size="sm"
                                                                onClick={() => handleApproveRecycler(recycler.user_id)}
                                                                disabled={approvingId !== null}
                                                            >
                                                                {approvingId === recycler.user_id ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                                ) : (
                                                                    <CheckCircle className="h-4 w-4 mr-2" />
                                                                )}
                                                                Approve
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </motion.div>
        </motion.div>
    );
}
