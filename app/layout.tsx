import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TruAutomation – Client Portal',
  description: 'Manage your Alex AI receptionist account.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow:wght@300;400;500;600;700&family=Barlow+Condensed:wght@600;700&display=swap"
          rel="stylesheet"
        />
      </head>
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
