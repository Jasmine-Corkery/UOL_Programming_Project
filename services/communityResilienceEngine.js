/**
 * Advanced Community Resilience Index (CRI) Engine
 * Context-adaptive, nonlinear, hazard-aware model
 */

export function calculateCommunityResilience({
  preparednessScore,
  responseRate,
  safeZoneScore,
  emergencyAccessScore,
  connectivityScore,
  hazardType,
  severityLevel,
  daysSincePreparednessUpdate,
  infrastructureStability,
}) {
  const decayedPreparedness = applyTemporalDecay(
    preparednessScore,
    daysSincePreparednessUpdate,
  );

  const adjustedResponse = logisticTransform(responseRate);

  const weights = getDynamicWeights({
    hazardType,
    severityLevel,
    connectivityScore,
  });

  let baseScore =
    decayedPreparedness * weights.preparedness +
    adjustedResponse * weights.response +
    safeZoneScore * weights.safeZones +
    emergencyAccessScore * weights.emergencyAccess +
    connectivityScore * weights.connectivity;

  const infraPenalty = logisticPenalty(infrastructureStability);
  baseScore *= infraPenalty;

  const severityMultiplier = 1 - severityLevel * 0.05;
  baseScore *= severityMultiplier;

  const finalScore = clamp(baseScore, 0, 100);

  const riskLevel = classifyRisk(finalScore);

  const confidence = calculateConfidence({
    connectivityScore,
    infrastructureStability,
    daysSincePreparednessUpdate,
  });

  return {
    cri: Math.round(finalScore),
    riskLevel,
    confidence,
    meta: {
      hazardType,
      severityLevel,
      weightsUsed: weights,
    },
  };
}

function applyTemporalDecay(score, days) {
  const decayFactor = Math.exp(-days / 30);
  return score * decayFactor;
}

function logisticTransform(value) {
  return 100 / (1 + Math.exp(-(value - 50) / 10));
}

function logisticPenalty(value) {
  return 0.5 + value / 200;
}

function getDynamicWeights({ hazardType, severityLevel, connectivityScore }) {
  let weights = {
    preparedness: 0.25,
    response: 0.2,
    safeZones: 0.2,
    emergencyAccess: 0.2,
    connectivity: 0.15,
  };

  if (hazardType === 'Earthquake') {
    weights.response += 0.1;
    weights.preparedness -= 0.05;
  }

  if (hazardType === 'Flood') {
    weights.safeZones += 0.1;
    weights.connectivity -= 0.05;
  }

  if (hazardType === 'Wildfire') {
    weights.emergencyAccess += 0.1;
  }

  if (connectivityScore < 40) {
    weights.connectivity += 0.1;
    weights.safeZones -= 0.05;
  }

  return normalizeWeights(weights);
}

function normalizeWeights(weights) {
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  const normalized = {};
  for (let key in weights) {
    normalized[key] = weights[key] / total;
  }
  return normalized;
}

function classifyRisk(score) {
  if (score >= 75) return 'Low Risk';
  if (score >= 50) return 'Moderate Risk';
  if (score >= 30) return 'High Risk';
  return 'Critical Risk';
}

function calculateConfidence({
  connectivityScore,
  infrastructureStability,
  daysSincePreparednessUpdate,
}) {
  let confidence = 100;

  if (connectivityScore < 40) confidence -= 20;
  if (infrastructureStability < 50) confidence -= 20;
  if (daysSincePreparednessUpdate > 60) confidence -= 15;

  return clamp(confidence, 0, 100);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
