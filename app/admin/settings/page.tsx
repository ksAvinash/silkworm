'use client';

import { useEffect, useState } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { useAuth } from '@/lib/auth';
import type { Tenant } from '@/lib/types';
import { Badge, ErrorNote, Field, Spinner } from '@/components/ui';

export default function SettingsPage() {
  const { tenantId } = useAuth();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [form, setForm] = useState({ name: '', invoicePrefix: '', address: '', contactPhone: '' });
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantId) return;
    return onSnapshot(doc(getDb(), 'tenants', tenantId), (snap) => {
      if (!snap.exists()) return;
      const t = { id: snap.id, ...snap.data() } as Tenant;
      setTenant(t);
      // Seed the form once — later snapshots shouldn't clobber edits in progress.
      setLoaded((already) => {
        if (!already) {
          setForm({
            name: t.name,
            invoicePrefix: t.invoicePrefix ?? 'INV-',
            address: t.address ?? '',
            contactPhone: t.contactPhone ?? '',
          });
        }
        return true;
      });
    });
  }, [tenantId]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      await updateDoc(doc(getDb(), 'tenants', tenantId), {
        name: form.name.trim(),
        invoicePrefix: form.invoicePrefix.trim().toUpperCase() || 'INV-',
        address: form.address.trim(),
        contactPhone: form.contactPhone.trim(),
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings.');
    } finally {
      setBusy(false);
    }
  };

  if (!loaded || !tenant) return <Spinner label="Loading settings…" />;

  const nextInvoice = `${(form.invoicePrefix.trim().toUpperCase() || 'INV-')}${String(
    (tenant.invoiceSeq ?? 0) + 1,
  ).padStart(5, '0')}`;

  return (
    <>
      <div className="page-head">
        <h1>Settings</h1>
      </div>

      <div style={{ display: 'grid', gap: 18, maxWidth: 560 }}>
        <form className="card" onSubmit={save}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: 14 }}>Business profile</h2>
          <Field label="Business name" hint="Shown in your console and on invoice verification pages">
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              maxLength={80}
            />
          </Field>
          <Field
            label="Business address (optional)"
            hint="Shown on public verification pages so farmers can confirm who delivered"
          >
            <textarea
              className="input"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              maxLength={200}
            />
          </Field>
          <Field label="Public contact phone (optional)" hint="Shown on public verification pages">
            <input
              className="input"
              type="tel"
              value={form.contactPhone}
              onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
              maxLength={20}
            />
          </Field>

          <h2 style={{ fontSize: '1.1rem', margin: '20px 0 14px' }}>Invoicing</h2>
          <Field
            label="Invoice number prefix"
            hint={`Next invoice will be ${nextInvoice} — already-issued invoices keep their numbers`}
          >
            <input
              className="input"
              value={form.invoicePrefix}
              onChange={(e) => setForm({ ...form, invoicePrefix: e.target.value })}
              maxLength={8}
              pattern="[A-Za-z0-9\-]*"
              title="Letters, digits and dashes only"
              style={{ maxWidth: 160, textTransform: 'uppercase' }}
            />
          </Field>

          <ErrorNote message={error} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
            <button className="btn btn-primary" disabled={busy}>
              {busy ? 'Saving…' : 'Save settings'}
            </button>
            {saved && <Badge tone="green">Saved ✓</Badge>}
          </div>
        </form>

        <div className="card">
          <h2 style={{ fontSize: '1.1rem', marginBottom: 12 }}>Account</h2>
          <dl className="detail-list">
            <div className="detail-row">
              <dt>Admin sign-in phone</dt>
              <dd>{tenant.adminPhone}</dd>
            </div>
            <div className="detail-row">
              <dt>Status</dt>
              <dd>
                <Badge tone={tenant.status === 'active' ? 'green' : 'red'}>{tenant.status}</Badge>
              </dd>
            </div>
            <div className="detail-row">
              <dt>Invoices issued</dt>
              <dd>{tenant.invoiceSeq ?? 0}</dd>
            </div>
          </dl>
          <p className="muted" style={{ marginTop: 10 }}>
            The sign-in phone number identifies your account and can only be changed by the
            platform administrator.
          </p>
        </div>
      </div>
    </>
  );
}
