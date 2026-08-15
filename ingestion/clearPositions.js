const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('./serviceAccountKey.json');

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function clearCollection(collectionName) {
  const snapshot = await db.collection(collectionName).get();
  console.log(`Found ${snapshot.size} documents in "${collectionName}".`);
  if (snapshot.empty) return;

  const chunks = [];
  let chunk = [];
  for (const doc of snapshot.docs) {
    chunk.push(doc);
    if (chunk.length === 500) {
      chunks.push(chunk);
      chunk = [];
    }
  }
  if (chunk.length) chunks.push(chunk);

  for (const c of chunks) {
    const batch = db.batch();
    for (const doc of c) batch.delete(doc.ref);
    await batch.commit();
  }
  console.log(`Deleted ${snapshot.size} documents from "${collectionName}".`);
}

clearCollection('positions')
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Failed to clear collection:', err.message);
    process.exit(1);
  });
