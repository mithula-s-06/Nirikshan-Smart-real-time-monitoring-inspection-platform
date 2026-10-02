/**
 * Geospatial Utilities & Authoritative Haversine Distance Calculations
 */

const EARTH_RADIUS_METERS = 6371000; // Earth mean radius in meters

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Calculates accurate geodesic distance between two [longitude, latitude] coordinates in meters.
 * @param coord1 [longitude, latitude]
 * @param coord2 [longitude, latitude]
 * @returns Distance in meters
 */
export function calculateHaversineDistance(
  coord1: [number, number],
  coord2: [number, number],
): number {
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(EARTH_RADIUS_METERS * c);
}

/**
 * Verifies whether the inspector coordinates are strictly within the project geofence boundary.
 */
export function verifyCoordinatesWithinPerimeter(
  inspectorCoordinates: [number, number],
  projectCoordinates: [number, number],
  allowedRadiusMeters: number = 200,
): { isVerified: boolean; distanceMeters: number; allowedRadiusMeters: number } {
  const distanceMeters = calculateHaversineDistance(inspectorCoordinates, projectCoordinates);
  const isVerified = distanceMeters <= allowedRadiusMeters;

  return {
    isVerified,
    distanceMeters,
    allowedRadiusMeters,
  };
}
