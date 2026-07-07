'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { doc, onSnapshot } from 'firebase/firestore';
import { useAuth } from '@/lib/auth';
import { firebaseReady, getDb } from '@/lib/firebase';
import type { Tenant } from '@/lib/types';
import { Logo, Spinner } from '@/components/ui';

const NAV = [
  { href: '/admin/', label: 'Dashboard' },
  { href: '/admin/batches/', label: 'Batches' },
  { href: '/admin/orders/', label: 'Bookings' },
  { href: '/admin/farmers/', label: 'Farmers' },
  { href: '/admin/breeds/', label: 'Breeds' },
  { href: '/admin/reports/', label: 'Reports' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { loading, user, tenantId, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [tenant, setTenant] = useState<Tenant | null>(null);

  useEffect(() => {
    if (!loading && (!user || !tenantId)) router.replace('/login/');
  }, [loading, user, tenantId, router]);

  useEffect(() => {
    if (!firebaseReady || !tenantId) return;
    return onSnapshot(doc(getDb(), 'tenants', tenantId), (snap) => {
      if (snap.exists()) setTenant({ id: snap.id, ...snap.data() } as Tenant);
    });
  }, [tenantId]);

  if (loading || !user || !tenantId) {
    return (
      <main className="center-page">
        <Spinner label="Loading…" />
      </main>
    );
  }

  return (
    <>
      <header className="topbar">
        <div className="container topbar-inner">
          <Link href="/admin/" className="brand">
            <Logo /> {tenant?.name ?? 'Silkworm'}
          </Link>
          <nav className="nav-links" aria-label="Admin">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link${pathname === item.href ? ' active' : ''}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <span className="topbar-spacer" />
          <button
            className="btn btn-ghost btn-sm"
            onClick={async () => {
              await signOut();
              router.replace('/login/');
            }}
          >
            Sign out
          </button>
        </div>
      </header>
      <main className="container page-main">{children}</main>
    </>
  );
}
