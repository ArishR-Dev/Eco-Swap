import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Home, Building, Crosshair } from 'lucide-react';
import { useGeolocation } from '@/lib/useGeolocation';
import { reverseGeocode } from '@/lib/reverseGeocode';

interface AddressStepProps {
  address: string;
  onAddressChange: (address: string) => void;
  userDefaultAddress?: string;
  latitude?: number | null;
  longitude?: number | null;
  onLocationChange?: (coords: { latitude: number; longitude: number } | null) => void;
}

export default function AddressStep({
  address,
  onAddressChange,
  userDefaultAddress,
  latitude,
  longitude,
  onLocationChange,
}: AddressStepProps) {
  const [useDefaultAddress, setUseDefaultAddress] = useState(address === userDefaultAddress);
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [landmark, setLandmark] = useState('');
  const [geocodingError, setGeocodingError] = useState<string | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);

  const { coords, isLoading, error, request } = useGeolocation(false);
  const isLocating = isLoading || isGeocoding;

  const handleUseDefault = (checked: boolean) => {
    setUseDefaultAddress(checked);
    if (checked && userDefaultAddress) {
      onAddressChange(userDefaultAddress);
    }
  };

  const handleAddressFieldChange = () => {
    const fullAddress = [
      streetAddress,
      landmark && `Near ${landmark}`,
      city,
      state,
      zipCode
    ].filter(Boolean).join(', ');
    
    onAddressChange(fullAddress);
  };

  const handleUseCurrentLocation = () => {
    request();
  };

  useEffect(() => {
    if (!coords) return;

    setGeocodingError(null);
    setIsGeocoding(true);

    reverseGeocode(coords.latitude, coords.longitude)
      .then((addr) => {
        if (addr) {
          setStreetAddress(addr.street);
          setCity(addr.city);
          setState(addr.state);
          setZipCode(addr.zipCode);
          setUseDefaultAddress(false);
          onAddressChange(addr.fullAddress);
        } else {
          setGeocodingError('Could not look up address. Please enter it manually.');
        }
        onLocationChange?.(coords);
      })
      .catch(() => {
        setGeocodingError('Could not look up address. Please enter it manually.');
        onLocationChange?.(coords);
      })
      .finally(() => setIsGeocoding(false));
    // We intentionally omit onLocationChange/onAddressChange from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coords]);

  return (
    <div className="space-y-6">
      {/* Use Default Address Option */}
      {userDefaultAddress && (
        <Card className={`cursor-pointer transition-all ${
          useDefaultAddress 
            ? 'border-primary bg-primary/5' 
            : 'hover:border-muted-foreground/50'
        }`}>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <Checkbox
                id="useDefault"
                checked={useDefaultAddress}
                onCheckedChange={handleUseDefault}
              />
              <div className="flex-1">
                <Label 
                  htmlFor="useDefault" 
                  className="text-base font-medium cursor-pointer flex items-center gap-2"
                >
                  <Home className="w-4 h-4 text-primary" />
                  Use My Saved Address
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {userDefaultAddress}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Or Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or enter a new address
          </span>
        </div>
      </div>

      {/* New Address Form */}
      <Card className={!useDefaultAddress ? 'border-primary' : ''}>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Building className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">New Pickup Address</span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="streetAddress">Street Address *</Label>
            <Textarea
              id="streetAddress"
              placeholder="e.g., 123 Green Street, Apartment 4B"
              value={streetAddress}
              onChange={(e) => {
                setStreetAddress(e.target.value);
                setUseDefaultAddress(false);
              }}
              onBlur={handleAddressFieldChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="landmark">Landmark (Optional)</Label>
            <Input
              id="landmark"
              placeholder="e.g., Near Central Park, Opposite Mall"
              value={landmark}
              onChange={(e) => {
                setLandmark(e.target.value);
                setUseDefaultAddress(false);
              }}
              onBlur={handleAddressFieldChange}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                placeholder="Eco City"
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  setUseDefaultAddress(false);
                }}
                onBlur={handleAddressFieldChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                placeholder="EC"
                value={state}
                onChange={(e) => {
                  setState(e.target.value);
                  setUseDefaultAddress(false);
                }}
                onBlur={handleAddressFieldChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="zipCode">ZIP Code *</Label>
            <Input
              id="zipCode"
              placeholder="12345"
              value={zipCode}
              onChange={(e) => {
                setZipCode(e.target.value);
                setUseDefaultAddress(false);
              }}
              onBlur={handleAddressFieldChange}
            />
          </div>
        </CardContent>
      </Card>

      {/* Current Address Preview */}
      {address && (
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium">Pickup Location</p>
                <p className="text-sm text-muted-foreground">{address}</p>
                {latitude != null && longitude != null && (
                  <p className="text-xs text-muted-foreground mt-1">
                    GPS: {latitude.toFixed(5)}, {longitude.toFixed(5)}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Map / Location Controls */}
      <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 p-4 bg-muted/30 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>Location options</span>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-1"
            onClick={handleUseCurrentLocation}
            disabled={isLocating}
          >
            <Crosshair className="w-3 h-3" />
            {isLoading ? 'Getting location...' : isGeocoding ? 'Looking up address...' : 'Use my current location'}
          </Button>
        </div>
        {error && (
          <p className="text-xs text-destructive">
            {error}. You can still enter the address manually.
          </p>
        )}
        {geocodingError && (
          <p className="text-xs text-destructive">
            {geocodingError}
          </p>
        )}
        {!error && !coords && (
          <p className="text-xs text-muted-foreground">
            We’ll use your current location to help the collector navigate. This is optional.
          </p>
        )}
      </div>
    </div>
  );
}
