// Generates fake AIS position reports for testing detection logic.
// Includes: normal vessels, one vessel with a "dark" gap, one loitering vessel.

function generatePositions() {
  const positions = [];
  const now = Date.now();

  // Vessel A: totally normal, reports every 2 minutes, moving steadily
  let lat = 1.15, lon = 103.7;
  for (let i = 0; i < 20; i++) {
    positions.push({
      mmsi: '111111111',
      lat: lat + i * 0.002,
      lon: lon + i * 0.003,
      speed: 12,
      timestamp: now - (20 - i) * 2 * 60 * 1000,
    });
  }

  // Vessel B: normal for a while, then goes DARK for 90 minutes, reappears far away
  lat = 1.10; lon = 103.6;
  for (let i = 0; i < 10; i++) {
    positions.push({
      mmsi: '222222222',
      lat: lat + i * 0.002,
      lon: lon + i * 0.002,
      speed: 14,
      timestamp: now - (150 - i * 2) * 60 * 1000, // stops reporting ~130 min ago
    });
  }
  positions.push({
    mmsi: '222222222',
    lat: lat + 0.15,
    lon: lon + 0.2,
    speed: 13,
    timestamp: now - 10 * 60 * 1000,
  });

  // Vessel C: loitering — stays in nearly the same spot, low speed, for a long time
  lat = 1.20; lon = 103.85;
  for (let i = 0; i < 15; i++) {
    positions.push({
      mmsi: '333333333',
      lat: lat + (Math.random() - 0.5) * 0.001,
      lon: lon + (Math.random() - 0.5) * 0.001,
      speed: 0.8,
      timestamp: now - (60 - i * 4) * 60 * 1000,
    });
  }

  return positions.sort((a, b) => a.timestamp - b.timestamp);
}

module.exports = { generatePositions };