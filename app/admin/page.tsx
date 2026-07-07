'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useTenantCollection } from '@/lib/db';
import type { Batch, Farmer, Order } from '@/lib/types';
import { Badge, EmptyState, Spinner, StatCard } from '@/components/ui';

const STATUS_TONE = { booked: 'amber', allocated: 'blue', delivered: 'green' } as const;

const MODULES = [
  {
    id: 'batches',
    href: '/admin/batches/',
    title: 'Batches',
    desc: 'Create batches and open booking windows',
    accent: '#1a7a41',
    bg: '#e4f2e8',
  },
  {
    id: 'bookings',
    href: '/admin/orders/',
    title: 'Bookings',
    desc: 'Phone-in bookings, allocation and delivery',
    accent: '#2b5a82',
    bg: '#e4edf5',
  },
  {
    id: 'farmers',
    href: '/admin/farmers/',
    title: 'Farmers',
    desc: 'Profiles, contacts and delivery pins',
    accent: '#8f6f2d',
    bg: '#f6ecd1',
  },
  {
    id: 'breeds',
    href: '/admin/breeds/',
    title: 'Breeds',
    desc: 'Egg breeds and varieties in your catalog',
    accent: '#00707a',
    bg: '#e8f7f8',
  },
  {
    id: 'reports',
    href: '/admin/reports/',
    title: 'Reports',
    desc: 'Distribution totals and per-farmer history',
    accent: '#6a4d9b',
    bg: '#f1ecfb',
  },
  {
    id: 'settings',
    href: '/admin/settings/',
    title: 'Settings',
    desc: 'Business profile and invoice preferences',
    accent: '#626d64',
    bg: '#f4f5f1',
  },
] as const;

function ModuleIcon({ id }: { id: (typeof MODULES)[number]['id'] }) {
  const p = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  switch (id) {
    case 'batches':
      return (
        <svg viewBox="0 0 24 24" aria-hidden>
          <path d="m12 2 8 4-8 4-8-4 8-4Z" {...p} />
          <path d="m4 10 8 4 8-4" {...p} />
          <path d="m4 14 8 4 8-4" {...p} />
        </svg>
      );
    case 'bookings':
      return (
        <svg viewBox="0 0 24 24" aria-hidden>
          <path
            d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z"
            {...p}
          />
        </svg>
      );
    case 'farmers':
      return (
        <svg viewBox="0 0 24 24" aria-hidden>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" {...p} />
          <circle cx="9" cy="7" r="4" {...p} />
          <path d="M16 3.13a4 4 0 0 1 0 7.74" {...p} />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" {...p} />
        </svg>
      );
    case 'breeds':
      return (
        <svg viewBox="0 0 24 24" aria-hidden>
          <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" {...p} />
          <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" {...p} />
        </svg>
      );
    case 'reports':
      return (
        <svg viewBox="0 0 24 24" aria-hidden>
          <path d="M3 3v16a2 2 0 0 0 2 2h16" {...p} />
          <path d="M7 15v-4" {...p} />
          <path d="M12 15V7" {...p} />
          <path d="M17 15v-6" {...p} />
        </svg>
      );
    case 'settings':
      return (
        <svg viewBox="0 0 24 24" aria-hidden>
          <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3" {...p} />
          <path d="M1 14h6M9 8h6M17 16h6" {...p} />
        </svg>
      );
  }
}

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
  const recent = orders.slice(0, 6);

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

      <div className="hub-grid">
        <div className="card panel">
          <div className="panel-head">
            <h2>Recent bookings</h2>
            <Link href="/admin/orders/" className="muted">
              View all →
            </Link>
          </div>
          {recent.length === 0 ? (
            <EmptyState
              title="No bookings yet"
              hint="Open a batch for booking, then record farmers’ phone-in bookings."
            />
          ) : (
            <div className="table-wrap" style={{ border: 'none' }}>
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
        </div>

        <div className="card panel panel-modules">
          <div className="panel-head">
            <h2>Modules</h2>
          </div>
          <div className="module-list">
            {MODULES.map((m) => (
              <Link
                key={m.id}
                href={m.href}
                className="module-card"
                style={{ ['--module-accent' as string]: m.accent, ['--module-bg' as string]: m.bg }}
              >
                <span className="module-icon" aria-hidden>
                  <ModuleIcon id={m.id} />
                </span>
                <span>
                  <span className="module-title">{m.title}</span>
                  <span className="module-desc">{m.desc}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
