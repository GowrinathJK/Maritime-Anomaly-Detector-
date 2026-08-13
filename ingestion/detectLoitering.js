const { generatePositions } = require('./mockData');

// Thresholds for what counts as "loitering"
const SPEED_THRESHOLD_KNOTS = 2;      // below this = barely moving
const RADIUS_THRESHOLD_KM = 1;        // must stay within this radius
const DURATION_THRESHOLD_MINUTES = 30; // for at least this long

function detectLoitering(positions) {
  // Step 1: group by vessel, same as gap detection
  const byVessel = {};
  for (const pos of positions) {
    if (!byVessel[pos.mmsi]) byVessel[pos.mmsi] = [];
    byVessel[pos.mmsi].push(pos);
  }

  const loiteringEvents = [];

  for (const mmsi in byVessel) {
    const track = byVessel[mmsi].sort((a, b) => a.timestamp - b.timestamp);

    // Step 2: find the slow-speed points
    const slowPoints = track.filter((p) => p.speed <= SPEED_THRESHOLD_KNOTS);
    if (slowPoints.length < 2) continue; // not enough slow points to matter

    // Step 3: check if those slow points stayed within a small radius
    const centerLat = average(slowPoints.map((p) => p.lat));
    const centerLon = average(slowPoints.map((p) => p.lon));

    const maxDistanceFromCenter = Math.max(
      ...slowPoints.map((p) => haversineDistance(p.lat, p.lon, centerLat, centerLon))
    );

    if (maxDistanceFromCenter > RADIUS_THRESHOLD_KM) continue; // moved around too much, not loitering

    // Step 4: check how long this slow, contained behavior lasted
    const durationMinutes =
      (slowPoints[slowPoints.length - 1].timestamp - slowPoints[0].timestamp) / (1000 * 60);

    if (durationMinutes >= DURATION_THRESHOLD_MINUTES) {
      loiteringEvents.push({
        mmsi,
        durationMinutes: Math.round(durationMinutes),
        centerLocation: { lat: round(centerLat), lon: round(centerLon) },
        avgSpeed: round(average(slowPoints.map((p) => p.speed))),
        pointCount: slowPoints.length,
      });
    }
  }

  return loiteringEvents;
}

function average(arr) {
  return arr.reduce((sum, n) => sum + n, 0) / arr.length;
}

function round(n) {
  return Math.round(n * 1000) / 1000;
}

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

// Run it and print results
const positions = generatePositions();
const loitering = detectLoitering(positions);
console.log(`Found ${loitering.length} loitering event(s):`);
console.log(JSON.stringify(loitering, null, 2));

module.exports = { detectLoitering };