// Single source of truth for anomaly detection, shared by ingestion/ (Node scripts)
// and web/ (Next.js API route). Do not fork this logic per-app again.

const GAP_THRESHOLD_MINUTES = 60;
const SPEED_THRESHOLD_KNOTS = 2;
const RADIUS_THRESHOLD_KM = 1;
const DURATION_THRESHOLD_MINUTES = 30;

function toRad(deg) {
  return (deg * Math.PI) / 180;
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

function average(arr) {
  return arr.reduce((sum, n) => sum + n, 0) / arr.length;
}

function groupByVessel(positions) {
  const byVessel = {};
  for (const pos of positions) {
    if (!byVessel[pos.mmsi]) byVessel[pos.mmsi] = [];
    byVessel[pos.mmsi].push(pos);
  }
  for (const mmsi in byVessel) {
    byVessel[mmsi].sort((a, b) => a.timestamp - b.timestamp);
  }
  return byVessel;
}

// Flags a vessel if the time between two consecutive position reports
// exceeds GAP_THRESHOLD_MINUTES.
function detectGaps(byVessel) {
  const gapEvents = [];
  for (const mmsi in byVessel) {
    const track = byVessel[mmsi];
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

// Flags a vessel if it stays under SPEED_THRESHOLD_KNOTS and within
// RADIUS_THRESHOLD_KM for at least DURATION_THRESHOLD_MINUTES.
function detectLoitering(byVessel) {
  const loiteringEvents = [];
  for (const mmsi in byVessel) {
    const track = byVessel[mmsi];
    const slowPoints = track.filter((p) => p.speed <= SPEED_THRESHOLD_KNOTS);
    if (slowPoints.length < 2) continue;

    const centerLat = average(slowPoints.map((p) => p.lat));
    const centerLon = average(slowPoints.map((p) => p.lon));
    const maxDistanceFromCenter = Math.max(
      ...slowPoints.map((p) => haversineDistance(p.lat, p.lon, centerLat, centerLon))
    );
    if (maxDistanceFromCenter > RADIUS_THRESHOLD_KM) continue;

    const durationMinutes =
      (slowPoints[slowPoints.length - 1].timestamp - slowPoints[0].timestamp) / (1000 * 60);

    if (durationMinutes >= DURATION_THRESHOLD_MINUTES) {
      loiteringEvents.push({
        mmsi,
        durationMinutes: Math.round(durationMinutes),
        centerLocation: { lat: Math.round(centerLat * 1000) / 1000, lon: Math.round(centerLon * 1000) / 1000 },
        avgSpeed: Math.round(average(slowPoints.map((p) => p.speed)) * 10) / 10,
        pointCount: slowPoints.length,
      });
    }
  }
  return loiteringEvents;
}

// Combines gap and loitering events into one score per vessel with
// human-readable reasons, capped so no single factor dominates.
function analyzeVessels(positions) {
  const byVessel = groupByVessel(positions);
  const gapEvents = detectGaps(byVessel);
  const loiteringEvents = detectLoitering(byVessel);

  const scoresByVessel = {};

  for (const gap of gapEvents) {
    scoresByVessel[gap.mmsi] = scoresByVessel[gap.mmsi] || { mmsi: gap.mmsi, score: 0, reasons: [] };
    const gapScore = Math.min(gap.gapMinutes / 10, 50) + Math.min(gap.distanceJumpedKm / 2, 30);
    scoresByVessel[gap.mmsi].score += gapScore;
    scoresByVessel[gap.mmsi].reasons.push(
      `Went dark for ${gap.gapMinutes} min, reappeared ${gap.distanceJumpedKm} km away`
    );
  }

  for (const loiter of loiteringEvents) {
    scoresByVessel[loiter.mmsi] = scoresByVessel[loiter.mmsi] || { mmsi: loiter.mmsi, score: 0, reasons: [] };
    const loiterScore = Math.min(loiter.durationMinutes / 5, 40);
    scoresByVessel[loiter.mmsi].score += loiterScore;
    scoresByVessel[loiter.mmsi].reasons.push(
      `Loitered for ${loiter.durationMinutes} min at avg speed ${loiter.avgSpeed} knots`
    );
  }

  return Object.values(scoresByVessel)
    .map((v) => ({
      ...v,
      score: Math.round(v.score),
      track: byVessel[v.mmsi],
      lastPosition: byVessel[v.mmsi][byVessel[v.mmsi].length - 1],
    }))
    .sort((a, b) => b.score - a.score);
}

module.exports = {
  GAP_THRESHOLD_MINUTES,
  SPEED_THRESHOLD_KNOTS,
  RADIUS_THRESHOLD_KM,
  DURATION_THRESHOLD_MINUTES,
  haversineDistance,
  groupByVessel,
  detectGaps,
  detectLoitering,
  analyzeVessels,
};
