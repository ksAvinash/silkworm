'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { useAuth } from '@/lib/auth';
import { useTenantCollection } from '@/lib/db';
import type { Batch, Breed } from '@/lib/types';
import { Badge, EmptyState, ErrorNote, Field, Modal, Spinner } from '@/components/ui';

export default function BatchesPage() {
  const { tenantId } = useAuth();
  const [batches, loading] = useTenantCollection<Batch>(tenantId, 'batches');
  const [breeds] = useTenantCollection<Breed>(tenantId, 'breeds');
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ breedId: '', quantity: '', availableDate: '', notes: '' });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;
    const breed = breeds.find((b) => b.id === form.breedId);
    if (!breed) {
      setError('Pick a breed for this batch.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await addDoc(collection(getDb(), 'tenants', tenantId, 'batches'), {
        breedId: breed.id,
        breedName: breed.code || breed.name,
        quantity: Number(form.quantity),
        bookedTotal: 0,
        availableDate: form.availableDate,
        bookingOpen: false,
        notes: form.notes.trim(),
        createdAt: serverTimestamp(),
      });
      setCreating(false);
      setForm({ breedId: '', quantity: '', availableDate: '', notes: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create batch.');
    } finally {
      setBusy(false);
    }
  };

  const toggleBooking = async (batch: Batch) => {
    if (!tenantId) return;
    await updateDoc(doc(getDb(), 'tenants', tenantId, 'batches', batch.id), {
      bookingOpen: !batch.bookingOpen,
    });
  };

  const remove = async (batch: Batch) => {
    if (!tenantId) return;
    if (batch.bookedTotal > 0) {
      alert('This batch has bookings against it and can’t be deleted. Close booking instead.');
      return;
    }
    if (!confirm('Delete this batch? This cannot be undone.')) return;
    await deleteDoc(doc(getDb(), 'tenants', tenantId, 'batches', batch.id));
  };

  return (
    <>
      <div className="page-head">
        <h1>Batches</h1>
        <button className="btn btn-primary" onClick={() => setCreating(true)}>
          + New batch
        </button>
      </div>

      {loading ? (
        <Spinner label="Loading batches…" />
      ) : batches.length === 0 ? (
        <EmptyState
          title="No batches yet"
          hint={
            breeds.length === 0
              ? 'Add a breed first, then create production batches against it.'
              : 'Create a production batch — it stays catalog-only until you open it for booking.'
          }
        />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Batch</th>
                <th>Booked</th>
                <th>Booking</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {batches.map((b) => {
                const pct = b.quantity ? Math.min(100, (b.bookedTotal / b.quantity) * 100) : 0;
                const full = b.bookedTotal >= b.quantity;
                return (
                  <tr key={b.id}>
                    <td>
                      <Link href={`/admin/orders/?batch=${b.id}`} title="View bookings for this batch">
                        <strong>{b.breedName}</strong> — {b.quantity.toLocaleString()} qty —{' '}
                        {b.availableDate}
                      </Link>
                      {b.notes && <div className="muted">{b.notes}</div>}
                    </td>
                    <td>
                      <Link href={`/admin/orders/?batch=${b.id}`} title="View bookings for this batch">
                        <div className="progress" title={`${Math.round(pct)}% booked`}>
                          <span style={{ width: `${pct}%` }} />
                        </div>
                        <span className="muted">
                          {b.bookedTotal.toLocaleString()} / {b.quantity.toLocaleString()}
                        </span>
                      </Link>
                    </td>
                    <td>
                      {full ? (
                        <Badge tone="amber">Fully booked</Badge>
                      ) : b.bookingOpen ? (
                        <Badge tone="green">Open</Badge>
                      ) : (
                        <Badge tone="neutral">Closed</Badge>
                      )}
                    </td>
                    <td>
                      <div className="actions">
                        <Link href={`/admin/orders/?batch=${b.id}`} className="btn btn-ghost btn-sm">
                          Bookings
                        </Link>
                        <button className="btn btn-ghost btn-sm" onClick={() => toggleBooking(b)}>
                          {b.bookingOpen ? 'Close booking' : 'Open booking'}
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => remove(b)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {creating && (
        <Modal title="New batch" onClose={() => setCreating(false)}>
          {breeds.length === 0 ? (
            <p className="muted">
              You need at least one breed before creating a batch.{' '}
              <Link href="/admin/breeds/">Add a breed →</Link>
            </p>
          ) : (
            <form onSubmit={create}>
              <Field label="Breed">
                <select
                  className="input"
                  value={form.breedId}
                  onChange={(e) => setForm({ ...form, breedId: e.target.value })}
                  required
                >
                  <option value="">Select a breed…</option>
                  {breeds.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Quantity" hint="Total eggs in this batch — bookings are capped at this">
                <input
                  className="input"
                  type="number"
                  min={1}
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  required
                />
              </Field>
              <Field label="Available date">
                <input
                  className="input"
                  type="date"
                  value={form.availableDate}
                  onChange={(e) => setForm({ ...form, availableDate: e.target.value })}
                  required
                />
              </Field>
              <Field label="Notes (optional)">
                <textarea
                  className="input"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </Field>
              <ErrorNote message={error} />
              <button className="btn btn-primary" style={{ width: '100%' }} disabled={busy}>
                {busy ? 'Creating…' : 'Create batch (booking stays closed)'}
              </button>
            </form>
          )}
        </Modal>
      )}
    </>
  );
}
