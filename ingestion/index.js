require('dotenv').config();
const WebSocket = require('ws');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const serviceAccount = require('./serviceAccountKey.json');
initializeApp({
  credential: cert(serviceAccount),
});
const db = getFirestore();

const API_KEY = process.env.AISSTREAM_API_KEY;
const SINGAPORE_STRAIT_BOX = [[1.05, 103.5], [1.35, 104.1]];

const socket = new WebSocket('wss://stream.aisstream.io/v0/stream');
socket.on('open', () => {
  console.log('Connected to AISStream');

  const subscriptionMessage = {
    APIKey: API_KEY,
    BoundingBoxes: [SINGAPORE_STRAIT_BOX],
  };

  socket.send(JSON.stringify(subscriptionMessage));
});

socket.on('message', async (data) => {
  const message = JSON.parse(data);

  // Only handle position reports — AISStream sends other message types too
  if (message.MessageType !== 'PositionReport') return;

  const report = message.Message.PositionReport;
  const mmsi = report.UserID;

  const positionRecord = {
    mmsi: String(mmsi),
    lat: report.Latitude,
    lon: report.Longitude,
    speed: report.Sog, // Speed over ground, in knots
    timestamp: Date.now(),
  };

  console.log('Storing position:', positionRecord);

  try {
    await db.collection('positions').add(positionRecord);
  } catch (err) {
    console.error('Failed to write to Firestore:', err.message);
  }
});

socket.on('error', (err) => {
  console.error('WebSocket error:', err.message || err);
});

socket.on('close', (code, reason) => {
  console.log('Disconnected from AISStream. Code:', code, 'Reason:', reason.toString());
});