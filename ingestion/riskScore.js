const { generatePositions } = require('./mockData');
const { analyzeVessels } = require('../shared/detection');

// Run it and print results
if (require.main === module) {
  const positions = generatePositions();
  const scores = analyzeVessels(positions);
  console.log('Vessel risk scores (highest first):');
  // Drop the full track from the CLI output — it's noisy here; the web app uses it for the map.
  console.log(JSON.stringify(scores.map(({ track, ...rest }) => rest), null, 2));
}

module.exports = { calculateRiskScores: analyzeVessels };
