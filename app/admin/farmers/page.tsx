'use client';

import { useState } from 'react';
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
import type { Farmer } from '@/lib/types';
import { EmptyState, ErrorNote, Field, Modal, Spinner } from '@/components/ui';

const EMPTY = { name: '', phone: '', address: '', locationLink: '', photoUrl: '', notes: '' };

export default function FarmersPage() {
  const { tenantId } = useAuth();
  const [farmers, loading] = useTenantCollection<Farmer>(tenantId, 'farmers');
  const [editing, setEditing] = useState<Farmer | 'new' | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const openModal = (farmer: Farmer | 'new') => {
    setEditing(farmer);
    setError(null);
    setForm(
      farmer === 'new'
        ? EMPTY
        : {
            name: farmer.name,
            phone: farmer.phone,
            address: farmer.address ?? '',
            locationLink: farmer.locationLink ?? '',
            photoUrl: farmer.photoUrl ?? '',
            notes: farmer.notes ?? '',
          },
    );
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;
    setBusy(true);
    setError(null);
    try {
      const data = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        locationLink: form.locationLink.trim(),
        photoUrl: form.photoUrl.trim(),
        notes: form.notes.trim(),
      };
      if (editing === 'new') {
        await addDoc(collection(getDb(), 'tenants', tenantId, 'farmers'), {
          ...data,
          createdAt: serverTimestamp(),
        });
      } else if (editing) {
        await updateDoc(doc(getDb(), 'tenants', tenantId, 'farmers', editing.id), data);
      }
      setEditing(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save farmer.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (farmer: Farmer) => {
    if (!tenantId) return;
    if (!confirm(`Delete farmer “${farmer.name}”? Their past orders are kept.`)) return;
    await deleteDoc(doc(getDb(), 'tenants', tenantId, 'farmers', farmer.id));
  };

  const filtered = search
    ? farmers.filter(
        (f) =>
          f.name.toLowerCase().includes(search.toLowerCase()) || f.phone.includes(search),
      )
    : farmers;

  return (
    <>
      <div className="page-head">
        <h1>Farmers</h1>
        <button className="btn btn-primary" onClick={() => openModal('new')}>
          + Add farmer
        </button>
      </div>

      {farmers.length > 0 && (
        <div style={{ marginBottom: 14, maxWidth: 360 }}>
          <input
            className="input"
            placeholder="Search by name or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}

      {loading ? (
        <Spinner label="Loading farmers…" />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={search ? 'No farmers match your search' : 'No farmers yet'}
          hint={
            search
              ? undefined
              : 'Add farmer profiles as they call in — name, phone, address, and a maps pin for delivery.'
          }
        />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Address</th>
                <th>Location</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((f) => (
                <tr key={f.id}>
                  <td>
                    <strong>{f.name}</strong>
                    {f.notes && <div className="muted">{f.notes}</div>}
                  </td>
                  <td>
                    <a href={`tel:${f.phone}`}>{f.phone}</a>
                  </td>
                  <td className="muted">{f.address || '—'}</td>
                  <td>
                    {f.locationLink ? (
                      <a href={f.locationLink} target="_blank" rel="noreferrer">
                        Map pin ↗
                      </a>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                  <td>
                    <div className="actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => openModal(f)}>
                        Edit
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => remove(f)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <Modal
          title={editing === 'new' ? 'Add farmer' : 'Edit farmer'}
          onClose={() => setEditing(null)}
        >
          <form onSubmit={save}>
            <Field label="Full name">
              <input
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                autoFocus
              />
            </Field>
            <Field label="Phone">
              <input
                className="input"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
              />
            </Field>
            <Field label="Address (optional)">
              <textarea
                className="input"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </Field>
            <Field label="Location link (optional)" hint="Google Maps pin for delivery">
              <input
                className="input"
                type="url"
                value={form.locationLink}
                onChange={(e) => setForm({ ...form, locationLink: e.target.value })}
              />
            </Field>
            <Field label="Photo URL (optional)">
              <input
                className="input"
                type="url"
                value={form.photoUrl}
                onChange={(e) => setForm({ ...form, photoUrl: e.target.value })}
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
              {busy ? 'Saving…' : 'Save farmer'}
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}
