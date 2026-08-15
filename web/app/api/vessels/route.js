import { NextResponse } from 'next/server';
import { db } from '../../../lib/firebaseAdmin';
import { analyzeVessels } from '../../../lib/detection';

// How far back to look. Without this, the query reads every position ever
// stored, which gets slow and expensive as the collection grows — vessels
// that went dark days ago aren't actionable anyway.
const WINDOW_HOURS = Number(process.env.VESSEL_WINDOW_HOURS) || 48;

export async function GET() {
  try {
    const cutoff = Date.now() - WINDOW_HOURS * 60 * 60 * 1000;
    const snapshot = await db.collection('positions').where('timestamp', '>=', cutoff).get();
    const positions = snapshot.docs.map((doc) => doc.data());

    if (positions.length === 0) {
      return NextResponse.json({
        vessels: [],
        totalPositions: 0,
        totalVesselsTracked: 0,
        lastPositionAt: null,
        windowHours: WINDOW_HOURS,
        generatedAt: Date.now(),
      });
    }

    const vessels = analyzeVessels(positions);
    const totalVesselsTracked = new Set(positions.map((p) => p.mmsi)).size;
    const lastPositionAt = Math.max(...positions.map((p) => p.timestamp));

    return NextResponse.json({
      vessels,
      totalPositions: positions.length,
      totalVesselsTracked,
      lastPositionAt,
      windowHours: WINDOW_HOURS,
      generatedAt: Date.now(),
    });
  } catch (err) {
    console.error('Error fetching vessels:', err);
    return NextResponse.json({ error: 'Failed to fetch vessel data' }, { status: 500 });
  }
}
