import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import {
  Package,
  Truck,
  Search,
  Scale,
  CheckCircle,
  Clock,
  User,
} from 'lucide-react';
import recyclerService from '@/services/recyclerService';
import { PickupRequest } from '@/types';

export default function RecyclerIncoming() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<PickupRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState<PickupRequest | null>(null);
  const [actualWeight, setActualWeight] = useState('');
  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadItems();
    }
  }, [user?.id]);

  const loadItems = async () => {
    if (!user?.id) return;
    try {
      const data = await recyclerService.getIncomingItems(user.id);
      setItems(data || []);
    } catch (error) {
      console.error('Failed to load items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReceive = async () => {
    if (!selectedItem) return;
    
    setProcessing(true);
    try {
      await recyclerService.receiveItem(selectedItem.id);
      toast({
        title: "Processing Started",
        description: "The item has been moved to processing.",
      });
      setReceiveDialogOpen(false);
      setSelectedItem(null);
      setActualWeight('');
      loadItems();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start processing.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const openReceiveDialog = (item: PickupRequest) => {
    setSelectedItem(item);
    setActualWeight((item.totalWeight ?? item.total_weight ?? 0).toString());
    setReceiveDialogOpen(true);
  };

  const filteredItems = items.filter(item =>
    (item.address || '').toLowerCase().includes(search.toLowerCase()) ||
    (item.id || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Incoming E-Waste</h1>
        <p className="text-muted-foreground">Items handed over by collectors awaiting processing</p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by customer or collector name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Incoming Items List */}
      <div className="space-y-4">
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <Card key={item.id} className="border-l-4 border-l-warning">
              <CardContent className="pt-6">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="rounded-full bg-warning/10 p-3">
                      <Package className="h-5 w-5 text-warning" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold">Batch #{item.id.slice(-8)}</p>
                        <Badge className="bg-warning/20 text-warning hover:bg-warning/30">
                          Awaiting Receipt
                        </Badge>
                      </div>
                      
                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span>Pickup: {item.id?.slice(-8) || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Truck className="h-3 w-3" />
                          <span>Address: {item.address || 'N/A'}</span>
                        </div>
                      </div>
                      {(item.items?.length ?? 0) > 0 && (
                        <div className="mt-2 text-sm">
                          <span className="text-muted-foreground">Products: </span>
                          <span className="font-medium">
                            {(item.items || []).map((i: { category?: string; quantity?: number }) => {
                              const cat = (i.category || 'OTHER').replace(/_/g, ' ');
                              const q = i.quantity ?? 1;
                              return q > 1 ? `${cat} × ${q}` : cat;
                            }).join(', ')}
                          </span>
                        </div>
                      )}
                      
                      <div className="mt-3 flex items-center gap-4">
                        <div className="flex items-center gap-1 text-sm">
                          <Scale className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium">{item.totalWeight ?? item.total_weight ?? 0} kg</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Button onClick={() => openReceiveDialog(item)}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Receive & Verify
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">No incoming items</p>
              <p className="text-sm text-muted-foreground">
                Items will appear here when collectors hand them over.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Receive Dialog */}
      <Dialog open={receiveDialogOpen} onOpenChange={setReceiveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Receive E-Waste Batch</DialogTitle>
            <DialogDescription>
              Verify the weight and confirm receipt of the items.
            </DialogDescription>
          </DialogHeader>
          
          {selectedItem && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="font-medium">Pickup Details:</p>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Pickup ID</span>
                    <span>{selectedItem.id}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Address</span>
                    <span>{selectedItem.address || 'N/A'}</span>
                  </div>
                  <div className="border-t pt-1 mt-2 flex justify-between font-medium">
                    <span>Total Weight</span>
                    <span>{selectedItem.totalWeight ?? selectedItem.total_weight ?? 0} kg</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setReceiveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleReceive} disabled={processing}>
              {processing ? 'Processing...' : 'Confirm Receipt'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
