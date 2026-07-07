'use client';

import { useAuth } from '@/lib/auth';
import { useTenantCollection } from '@/lib/db';
import { batchLabel, type Batch, type Farmer, type Order } from '@/lib/types';
import { EmptyState, Spinner, StatCard } from '@/components/ui';

export default function ReportsPage() {
  const { tenantId } = useAuth();
  const [orders, ordersLoading] = useTenantCollection<Order>(tenantId, 'orders');
  const [batches, batchesLoading] = useTenantCollection<Batch>(tenantId, 'batches');
  const [farmers] = useTenantCollection<Farmer>(tenantId, 'farmers');

  if (ordersLoading || batchesLoading) return <Spinner label="Crunching numbers…" />;

  const delivered = orders.filter((o) => o.status === 'delivered');
  const bookedQty = orders.reduce((s, o) => s + o.quantity, 0);
  const deliveredQty = delivered.reduce((s, o) => s + o.quantity, 0);

  // Per-farmer aggregates
  const byFarmer = new Map<string, { name: string; orders: number; qty: number; deliveredQty: number }>();
  for (const o of orders) {
    const row = byFarmer.get(o.farmerId) ?? {
      name: o.farmerName,
      orders: 0,
      qty: 0,
      deliveredQty: 0,
    };
    row.orders += 1;
    row.qty += o.quantity;
    if (o.status === 'delivered') row.deliveredQty += o.quantity;
    byFarmer.set(o.farmerId, row);
  }
  const farmerRows = [...byFarmer.values()].sort((a, b) => b.qty - a.qty);

  // Per-batch aggregates
  const deliveredByBatch = new Map<string, number>();
  for (const o of delivered) {
    deliveredByBatch.set(o.batchId, (deliveredByBatch.get(o.batchId) ?? 0) + o.quantity);
  }

  return (
    <>
      <div className="page-head">
        <h1>Reports</h1>
      </div>

      <div className="stat-grid">
        <StatCard label="Total qty booked" value={bookedQty.toLocaleString()} sub={`${orders.length} orders`} />
        <StatCard label="Total qty delivered" value={deliveredQty.toLocaleString()} sub={`${delivered.length} orders`} />
        <StatCard label="Batches" value={batches.length} sub={`${batches.filter((b) => b.bookingOpen).length} open for booking`} />
        <StatCard label="Farmers served" value={farmerRows.length} sub={`${farmers.length} profiles`} />
      </div>

      <h2 style={{ fontSize: '1.1rem', margin: '26px 0 12px' }}>Batch performance</h2>
      {batches.length === 0 ? (
        <EmptyState title="No batches yet" />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Batch</th>
                <th>Quantity</th>
                <th>Booked</th>
                <th>Delivered</th>
                <th>Fill</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((b) => {
                const pct = b.quantity ? Math.round((b.bookedTotal / b.quantity) * 100) : 0;
                return (
                  <tr key={b.id}>
                    <td>{batchLabel(b)}</td>
                    <td>{b.quantity.toLocaleString()}</td>
                    <td>{b.bookedTotal.toLocaleString()}</td>
                    <td>{(deliveredByBatch.get(b.id) ?? 0).toLocaleString()}</td>
                    <td>{pct}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <h2 style={{ fontSize: '1.1rem', margin: '26px 0 12px' }}>Per-farmer history</h2>
      {farmerRows.length === 0 ? (
        <EmptyState title="No orders yet" />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Farmer</th>
                <th>Orders</th>
                <th>Qty booked</th>
                <th>Qty delivered</th>
              </tr>
            </thead>
            <tbody>
              {farmerRows.map((f) => (
                <tr key={f.name}>
                  <td>{f.name}</td>
                  <td>{f.orders}</td>
                  <td>{f.qty.toLocaleString()}</td>
                  <td>{f.deliveredQty.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
