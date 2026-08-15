import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import serviceAccount from '../serviceAccountKey.json';

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

export const db = getFirestore();