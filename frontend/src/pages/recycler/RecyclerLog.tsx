import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import {
  Recycle,
  Search,
  Scale,
  CheckCircle,
  Clock,
  Package,
  Plus,
  Minus,
} from 'lucide-react';
import recyclerService from '@/services/recyclerService';
import { PickupRequest, MaterialBreakdown } from '@/types';

const MATERIAL_TYPES: { type: MaterialBreakdown['type']; label: string; color: string }[] = [
  { type: 'METAL', label: 'Metal', color: 'bg-slate-500' },
  { type: 'PLASTIC', label: 'Plastic', color: 'bg-blue-500' },
  { type: 'GLASS', label: 'Glass', color: 'bg-cyan-500' },
  { type: 'CIRCUIT_BOARD', label: 'Circuit Boards', color: 'bg-green-500' },
  { type: 'BATTERY', label: 'Batteries', color: 'bg-yellow-500' },
  { type: 'OTHER', label: 'Other', color: 'bg-gray-500' },
];

export default function RecyclerLog() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [processingItems, setProcessingItems] = useState<PickupRequest[]>([]);
  const [completedItems, setCompletedItems] = useState<PickupRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState<PickupRequest | null>(null);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [materials, setMaterials] = useState<{ [key: string]: number }>({
    METAL: 0,
    PLASTIC: 0,
    GLASS: 0,
    CIRCUIT_BOARD: 0,
    BATTERY: 0,
    OTHER: 0,
  });

  useEffect(() => {
    if (user?.id) {
      loadItems();
    }
  }, [user?.id]);

  const loadItems = async () => {
    if (!user?.id) return;
    try {
      const [processingData, completedData] = await Promise.all([
        recyclerService?.getProcessingItems(user.id),
        recyclerService?.getCompletedItems(user.id)
      ]);
      setProcessingItems(Array.isArray(processingData) ? processingData : []);
      setCompletedItems(Array.isArray(completedData) ? completedData : []);
    } catch (error) {
      console.error('Failed to load items:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCompleteDialog = (item: PickupRequest) => {
    setSelectedItem(item);
    // Pre-populate with estimated breakdown (use typed field)
    const totalWeight = item.totalWeight || 0;
    setMaterials({
      METAL: Math.round(totalWeight * 0.4 * 10) / 10,
      PLASTIC: Math.round(totalWeight * 0.3 * 10) / 10,
      GLASS: Math.round(totalWeight * 0.1 * 10) / 10,
      CIRCUIT_BOARD: Math.round(totalWeight * 0.1 * 10) / 10,
      BATTERY: Math.round(totalWeight * 0.05 * 10) / 10,
      OTHER: Math.round(totalWeight * 0.05 * 10) / 10,
    });
    setCompleteDialogOpen(true);
  };

  const handleComplete = async () => {
    if (!selectedItem) return;
    
    setProcessing(true);
    try {
      await recyclerService.completeRecycling(selectedItem.id, []);
      toast({
        title: "Recycling Complete",
        description: "The item has been marked as recycled and certificate generated.",
      });
      setCompleteDialogOpen(false);
      setSelectedItem(null);
      loadItems();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to complete recycling.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const updateMaterial = (type: string, delta: number) => {
    setMaterials(prev => ({
      ...prev,
      [type]: Math.max(0, Math.round((prev[type] + delta) * 10) / 10)
    }));
  };

  const totalMaterialWeight = Object.values(materials).reduce((sum, w) => sum + w, 0);

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
        <h1 className="text-2xl font-bold">Recycling Log</h1>
        <p className="text-muted-foreground">Track and complete recycling processes</p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Processing Items */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Clock className="h-5 w-5 text-info" />
          Currently Processing ({processingItems.length})
        </h2>
        
        {Array.isArray(processingItems) && processingItems.length > 0 ? (
          processingItems.map((item) => (
            <Card key={item.id} className="border-l-4 border-l-info">
              <CardContent className="pt-6">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="rounded-full bg-info/10 p-3">
                      <Recycle className="h-5 w-5 text-info" />
                    </div>
                    <div>
                      <p className="font-semibold">Batch #{item.id?.slice(-8) || 'N/A'}</p>
                      <div className="mt-2 flex items-center gap-2 text-sm">
                        <Scale className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium">{item.totalWeight || 0} kg</span>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {item.address || 'No address'}
                      </div>
                    </div>
                  </div>
                  
                  <Button onClick={() => openCompleteDialog(item)}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Complete Recycling
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No items currently being processed</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Completed Items */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-success" />
          Recently Completed ({completedItems.length})
        </h2>
        
        {Array.isArray(completedItems) && completedItems.length > 0 ? (
          completedItems.slice(0, 5).map((item) => (
            <Card key={item.id} className="border-l-4 border-l-success">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-success/10 p-3">
                    <CheckCircle className="h-5 w-5 text-success" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">Batch #{item.id?.slice(-8) || 'N/A'}</p>
                      <Badge className="bg-success/20 text-success hover:bg-success/30">
                        Recycled
                      </Badge>
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1">
                        <Scale className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium">{item.totalWeight || 0} kg</span>
                      </span>
                      <span className="text-success">
                        ~{Math.round((item.totalWeight || 0) * 0.5)} kg CO₂ saved
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {item.address || 'No address'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No completed items yet</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Complete Recycling Dialog */}
      <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Recycling</DialogTitle>
            <DialogDescription>
              Enter the material breakdown from recycling this batch.
            </DialogDescription>
          </DialogHeader>
          
          {selectedItem && (
            <div className="space-y-4 py-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex justify-between">
                  <span>Total Weight</span>
                  <span className="font-medium">{selectedItem.totalWeight} kg</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <Label>Material Breakdown</Label>
                {MATERIAL_TYPES.map(({ type, label, color }) => (
                  <div key={type} className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${color}`} />
                    <span className="flex-1 text-sm">{label}</span>
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => updateMaterial(type, -0.5)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-16 text-center font-medium">
                        {materials[type]} kg
                      </span>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => updateMaterial(type, 0.5)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="p-3 bg-primary/10 rounded-lg">
                <div className="flex justify-between font-medium">
                  <span>Total Material Weight</span>
                  <span>{Math.round(totalMaterialWeight * 10) / 10} kg</span>
                </div>
                {Math.abs(totalMaterialWeight - (selectedItem.totalWeight || 0)) > 1 && (
                  <p className="text-xs text-warning mt-1">
                    ⚠️ Total differs from input weight by {Math.abs(totalMaterialWeight - (selectedItem.totalWeight || 0)).toFixed(1)} kg
                  </p>
                )}
              </div>
              
              <div className="p-3 bg-success/10 rounded-lg">
                <div className="flex justify-between text-success">
                  <span>Estimated CO₂ Saved</span>
                  <span className="font-medium">
                    {Math.round(totalMaterialWeight * 0.5 * 10) / 10} kg
                  </span>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleComplete} disabled={processing}>
              {processing ? 'Processing...' : 'Complete & Log'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
