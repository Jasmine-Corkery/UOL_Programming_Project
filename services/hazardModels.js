// impact radius calculation - calculates how large the affected area is based on disaster type and severity
export function calculateImpactRadius(type, severity) {
  const baseRadius = {
    flood: 500,
    earthquake: 1000,
    wildfire: 2000,
  };

  const multiplier = severity / 5;

  return baseRadius[type] * multiplier;
}
