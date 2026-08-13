const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('./serviceAccountKey.json');
const { generatePositions } = require('./mockData');

initializeApp({
  credential: cert(serviceAccount),
});
const db = getFirestore();

async function writeMockData() {
  const positions = generatePositions();
  console.log(`Writing ${positions.length} mock positions to Firestore...`);

  for (const pos of positions) {
    await db.collection('positions').add(pos);
  }

  console.log('Done. Check your Firestore console to confirm.');
  process.exit(0);
}

writeMockData().catch((err) => {
  console.error('Error writing to Firestore:', err.message);
  process.exit(1);
});