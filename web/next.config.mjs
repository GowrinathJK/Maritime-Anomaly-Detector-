import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // lib/detection.js imports ../../shared/detection.js, which lives outside
  // this Next.js project root (it's shared with ingestion/) — widen the
  // Turbopack/webpack root so that resolves.
  turbopack: {
    root: path.join(__dirname, '..'),
  },
  outputFileTracingRoot: path.join(__dirname, '..'),
};

export default nextConfig;
