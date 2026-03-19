import { Collector } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Phone, Star, Truck, MapPin } from 'lucide-react';

interface CollectorCardProps {
  collector: {
    id: string;
    name: string;
    phone: string;
    vehicleType?: string;
    rating?: number;
    avatar?: string;
  };
  eta?: string;
  showCallButton?: boolean;
}

export default function CollectorCard({ collector, eta, showCallButton = true }: CollectorCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar className="w-14 h-14">
            <AvatarImage src={collector.avatar} alt={collector.name} />
            <AvatarFallback className="bg-primary/10 text-primary text-lg">
              {collector.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-semibold text-foreground">{collector.name}</h4>
                <p className="text-sm text-muted-foreground">Assigned Collector</p>
              </div>
              {collector.rating !== undefined && collector.rating > 0 && (
                <Badge variant="outline" className="shrink-0">
                  <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
                  {collector.rating.toFixed(1)}
                </Badge>
              )}
            </div>

            <div className="mt-3 space-y-2">
              {collector.vehicleType && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Truck className="w-4 h-4" />
                  <span>{collector.vehicleType}</span>
                </div>
              )}
              
              {eta && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="text-primary font-medium">ETA: {eta}</span>
                </div>
              )}
            </div>

            {showCallButton && (
              <div className="mt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => window.open(`tel:${collector.phone}`, '_self')}
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Call Collector
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
