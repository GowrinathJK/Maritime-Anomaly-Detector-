const { generatePositions } = require('./mockData');
const { groupByVessel, detectLoitering } = require('../shared/detection');

// Run it and print results
if (require.main === module) {
  const positions = generatePositions();
  const loitering = detectLoitering(groupByVessel(positions));
  console.log(`Found ${loitering.length} loitering event(s):`);
  console.log(JSON.stringify(loitering, null, 2));
}

module.exports = { detectLoitering: (positions) => detectLoitering(groupByVessel(positions)) };
