'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { doc, onSnapshot } from 'firebase/firestore';
import { useAuth } from '@/lib/auth';
import { firebaseReady, getDb } from '@/lib/firebase';
import type { Tenant } from '@/lib/types';
import { Logo, Spinner } from '@/components/ui';

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
          {pathname !== '/admin/' && (
            <Link href="/admin/" className="nav-link">
              ← Dashboard
            </Link>
          )}
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
      <main className="container page-main">
        {tenant?.status === 'suspended' ? (
          <div className="empty" style={{ marginTop: 40 }}>
            <p className="empty-title">This account is suspended</p>
            <p className="muted">
              Your Silkworm account has been suspended by the platform administrator. Your data
              is safe, but booking and delivery actions are disabled. Please contact the
              platform administrator to reactivate.
            </p>
          </div>
        ) : (
          children
        )}
      </main>
    </>
  );
}
