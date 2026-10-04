/**
 * Calculates Haversine distance in meters between two lat/lon coordinates.
 */
export function haversineDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth radius in meters
  const toRad = deg => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Validates whether GPS coordinates fall within unit geofence radius.
 */
export function isWithinGeofence(unitLocation, captureGps) {
  if (!unitLocation || !captureGps) {
    return {
      valid: false,
      distance: null,
      message: "Missing GPS coordinates for location check."
    };
  }

  const { lat: unitLat, lng: unitLng, radiusMeters = 200 } = unitLocation;
  const { lat: capLat, lng: capLng, accuracy = 0 } = captureGps;

  if (typeof unitLat !== 'number' || typeof unitLng !== 'number' || typeof capLat !== 'number' || typeof capLng !== 'number') {
    return {
      valid: false,
      distance: null,
      message: "Invalid coordinate values provided."
    };
  }

  const distance = haversineDistanceMeters(unitLat, unitLng, capLat, capLng);
  // Allowance for GPS accuracy uncertainty (max 50m allowance)
  const effectiveRadius = radiusMeters + Math.min(accuracy || 0, 50);

  const valid = distance <= effectiveRadius;

  return {
    valid,
    distance: Math.round(distance),
    allowedRadius: radiusMeters,
    accuracy: accuracy || 0,
    message: valid
      ? `Within geofence (${Math.round(distance)}m from center, radius: ${radiusMeters}m)`
      : `Outside geofence (${Math.round(distance)}m away, max allowed: ${radiusMeters}m)`
  };
}
