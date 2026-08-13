const { generatePositions } = require('./mockData');

// How long a vessel can go silent before we consider it a "gap event"
const GAP_THRESHOLD_MINUTES = 60;

function detectGaps(positions) {
  // Step 1: group all positions by vessel (MMSI)
  const byVessel = {};
  for (const pos of positions) {
    if (!byVessel[pos.mmsi]) byVessel[pos.mmsi] = [];
    byVessel[pos.mmsi].push(pos);
  }

  const gapEvents = [];

  // Step 2: for each vessel, walk through its positions in time order
  // and check the time between each consecutive pair
  for (const mmsi in byVessel) {
    const track = byVessel[mmsi].sort((a, b) => a.timestamp - b.timestamp);

    for (let i = 1; i < track.length; i++) {
      const prev = track[i - 1];
      const curr = track[i];
      const gapMinutes = (curr.timestamp - prev.timestamp) / (1000 * 60);

      if (gapMinutes >= GAP_THRESHOLD_MINUTES) {
        gapEvents.push({
          mmsi,
          gapMinutes: Math.round(gapMinutes),
          lastSeen: { lat: prev.lat, lon: prev.lon, timestamp: prev.timestamp },
          reappeared: { lat: curr.lat, lon: curr.lon, timestamp: curr.timestamp },
          distanceJumpedKm: haversineDistance(prev.lat, prev.lon, curr.lat, curr.lon),
        });
      }
    }
  }

  return gapEvents;
}

// Standard formula to calculate real-world distance between two lat/lon points
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10; // rounded to 1 decimal
}

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

// Run it and print results
const positions = generatePositions();
const gaps = detectGaps(positions);
console.log(`Found ${gaps.length} gap event(s):`);
console.log(JSON.stringify(gaps, null, 2));

module.exports = { detectGaps };