export function calculateImpactRadius(type, severity) {
  const baseRadius = {
    flood: 500,
    earthquake: 1000,
    wildfire: 2000,
  };

  const multiplier = severity / 5;

  return baseRadius[type] * multiplier;
}
