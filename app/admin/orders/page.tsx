'use client';

import { useEffect, useState } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { QRCodeSVG } from 'qrcode.react';
import { getDb } from '@/lib/firebase';
import { useAuth } from '@/lib/auth';
import { bookOrder, cancelOrder, deliverOrder, useTenantCollection, verifyUrl } from '@/lib/db';
import { batchLabel, type Batch, type Farmer, type Order, type Tenant } from '@/lib/types';
import { Badge, EmptyState, ErrorNote, Field, Modal, Spinner } from '@/components/ui';

const STATUS_TONE = { booked: 'amber', allocated: 'blue', delivered: 'green' } as const;

export default function OrdersPage() {
  const { tenantId, user } = useAuth();
  const [orders, loading] = useTenantCollection<Order>(tenantId, 'orders');
  const [batches] = useTenantCollection<Batch>(tenantId, 'batches');
  const [farmers] = useTenantCollection<Farmer>(tenantId, 'farmers');
  const [tenantName, setTenantName] = useState('');
  const [booking, setBooking] = useState(false);
  const [invoiceFor, setInvoiceFor] = useState<Order | null>(null);
  const [form, setForm] = useState({ farmerId: '', batchId: '', quantity: '' });
  const [filter, setFilter] = useState<'all' | Order['status']>('all');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!tenantId) return;
    return onSnapshot(doc(getDb(), 'tenants', tenantId), (snap) => {
      setTenantName(((snap.data() as Tenant | undefined)?.name as string) ?? '');
    });
  }, [tenantId]);

  const openBatches = batches.filter((b) => b.bookingOpen && b.bookedTotal < b.quantity);

  const submitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId || !user) return;
    const batch = batches.find((b) => b.id === form.batchId);
    const farmer = farmers.find((f) => f.id === form.farmerId);
    if (!batch || !farmer) return;
    setBusy(true);
    setError(null);
    try {
      await bookOrder({
        tenantId,
        batch,
        farmer,
        quantity: Number(form.quantity),
        batchLabel: batchLabel(batch),
        adminUid: user.uid,
      });
      setBooking(false);
      setForm({ farmerId: '', batchId: '', quantity: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Booking failed.');
    } finally {
      setBusy(false);
    }
  };

  const allocate = async (order: Order) => {
    if (!tenantId) return;
    await updateDoc(doc(getDb(), 'tenants', tenantId, 'orders', order.id), {
      status: 'allocated',
    });
  };

  const deliver = async (order: Order) => {
    if (!tenantId) return;
    if (!confirm(`Mark ${order.farmerName}’s order as delivered and generate the invoice?`))
      return;
    try {
      const { invoiceNo, verifyCode } = await deliverOrder({
        tenantId,
        tenantName: tenantName || 'Silkworm distributor',
        order,
      });
      setInvoiceFor({ ...order, status: 'delivered', invoiceNo, verifyCode });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to mark delivered.');
    }
  };

  const cancel = async (order: Order) => {
    if (!tenantId) return;
    if (
      !confirm(
        `Cancel ${order.farmerName}’s booking of ${order.quantity.toLocaleString()}? The quantity returns to the batch.`,
      )
    )
      return;
    await cancelOrder(tenantId, order);
  };

  const shown = filter === 'all' ? orders : orders.filter((o) => o.status === filter);
  const selectedBatch = batches.find((b) => b.id === form.batchId);
  const remaining = selectedBatch
    ? selectedBatch.quantity - selectedBatch.bookedTotal
    : undefined;

  return (
    <>
      <div className="page-head">
        <h1>Bookings</h1>
        <button className="btn btn-primary" onClick={() => setBooking(true)}>
          + New booking
        </button>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {(['all', 'booked', 'allocated', 'delivered'] as const).map((s) => (
          <button
            key={s}
            className={`nav-link${filter === s ? ' active' : ''}`}
            style={{ border: 'none', background: filter === s ? undefined : 'transparent', cursor: 'pointer', font: 'inherit' }}
            onClick={() => setFilter(s)}
          >
            {s === 'all' ? 'All' : s[0].toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner label="Loading bookings…" />
      ) : shown.length === 0 ? (
        <EmptyState
          title={filter === 'all' ? 'No bookings yet' : `No ${filter} orders`}
          hint={
            filter === 'all'
              ? 'When a farmer calls in, record their booking against an open batch here.'
              : undefined
          }
        />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Farmer</th>
                <th>Batch</th>
                <th>Qty</th>
                <th>Status</th>
                <th>Invoice</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {shown.map((o) => (
                <tr key={o.id}>
                  <td>
                    <strong>{o.farmerName}</strong>
                    <div className="muted">{o.farmerPhone}</div>
                  </td>
                  <td>{o.batchLabel}</td>
                  <td>{o.quantity.toLocaleString()}</td>
                  <td>
                    <Badge tone={STATUS_TONE[o.status]}>{o.status}</Badge>
                  </td>
                  <td>
                    {o.invoiceNo ? (
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setInvoiceFor(o)}
                      >
                        {o.invoiceNo}
                      </button>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                  <td>
                    <div className="actions">
                      {o.status === 'booked' && (
                        <>
                          <button className="btn btn-ghost btn-sm" onClick={() => allocate(o)}>
                            Allocate
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => cancel(o)}>
                            Cancel
                          </button>
                        </>
                      )}
                      {o.status === 'allocated' && (
                        <button className="btn btn-primary btn-sm" onClick={() => deliver(o)}>
                          Mark delivered
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {booking && (
        <Modal title="New phone-in booking" onClose={() => setBooking(false)}>
          {farmers.length === 0 ? (
            <p className="muted">Add the farmer’s profile first (Farmers → Add farmer).</p>
          ) : openBatches.length === 0 ? (
            <p className="muted">
              No batches are open for booking. Open one from the Batches page first.
            </p>
          ) : (
            <form onSubmit={submitBooking}>
              <Field label="Farmer">
                <select
                  className="input"
                  value={form.farmerId}
                  onChange={(e) => setForm({ ...form, farmerId: e.target.value })}
                  required
                >
                  <option value="">Select a farmer…</option>
                  {farmers.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} — {f.phone}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Open batch">
                <select
                  className="input"
                  value={form.batchId}
                  onChange={(e) => setForm({ ...form, batchId: e.target.value })}
                  required
                >
                  <option value="">Select a batch…</option>
                  {openBatches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {batchLabel(b)} ({(b.quantity - b.bookedTotal).toLocaleString()} left)
                    </option>
                  ))}
                </select>
              </Field>
              <Field
                label="Quantity"
                hint={
                  remaining !== undefined
                    ? `${remaining.toLocaleString()} remaining on this batch`
                    : undefined
                }
              >
                <input
                  className="input"
                  type="number"
                  min={1}
                  max={remaining}
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  required
                />
              </Field>
              <ErrorNote message={error} />
              <button className="btn btn-primary" style={{ width: '100%' }} disabled={busy}>
                {busy ? 'Booking…' : 'Confirm booking'}
              </button>
            </form>
          )}
        </Modal>
      )}

      {invoiceFor?.verifyCode && tenantId && (
        <Modal title={`Invoice ${invoiceFor.invoiceNo}`} onClose={() => setInvoiceFor(null)}>
          <div className="qr-box">
            <QRCodeSVG value={verifyUrl(tenantId, invoiceFor.verifyCode)} size={196} marginSize={2} />
            <div>
              <strong>{invoiceFor.farmerName}</strong>
              <div className="muted">
                {invoiceFor.batchLabel} · {invoiceFor.quantity.toLocaleString()} qty
              </div>
            </div>
            <p className="muted">
              Scanning this QR opens the public verification page for this order — no sign-in
              needed.
            </p>
            <a
              className="btn btn-ghost btn-sm"
              href={verifyUrl(tenantId, invoiceFor.verifyCode)}
              target="_blank"
              rel="noreferrer"
            >
              Open verification page ↗
            </a>
          </div>
        </Modal>
      )}
    </>
  );
}
