import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Package, ArrowRight, Plus } from 'lucide-react';

interface ConfirmationStepProps {
  pickupId: string;
  onViewPickup: () => void;
  onNewRequest: () => void;
}

export default function ConfirmationStep({
  pickupId,
  onViewPickup,
  onNewRequest,
}: ConfirmationStepProps) {
  return (
    <Card className="text-center">
      <CardContent className="pt-12 pb-8">
        {/* Success Animation */}
        <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-6 animate-pulse">
          <CheckCircle className="w-12 h-12 text-primary" />
        </div>

        <h2 className="text-2xl font-bold text-foreground mb-2">
          Request Submitted Successfully!
        </h2>
        
        <p className="text-muted-foreground mb-6">
          Your e-waste pickup request has been submitted and is awaiting assignment.
        </p>

        {/* Request ID */}
        <Card className="bg-muted/50 max-w-sm mx-auto mb-8">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Request ID</p>
            <p className="text-lg font-mono font-bold text-primary">{pickupId}</p>
          </CardContent>
        </Card>

        {/* What's Next Section */}
        <div className="max-w-md mx-auto mb-8">
          <h4 className="font-medium text-foreground mb-4">What happens next?</h4>
          <div className="space-y-3 text-left">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">1</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Our team will review your request and assign a collector.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">2</span>
              </div>
              <p className="text-sm text-muted-foreground">
                You'll receive a notification once a collector is assigned.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">3</span>
              </div>
              <p className="text-sm text-muted-foreground">
                The collector will arrive at your scheduled time slot.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={onViewPickup} className="gap-2">
            <Package className="w-4 h-4" />
            Track This Pickup
            <ArrowRight className="w-4 h-4" />
          </Button>
          <Button variant="outline" onClick={onNewRequest} className="gap-2">
            <Plus className="w-4 h-4" />
            New Request
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
