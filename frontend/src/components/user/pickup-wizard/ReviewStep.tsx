import { format } from 'date-fns';
import { EWasteItem, EWasteCategory, TimeSlot } from '@/types';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Package, MapPin, Calendar, Clock, AlertTriangle, FileText } from 'lucide-react';

interface ReviewStepProps {
  items: EWasteItem[];
  address: string;
  scheduledDate: Date | undefined;
  selectedTimeSlot: string;
  timeSlots: TimeSlot[];
  notes: string;
  onNotesChange: (notes: string) => void;
  priority: 'NORMAL' | 'URGENT';
  categories: { category: EWasteCategory; label: string; icon: string; avgWeight: number }[];
}

export default function ReviewStep({
  items,
  address,
  scheduledDate,
  selectedTimeSlot,
  timeSlots,
  notes,
  onNotesChange,
  priority,
  categories,
}: ReviewStepProps) {
  const totalWeight = items.reduce((sum, item) => sum + item.estimatedWeight, 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const timeSlot = timeSlots.find(s => s.id === selectedTimeSlot);

  const getCategoryLabel = (category: EWasteCategory) => {
    return categories.find(c => c.category === category)?.label || category;
  };

  // Estimated CO2 saved (rough calculation: 0.5kg CO2 per kg of e-waste recycled)
  const estimatedCO2Saved = (totalWeight * 0.5).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <Card className="bg-gradient-to-r from-primary/10 to-eco-teal/10 border-primary/20">
        <CardContent className="p-6">
          <div className="text-center mb-4">
            <h3 className="text-xl font-bold text-foreground">Request Summary</h3>
            <p className="text-muted-foreground">Please review your pickup request details</p>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold text-primary">{totalItems}</p>
              <p className="text-sm text-muted-foreground">Items</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">{totalWeight.toFixed(1)}</p>
              <p className="text-sm text-muted-foreground">kg Total</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-eco-teal">{estimatedCO2Saved}</p>
              <p className="text-sm text-muted-foreground">kg CO₂ Saved*</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" />
            E-Waste Items
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {items.map((item, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b last:border-0">
                <div>
                  <p className="font-medium">{getCategoryLabel(item.category)}</p>
                  {item.description && (
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-medium">x{item.quantity}</p>
                  <p className="text-sm text-muted-foreground">{item.estimatedWeight} kg</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Address Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            Pickup Address
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-muted-foreground">{address}</p>
        </CardContent>
      </Card>

      {/* Schedule Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            Scheduled Date & Time
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">
                {scheduledDate ? format(scheduledDate, "EEEE, MMMM do, yyyy") : 'Not selected'}
              </p>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{timeSlot ? `${timeSlot.startTime} - ${timeSlot.endTime}` : 'Not selected'}</span>
              </div>
            </div>
            {priority === 'URGENT' && (
              <Badge variant="outline" className="border-orange-500 text-orange-500">
                <AlertTriangle className="w-3 h-3 mr-1" />
                URGENT
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Additional Notes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            Additional Notes (Optional)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Textarea
            placeholder="Any special instructions for the collector? (e.g., gate code, parking instructions)"
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            className="resize-none"
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Environmental Impact Note */}
      <div className="text-center text-sm text-muted-foreground">
        <p>* Estimated environmental impact based on average recycling data.</p>
        <p className="text-primary font-medium mt-1">
          Thank you for choosing responsible e-waste disposal! 🌱
        </p>
      </div>
    </div>
  );
}
