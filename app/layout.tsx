import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/lib/auth';
import { NumberInputWheelGuard, ServiceWorkerRegistration } from '@/components/extras';
import './globals.css';

// Self-hosted at build time by next/font — no runtime font requests.
const inter = Inter({ subsets: ['latin'], variable: '--font-body' });

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

export const metadata: Metadata = {
  title: {
    default: 'Silkworm — egg catalog, batch booking & distribution',
    template: '%s · Silkworm',
  },
  description:
    'Silkworm helps silkworm-rearing distributors manage their egg catalog, open batches for pre-booking, allocate to farmers, and track deliveries with QR-verified invoices.',
  manifest: `${basePath}/manifest.webmanifest`,
  icons: {
    apple: `${basePath}/icons/apple-touch-icon.png`,
  },
  appleWebApp: {
    capable: true,
    title: 'Silkworm',
    statusBarStyle: 'default',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1a7a41',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <AuthProvider>{children}</AuthProvider>
        <ServiceWorkerRegistration />
        <NumberInputWheelGuard />
      </body>
    </html>
  );
}
