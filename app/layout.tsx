import type { Metadata, Viewport } from 'next';
import { Fraunces, Manrope } from 'next/font/google';
import { AuthProvider } from '@/lib/auth';
import './globals.css';

// Self-hosted at build time by next/font — no runtime font requests.
const manrope = Manrope({ subsets: ['latin'], variable: '--font-body' });
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-display' });

export const metadata: Metadata = {
  title: {
    default: 'Silkworm — egg catalog, batch booking & distribution',
    template: '%s · Silkworm',
  },
  description:
    'Silkworm helps silkworm-rearing distributors manage their egg catalog, open batches for pre-booking, allocate to farmers, and track deliveries with QR-verified invoices.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#2e6b40',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${manrope.variable} ${fraunces.variable}`}>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
