export const calculateRiskScore = ({
  hazardSeverity,
  distanceKm,
  speed,
  isUrban,
  hourOfDay,
}) => {
  const severityMap = {
    critical: 1,
    high: 0.8,
    moderate: 0.6,
    low: 0.4,
    safe: 0,
  };

  const severityScore = severityMap[hazardSeverity] || 0.5;

  const distanceScore =
    distanceKm < 1
      ? 1
      : distanceKm < 5
        ? 0.85
        : distanceKm < 10
          ? 0.7
          : distanceKm < 25
            ? 0.5
            : 0.2;

  const mobilityScore = speed > 3 ? 0.9 : speed > 1 ? 0.7 : 0.4;

  const environmentScore = isUrban ? 0.8 : 0.5;

  const timeScore = hourOfDay >= 22 || hourOfDay <= 5 ? 0.9 : 0.5;

  const rawScore =
    severityScore * 0.4 +
    distanceScore * 0.25 +
    mobilityScore * 0.1 +
    environmentScore * 0.15 +
    timeScore * 0.1;

  const finalScore = Math.round(rawScore * 100);

  let category = 'Low';
  if (finalScore > 75) category = 'Critical';
  else if (finalScore > 50) category = 'High';
  else if (finalScore > 25) category = 'Moderate';

  return { score: finalScore, category };
};
