// Detection logic lives in ../../shared/detection.js so the web app and the
// ingestion scripts can never drift out of sync — this file just re-exports it.
import sharedDetection from '../../shared/detection.js';

export const { analyzeVessels } = sharedDetection;
