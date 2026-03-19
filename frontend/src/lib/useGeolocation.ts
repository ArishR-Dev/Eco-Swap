import { useEffect, useState } from 'react';

interface GeolocationState {
  coords: { latitude: number; longitude: number } | null;
  isLoading: boolean;
  error: string | null;
}

export function useGeolocation(requestOnMount: boolean = false): GeolocationState & {
  request: () => void;
} {
  const [coords, setCoords] = useState<GeolocationState['coords']>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    setIsLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setIsLoading(false);
      },
      (err) => {
        setError(err.message || 'Failed to get current location');
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10_000,
        maximumAge: 60_000,
      },
    );
  };

  useEffect(() => {
    if (requestOnMount) {
      request();
    }
  }, [requestOnMount]);

  return { coords, isLoading, error, request };
}

