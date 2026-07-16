import type { Metadata } from 'next';
import { Barlow, Bebas_Neue } from 'next/font/google';
import './globals.css';

// Self-hosted via next/font instead of a <link> to fonts.googleapis.com —
// that link was a render-blocking request (extra DNS lookup + connection +
// download to a third-party CDN) on every single page load, which is
// especially costly on higher-latency mobile networks. next/font downloads
// the fonts at build time and serves them from the same origin, with no
// render-blocking network request and automatic font-display: swap.
// (Barlow Condensed was also being loaded but isn't used anywhere in the
// codebase, so it's dropped entirely.)
const barlow = Barlow({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-barlow',
  display: 'swap',
});
const bebasNeue = Bebas_Neue({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-bebas-neue',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'TruAutomation – Client Portal',
  description: 'Manage your AI receptionist account.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${barlow.variable} ${bebasNeue.variable}`}>
      <body>
        <div className="glow-orb orange" />
        <div className="glow-orb blue" />
        <div className="glow-orb green" />
        <div className="fx-grid" />
        <div className="fx-scanline" />
        <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
      </body>
    </html>
  );
}
