import { useState, useEffect, useRef, ChangeEvent, useEffect as useReactEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Package,
  Navigation,
  Phone,
  User,
  Camera,
  FileText,
  CheckCircle,
  Truck,
  Building2,
  Upload,
  X,
} from 'lucide-react';
import collectorService from '@/services/collectorService';
import recyclerService from '@/services/recyclerService';
import { pickupService } from '@/services/pickupService';
import { PickupRequest, PickupStatus, Recycler } from '@/types';

export default function CollectorTaskDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [recyclers, setRecyclers] = useState<Recycler[]>([]);
  
  const [task, setTask] = useState<PickupRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [selectedRecycler, setSelectedRecycler] = useState('');
  const [handoverDialogOpen, setHandoverDialogOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  type ProofPhoto = { id: string; name: string; url: string };
  const [proofPhotos, setProofPhotos] = useState<ProofPhoto[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    loadTask();
  }, [id]);

  useEffect(() => {
    recyclerService.getRecyclers().then((data) => {
      if (import.meta.env.DEV) console.log('Recyclers loaded:', data);
      setRecyclers(data || []);
    }).catch((error) => {
      console.error('Failed to load recyclers:', error);
    });
  }, []);

  const loadTask = async () => {
    if (!id) return;
    try {
      const data = await pickupService.getById(id);
      if (data) {
        setTask(data);
        setNotes(data.notes || '');
      }
    } catch (error) {
      console.error('Failed to load task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: PickupStatus) => {
    if (!task) return;
    
    setUpdating(true);
    try {
      let updated: PickupRequest | null = null;
      
      switch (newStatus) {
        case 'EN_ROUTE':
          updated = await collectorService.startPickup(task.id);
          toast({
            title: "Pickup Started",
            description: "You are now en route to the pickup location.",
          });
          break;
        case 'COLLECTED':
          updated = await collectorService.markCollected(
            task.id,
            notes,
            proofPhotos.map((p) => p.name)
          );
          toast({
            title: "Items Collected",
            description: "The items have been marked as collected.",
          });
          break;
      }
      
      if (updated) {
        setTask(updated);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleAccept = async () => {
    if (!task) return;

    setUpdating(true);
    try {
      await collectorService.acceptPickup(task.id);
      await loadTask();
      toast({
        title: "Pickup Accepted",
        description: "This pickup has been assigned to you.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to accept pickup. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleHandover = async () => {
    if (!task || !selectedRecycler) return;
    
    setUpdating(true);
    try {
      const recycler = recyclers.find(r => r.id === selectedRecycler);
      if (!recycler) throw new Error('Recycler not found');
      
      const updated = await collectorService.handToRecycler(task.id, recycler.id, recycler.name);
      if (updated) {
        setTask(updated);
        setHandoverDialogOpen(false);
        toast({
          title: "Handover Complete",
          description: `Items handed to ${recycler.name}.`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to complete handover. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!task) return;
    
    try {
      await collectorService.addNotes(task.id, notes);
      toast({
        title: "Notes Saved",
        description: "Your notes have been saved.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save notes.",
        variant: "destructive",
      });
    }
  };

  const handlePhotoUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const added: ProofPhoto[] = Array.from(files).map((file) => {
      const id = `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`;
      const url = URL.createObjectURL(file);
      return { id, name: file.name, url };
    });

    setProofPhotos((prev) => [...prev, ...added]);
    toast({
      title: "Photo Uploaded",
      description: `${files.length} file${files.length > 1 ? 's' : ''} attached.`,
    });
  };

  const handleRemovePhoto = (id: string) => {
    setProofPhotos((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) {
        URL.revokeObjectURL(target.url);
      }
      return prev.filter((p) => p.id !== id);
    });
  };

  // Cleanup object URLs on unmount
  useReactEffect(() => {
    return () => {
      proofPhotos.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [proofPhotos]);

  const openGoogleMaps = (address: string, latitude?: number | null, longitude?: number | null) => {
    let url: string;
    if (latitude != null && longitude != null) {
      url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    } else {
      const clean = address.replace(/\s+/g, ' ').trim();
      const encodedAddress = encodeURIComponent(clean);
      url = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
    }
    window.open(url, '_blank');
  };

  const handleCopyPhone = (phone: string) => {
    if (!phone) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(phone)
        .then(() =>
          toast({
            title: "Phone number copied",
            description: phone,
          }),
        )
        .catch(() => {
          window.prompt('Phone number', phone);
        });
    } else {
      window.prompt('Phone number', phone);
    }
  };

  const getStatusColor = (status: PickupStatus) => {
    switch (status) {
      case 'ASSIGNED':
        return 'bg-info text-info-foreground';
      case 'EN_ROUTE':
        return 'bg-warning text-warning-foreground';
      case 'COLLECTED':
        return 'bg-success text-success-foreground';
      case 'HANDED_TO_RECYCLER':
        return 'bg-primary text-primary-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Task not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/collector/tasks')}>
          Back to Tasks
        </Button>
      </div>
    );
  }

  const canStartPickup = task.status === 'ASSIGNED';
  const canMarkCollected = task.status === 'EN_ROUTE';
  const canHandover = task.status === 'COLLECTED';
  const isCompleted = ['HANDED_TO_RECYCLER', 'PROCESSING', 'RECYCLED'].includes(task.status);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/collector/tasks')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Task Details</h1>
          <p className="text-muted-foreground">Pickup #{task.id.slice(-8)}</p>
        </div>
        <Badge className={getStatusColor(task.status)}>{task.status.replace(/_/g, ' ')}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Customer Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-muted-foreground">Name</Label>
              <p className="font-medium">{task.userName}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Phone</Label>
              <div className="flex items-center gap-2">
                <p className="font-medium">{task.userPhone}</p>
                <Button size="sm" variant="outline" onClick={() => handleCopyPhone(task.userPhone)}>
                  <Phone className="h-3 w-3 mr-1" />
                  Copy Number
                </Button>
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">Address</Label>
              <p className="font-medium">{task.address}</p>
              <Button 
                size="sm" 
                variant="outline" 
                className="mt-2"
                onClick={() => openGoogleMaps(task.address, task.latitude, task.longitude)}
              >
                <Navigation className="h-3 w-3 mr-1" />
                Open in Google Maps
              </Button>
            </div>
            <div className="flex gap-4">
              <div>
                <Label className="text-muted-foreground">Date</Label>
                <p className="font-medium">{task.scheduledDate}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Time Slot</Label>
                <p className="font-medium">{task.scheduledTimeSlot}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              E-Waste Items
            </CardTitle>
            <CardDescription>Total Weight: {task.totalWeight} kg</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {task.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">{item.category}</p>
                    {item.description && (
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{item.estimatedWeight} kg</p>
                    <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Notes & Proof */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Notes & Documentation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="notes">Collection Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this pickup..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={isCompleted}
                className="mt-1"
              />
              {!isCompleted && (
                <Button size="sm" variant="outline" className="mt-2" onClick={handleSaveNotes}>
                  Save Notes
                </Button>
              )}
            </div>
            
            <div>
              <Label>Proof Photo</Label>
              <div className="mt-2 border-2 border-dashed rounded-lg p-6 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handlePhotoFileChange}
                />
                {proofPhotos.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex flex-wrap justify-center gap-3">
                      {proofPhotos.map((photo) => (
                        <div
                          key={photo.id}
                          className="relative w-24 h-24 rounded-md overflow-hidden border bg-muted cursor-pointer"
                          onClick={() => window.open(photo.url, '_blank')}
                        >
                          <img
                            src={photo.url}
                            alt={photo.name}
                            className="w-full h-full object-cover"
                          />
                          {!isCompleted && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemovePhoto(photo.id);
                              }}
                              className="absolute right-1 top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-background/80 text-xs text-destructive shadow"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    {!isCompleted && (
                      <Button size="sm" variant="outline" onClick={handlePhotoUploadClick}>
                        <Upload className="h-3 w-3 mr-1" />
                        Add More Photos
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Camera className="mx-auto h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No photo uploaded yet</p>
                    {!isCompleted && (
                      <Button size="sm" variant="outline" onClick={handlePhotoUploadClick}>
                        <Upload className="h-3 w-3 mr-1" />
                        Upload Photos
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Actions */}
        <Card className={isCompleted ? 'border-success/40 bg-success/5' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              {isCompleted ? 'Status Summary' : 'Status Actions'}
            </CardTitle>
            <CardDescription>
              {isCompleted ? 'This pickup has been handed over to the recycler.' : 'Update the pickup status'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {task.status === 'REQUESTED' && (
              <Button
                className="w-full"
                size="lg"
                onClick={handleAccept}
                disabled={updating}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Accept Pickup
              </Button>
            )}

            {canStartPickup && (
              <Button 
                className="w-full" 
                size="lg"
                onClick={() => handleStatusUpdate('EN_ROUTE')}
                disabled={updating}
              >
                <Navigation className="h-4 w-4 mr-2" />
                Start Pickup - I'm En Route
              </Button>
            )}
            
            {canMarkCollected && (
              <Button 
                className="w-full" 
                size="lg"
                onClick={() => handleStatusUpdate('COLLECTED')}
                disabled={updating}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark as Collected
              </Button>
            )}
            
            {canHandover && (
              <Dialog open={handoverDialogOpen} onOpenChange={setHandoverDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full" size="lg">
                    <Building2 className="h-4 w-4 mr-2" />
                    Hand to Recycler
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Hand Over to Recycler</DialogTitle>
                    <DialogDescription>
                      Select the recycling facility to hand over the collected items.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <Label htmlFor="recycler">Select Recycler</Label>
                    <Select value={selectedRecycler} onValueChange={setSelectedRecycler}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Choose a recycler" />
                      </SelectTrigger>
                      <SelectContent>
                        {recyclers.map((recycler) => (
                          <SelectItem key={recycler.id} value={recycler.id}>
                            <div>
                              <p>{recycler.name}</p>
                              {recycler.email && (
                                <p className="text-xs text-muted-foreground">{recycler.email}</p>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setHandoverDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleHandover} disabled={!selectedRecycler || updating}>
                      Confirm Handover
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            
            {isCompleted && (
              <div className="text-center py-4">
                <CheckCircle className="mx-auto h-12 w-12 text-success" />
                <p className="mt-2 font-medium">Handover Complete</p>
                <p className="text-sm text-muted-foreground">
                  Handed to: {task.recyclerName}
                </p>
              </div>
            )}

            {task.priority === 'URGENT' && (
              <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                <p className="text-sm font-medium text-destructive">⚠️ Priority Pickup</p>
                <p className="text-xs text-muted-foreground">This is an urgent pickup request.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
