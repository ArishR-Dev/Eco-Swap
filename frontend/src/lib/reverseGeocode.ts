/**
 * Reverse geocode lat/lng to address using OpenStreetMap Nominatim (free, no API key).
 */
export interface GeocodedAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  fullAddress: string;
}

export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<GeocodedAddress | null> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
  const res = await fetch(url, {
    headers: {
      'Accept-Language': 'en',
      'User-Agent': 'EcoSwap-Pickup/1.0',
    },
  });
  if (!res.ok) return null;

  const data = await res.json();
  const addr = data?.address;
  if (!addr) return null;

  const street =
    [addr.house_number, addr.road].filter(Boolean).join(' ') ||
    addr.street ||
    addr.pedestrian ||
    addr.footway ||
    '';
  const city =
    addr.city || addr.town || addr.village || addr.municipality || addr.county || '';
  const state = addr.state || '';
  const zipCode = addr.postcode || '';

  const parts = [
    street,
    addr.suburb || addr.neighbourhood,
    city,
    state,
    zipCode,
    addr.country,
  ].filter(Boolean);
  const fullAddress = parts.join(', ');

  return { street, city, state, zipCode, fullAddress };
}
