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

// AISStream has a history of silent outages (connects fine, subscription is
// accepted, but zero messages ever arrive — see aisstream/aisstream#15).
// Reconnect with backoff so ingestion resumes on its own once the service
// recovers, instead of needing someone to notice and restart it by hand.
const RECONNECT_BASE_DELAY_MS = 5_000;
const RECONNECT_MAX_DELAY_MS = 5 * 60 * 1000;
const SILENT_WARNING_MS = 60_000; // warn if connected but nothing's arriving

let reconnectAttempt = 0;
let lastMessageAt = null;
let silentWarningTimer = null;

function connect() {
  const socket = new WebSocket('wss://stream.aisstream.io/v0/stream');

  socket.on('open', () => {
    console.log('Connected to AISStream');
    reconnectAttempt = 0;
    lastMessageAt = null;

    const subscriptionMessage = {
      APIKey: API_KEY,
      BoundingBoxes: [SINGAPORE_STRAIT_BOX],
    };
    socket.send(JSON.stringify(subscriptionMessage));

    clearTimeout(silentWarningTimer);
    silentWarningTimer = setTimeout(checkForSilence, SILENT_WARNING_MS);
  });

  socket.on('message', async (data) => {
    lastMessageAt = Date.now();
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
    clearTimeout(silentWarningTimer);
    console.log('Disconnected from AISStream. Code:', code, 'Reason:', reason.toString());
    scheduleReconnect();
  });
}

function checkForSilence() {
  if (lastMessageAt === null) {
    console.warn(
      `Still no messages ${SILENT_WARNING_MS / 1000}s after connecting — subscription was accepted but AISStream isn't delivering data (known platform issue, not local config).`
    );
  }
  silentWarningTimer = setTimeout(checkForSilence, SILENT_WARNING_MS);
}

function scheduleReconnect() {
  const delay = Math.min(RECONNECT_BASE_DELAY_MS * 2 ** reconnectAttempt, RECONNECT_MAX_DELAY_MS);
  reconnectAttempt++;
  console.log(`Reconnecting in ${Math.round(delay / 1000)}s...`);
  setTimeout(connect, delay);
}

connect();

process.on('SIGINT', () => {
  clearTimeout(silentWarningTimer);
  process.exit(0);
});
