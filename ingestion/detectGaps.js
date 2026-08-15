const { generatePositions } = require('./mockData.js');
const { groupByVessel, detectGaps } = require('../shared/detection');

// Run it and print results
if (require.main === module) {
  const positions = generatePositions();
  const gaps = detectGaps(groupByVessel(positions));
  console.log(`Found ${gaps.length} gap event(s):`);
  console.log(JSON.stringify(gaps, null, 2));
}

module.exports = { detectGaps: (positions) => detectGaps(groupByVessel(positions)) };
