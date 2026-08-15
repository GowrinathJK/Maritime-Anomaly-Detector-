import { NextResponse } from 'next/server';
import { db } from '../../../lib/firebaseAdmin';
import { analyzeVessels } from '../../../lib/detection';

export async function GET() {
  try {
    const snapshot = await db.collection('positions').get();
    const positions = snapshot.docs.map((doc) => doc.data());

    if (positions.length === 0) {
      return NextResponse.json({ vessels: [], totalPositions: 0 });
    }

    const vessels = analyzeVessels(positions);
    return NextResponse.json({ vessels, totalPositions: positions.length });
  } catch (err) {
    console.error('Error fetching vessels:', err);
    return NextResponse.json({ error: 'Failed to fetch vessel data' }, { status: 500 });
  }
}