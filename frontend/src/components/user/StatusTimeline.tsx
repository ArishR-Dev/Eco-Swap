import { PickupStatus } from '@/types';
import { cn } from '@/lib/utils';
import { Check, Clock, Truck, Package, Recycle, XCircle, Users, Factory } from 'lucide-react';

interface StatusTimelineProps {
  currentStatus: PickupStatus;
  completedAt?: string;
}

const statusSteps: {
  status: PickupStatus;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}[] = [
  { 
    status: 'REQUESTED', 
    label: 'Requested', 
    icon: Clock, 
    description: 'Pickup request submitted' 
  },
  { 
    status: 'ASSIGNED', 
    label: 'Assigned', 
    icon: Users, 
    description: 'Collector assigned' 
  },
  { 
    status: 'EN_ROUTE', 
    label: 'En Route', 
    icon: Truck, 
    description: 'Collector on the way' 
  },
  { 
    status: 'COLLECTED', 
    label: 'Collected', 
    icon: Package, 
    description: 'Items collected' 
  },
  { 
    status: 'HANDED_TO_RECYCLER', 
    label: 'With Recycler', 
    icon: Factory, 
    description: 'Handed to recycling facility' 
  },
  { 
    status: 'RECYCLED', 
    label: 'Recycled', 
    icon: Recycle, 
    description: 'Successfully recycled' 
  },
];

const statusOrder: PickupStatus[] = [
  'REQUESTED',
  'ASSIGNED',
  'EN_ROUTE',
  'COLLECTED',
  'HANDED_TO_RECYCLER',
  'PROCESSING',
  'RECYCLED',
];

export default function StatusTimeline({ currentStatus, completedAt }: StatusTimelineProps) {
  const currentIndex = statusOrder.indexOf(currentStatus);
  const isCancelled = currentStatus === 'CANCELLED';

  if (isCancelled) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <XCircle className="w-8 h-8 text-destructive" />
          </div>
          <h4 className="font-medium text-destructive">Request Cancelled</h4>
          <p className="text-sm text-muted-foreground">This pickup request has been cancelled.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4">
      <div className="relative">
        {statusSteps.map((step, index) => {
          const stepIndex = statusOrder.indexOf(step.status);
          const isCompleted = stepIndex < currentIndex || currentStatus === 'RECYCLED';
          const isCurrent = step.status === currentStatus || 
            (currentStatus === 'PROCESSING' && step.status === 'HANDED_TO_RECYCLER');
          const isPending = stepIndex > currentIndex;

          const Icon = step.icon;

          return (
            <div key={step.status} className="relative flex items-start pb-8 last:pb-0">
              {/* Connector Line */}
              {index < statusSteps.length - 1 && (
                <div 
                  className={cn(
                    "absolute left-5 top-10 w-0.5 h-full -ml-px",
                    isCompleted ? "bg-primary" : "bg-muted"
                  )}
                />
              )}

              {/* Icon */}
              <div 
                className={cn(
                  "relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                  isCompleted && "bg-primary text-primary-foreground",
                  isCurrent && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                  isPending && "bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </div>

              {/* Content */}
              <div className="ml-4 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className={cn(
                    "font-medium",
                    (isCompleted || isCurrent) ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {step.label}
                  </h4>
                  {isCurrent && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      Current
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{step.description}</p>
                {isCompleted && step.status === 'RECYCLED' && completedAt && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Completed on {new Date(completedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
