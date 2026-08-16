import { Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import NavBar from "../components/NavBar";
import { VesselDataProvider } from "../context/VesselDataContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

export const metadata = {
  title: "Maritime Anomaly Detector",
  description:
    "Flags vessels showing suspicious AIS behavior — going dark or loitering — in the Singapore Strait.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${plexMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[var(--color-bg)] text-[var(--color-text)]">
        <VesselDataProvider>
          <NavBar />
          {children}
        </VesselDataProvider>
      </body>
    </html>
  );
}
