const { generatePositions } = require('./mockData');
const { detectGaps } = require('./detectGaps');
const { detectLoitering } = require('./detectLoitering');

// Simple, explainable weighting — tune these later if needed
function calculateRiskScores(positions) {
  const gapEvents = detectGaps(positions);
  const loiteringEvents = detectLoitering(positions);

  const scoresByVessel = {};

  for (const gap of gapEvents) {
    scoresByVessel[gap.mmsi] = scoresByVessel[gap.mmsi] || { mmsi: gap.mmsi, score: 0, reasons: [] };
    // Longer gaps and bigger jumps = more suspicious
    const gapScore = Math.min(gap.gapMinutes / 10, 50) + Math.min(gap.distanceJumpedKm / 2, 30);
    scoresByVessel[gap.mmsi].score += gapScore;
    scoresByVessel[gap.mmsi].reasons.push(
      `Went dark for ${gap.gapMinutes} min, reappeared ${gap.distanceJumpedKm} km away`
    );
  }

  for (const loiter of loiteringEvents) {
    scoresByVessel[loiter.mmsi] = scoresByVessel[loiter.mmsi] || { mmsi: loiter.mmsi, score: 0, reasons: [] };
    // Longer loitering = more suspicious
    const loiterScore = Math.min(loiter.durationMinutes / 5, 40);
    scoresByVessel[loiter.mmsi].score += loiterScore;
    scoresByVessel[loiter.mmsi].reasons.push(
      `Loitered for ${loiter.durationMinutes} min at avg speed ${loiter.avgSpeed} knots`
    );
  }

  // Round scores, sort highest risk first
  return Object.values(scoresByVessel)
    .map((v) => ({ ...v, score: Math.round(v.score) }))
    .sort((a, b) => b.score - a.score);
}

// Run it and print results
const positions = generatePositions();
const scores = calculateRiskScores(positions);
console.log('Vessel risk scores (highest first):');
console.log(JSON.stringify(scores, null, 2));

module.exports = { calculateRiskScores };
