// calculates how prepared a user is for emergencies
export function calculatePreparednessScore({
  hasEmergencyKit,
  evacuationKnowledge,
  alertResponseSpeed,
}) {
  let score = 0;

  // if the user has a preparedness kit add 30 points
  if (hasEmergencyKit) score += 30;
  if (evacuationKnowledge) score += 30;
  if (alertResponseSpeed < 60) score += 40;

  return {
    score,
    category:
      score > 75
        ? 'Highly Prepared'
        : score > 50
          ? 'Moderately Prepared'
          : 'Low Preparedness',
  };
}
export function getPreparednessScore() {
  return 0;
}
