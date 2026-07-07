'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useTenantCollection } from '@/lib/db';
import type { Batch, Farmer, Order } from '@/lib/types';
import { Badge, EmptyState, Spinner, StatCard } from '@/components/ui';

const STATUS_TONE = { booked: 'amber', allocated: 'blue', delivered: 'green' } as const;

export default function AdminDashboard() {
  const { tenantId } = useAuth();
  const [batches, batchesLoading] = useTenantCollection<Batch>(tenantId, 'batches');
  const [orders, ordersLoading] = useTenantCollection<Order>(tenantId, 'orders');
  const [farmers] = useTenantCollection<Farmer>(tenantId, 'farmers');

  if (batchesLoading || ordersLoading) return <Spinner label="Loading dashboard…" />;

  const openBatches = batches.filter((b) => b.bookingOpen);
  const bookedQty = orders.reduce((sum, o) => sum + o.quantity, 0);
  const deliveredQty = orders
    .filter((o) => o.status === 'delivered')
    .reduce((sum, o) => sum + o.quantity, 0);
  const recent = orders.slice(0, 8);

  return (
    <>
      <div className="page-head">
        <h1>Dashboard</h1>
        <Link href="/admin/orders/" className="btn btn-primary">
          + New booking
        </Link>
      </div>

      <div className="stat-grid">
        <StatCard label="Open for booking" value={openBatches.length} sub={`${batches.length} batches total`} />
        <StatCard label="Qty booked" value={bookedQty.toLocaleString()} />
        <StatCard label="Qty delivered" value={deliveredQty.toLocaleString()} />
        <StatCard label="Farmers" value={farmers.length} />
      </div>

      <div className="page-head">
        <h2 style={{ fontSize: '1.1rem' }}>Recent bookings</h2>
        <Link href="/admin/orders/" className="muted">
          View all →
        </Link>
      </div>

      {recent.length === 0 ? (
        <EmptyState
          title="No bookings yet"
          hint="Open a batch for booking, then record farmers’ phone-in bookings here."
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
              </tr>
            </thead>
            <tbody>
              {recent.map((o) => (
                <tr key={o.id}>
                  <td>{o.farmerName}</td>
                  <td>{o.batchLabel}</td>
                  <td>{o.quantity.toLocaleString()}</td>
                  <td>
                    <Badge tone={STATUS_TONE[o.status]}>{o.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
