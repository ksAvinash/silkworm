'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { firebaseReady, getDb } from '@/lib/firebase';
import { useAuth } from '@/lib/auth';
import type { Tenant } from '@/lib/types';
import { Badge, EmptyState, ErrorNote, Field, Logo, Modal, Spinner } from '@/components/ui';

export default function SuperAdminPage() {
  const { loading, user, isSuperAdmin, signOut } = useAuth();
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantsLoading, setTenantsLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', adminPhone: '+91' });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !isSuperAdmin)) router.replace('/login/');
  }, [loading, user, isSuperAdmin, router]);

  useEffect(() => {
    if (!firebaseReady || !isSuperAdmin) return;
    const q = query(collection(getDb(), 'tenants'), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snap) => {
        setTenants(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Tenant));
        setTenantsLoading(false);
      },
      () => setTenantsLoading(false),
    );
  }, [isSuperAdmin]);

  const createTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      // Onboarding needs the Admin SDK (creates the admin user and sets the
      // tenantId custom claim), so it runs in the onboardTenant Cloud Function.
      const fn = httpsCallable(getFunctions(), 'onboardTenant');
      await fn({ name: form.name.trim(), adminPhone: form.adminPhone.trim() });
      setCreating(false);
      setForm({ name: '', adminPhone: '+91' });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Onboarding failed. Is the onboardTenant Cloud Function deployed?',
      );
    } finally {
      setBusy(false);
    }
  };

  if (loading || !user || !isSuperAdmin) {
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
          <Link href="/super/" className="brand">
            <Logo /> Silkworm <Badge tone="blue">Platform</Badge>
          </Link>
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
        <div className="page-head">
          <h1>Tenants</h1>
          <button className="btn btn-primary" onClick={() => setCreating(true)}>
            + Onboard tenant
          </button>
        </div>

        {tenantsLoading ? (
          <Spinner label="Loading tenants…" />
        ) : tenants.length === 0 ? (
          <EmptyState
            title="No tenants yet"
            hint="Onboard your first distributor — this creates their tenant and admin account."
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Tenant</th>
                  <th>Admin phone</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <strong>{t.name}</strong>
                    </td>
                    <td>{t.adminPhone}</td>
                    <td>
                      <Badge tone={t.status === 'active' ? 'green' : 'red'}>{t.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {creating && (
          <Modal title="Onboard a tenant" onClose={() => setCreating(false)}>
            <form onSubmit={createTenant}>
              <Field label="Business / rearer name">
                <input
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  autoFocus
                />
              </Field>
              <Field
                label="Admin phone number"
                hint="The tenant admin signs in with this number via OTP"
              >
                <input
                  className="input"
                  type="tel"
                  value={form.adminPhone}
                  onChange={(e) => setForm({ ...form, adminPhone: e.target.value })}
                  required
                />
              </Field>
              <ErrorNote message={error} />
              <button className="btn btn-primary" style={{ width: '100%' }} disabled={busy}>
                {busy ? 'Onboarding…' : 'Create tenant & admin'}
              </button>
            </form>
          </Modal>
        )}
      </main>
    </>
  );
}
