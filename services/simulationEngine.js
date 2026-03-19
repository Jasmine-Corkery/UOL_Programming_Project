export function runHazardSimulation({ hazardType, severity, userLocation }) {
  const impactRadius = calculateImpactRadius(hazardType, severity);

  const projectedSafeZones = generateSafeZones(userLocation, impactRadius);

  const evacuationRoute = generateEvacuationRoute(
    userLocation,
    projectedSafeZones[0],
  );

  return {
    impactRadius,
    projectedSafeZones,
    evacuationRoute,
  };
}

function generateSafeZones(userLocation, radius) {
  return [
    {
      id: "safe-1",
      lat: userLocation.lat + 0.02,
      lng: userLocation.lng + 0.02,
    },
  ];
}
