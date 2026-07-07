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
import { inr, type Breed } from '@/lib/types';
import { EmptyState, ErrorNote, Field, Modal, Spinner } from '@/components/ui';

export default function BreedsPage() {
  const { tenantId } = useAuth();
  const [breeds, loading] = useTenantCollection<Breed>(tenantId, 'breeds');
  const [editing, setEditing] = useState<Breed | 'new' | null>(null);
  const [form, setForm] = useState({
    name: '',
    code: '',
    purchasePrice: '',
    sellingPrice: '',
    notes: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const openModal = (breed: Breed | 'new') => {
    setEditing(breed);
    setError(null);
    setForm(
      breed === 'new'
        ? { name: '', code: '', purchasePrice: '', sellingPrice: '', notes: '' }
        : {
            name: breed.name,
            code: breed.code,
            purchasePrice: breed.purchasePrice != null ? String(breed.purchasePrice) : '',
            sellingPrice: breed.sellingPrice != null ? String(breed.sellingPrice) : '',
            notes: breed.notes ?? '',
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
        code: form.code.trim(),
        purchasePrice: form.purchasePrice ? Number(form.purchasePrice) : null,
        sellingPrice: form.sellingPrice ? Number(form.sellingPrice) : null,
        notes: form.notes.trim(),
      };
      if (editing === 'new') {
        await addDoc(collection(getDb(), 'tenants', tenantId, 'breeds'), {
          ...data,
          createdAt: serverTimestamp(),
        });
      } else if (editing) {
        await updateDoc(doc(getDb(), 'tenants', tenantId, 'breeds', editing.id), data);
      }
      setEditing(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save breed.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (breed: Breed) => {
    if (!tenantId) return;
    if (!confirm(`Delete breed “${breed.name}”? Existing batches keep their breed name.`)) return;
    await deleteDoc(doc(getDb(), 'tenants', tenantId, 'breeds', breed.id));
  };

  return (
    <>
      <div className="page-head">
        <h1>Breeds</h1>
        <button className="btn btn-primary" onClick={() => openModal('new')}>
          + Add breed
        </button>
      </div>

      {loading ? (
        <Spinner label="Loading breeds…" />
      ) : breeds.length === 0 ? (
        <EmptyState
          title="No breeds yet"
          hint="Add the egg breeds/varieties you rear (e.g. SCR) — batches are created against a breed."
        />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Code</th>
                <th>Purchase ₹</th>
                <th>Selling ₹</th>
                <th>Notes</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {breeds.map((b) => (
                <tr key={b.id}>
                  <td>{b.name}</td>
                  <td>{b.code}</td>
                  <td>{b.purchasePrice != null ? inr(b.purchasePrice) : <span className="muted">—</span>}</td>
                  <td>{b.sellingPrice != null ? inr(b.sellingPrice) : <span className="muted">—</span>}</td>
                  <td className="muted">{b.notes || '—'}</td>
                  <td>
                    <div className="actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => openModal(b)}>
                        Edit
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => remove(b)}>
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
          title={editing === 'new' ? 'Add breed' : 'Edit breed'}
          onClose={() => setEditing(null)}
        >
          <form onSubmit={save}>
            <Field label="Breed name">
              <input
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                autoFocus
              />
            </Field>
            <Field label="Code" hint="Short code shown on batches, e.g. SCR">
              <input
                className="input"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                required
              />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Purchase price ₹ / unit" hint="What you pay per egg">
                <input
                  className="input"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.purchasePrice}
                  onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })}
                />
              </Field>
              <Field label="Selling price ₹ / unit" hint="What a farmer pays per egg">
                <input
                  className="input"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.sellingPrice}
                  onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Notes (optional)">
              <textarea
                className="input"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </Field>
            <ErrorNote message={error} />
            <button className="btn btn-primary" style={{ width: '100%' }} disabled={busy}>
              {busy ? 'Saving…' : 'Save breed'}
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}
