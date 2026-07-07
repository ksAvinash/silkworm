'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import { firebaseReady, getDb } from './firebase';
import type { Batch, Breed, Farmer, Order } from './types';

/**
 * Live-subscribe to a tenant subcollection, newest first.
 * Returns [items, loading].
 */
export function useTenantCollection<T extends { id: string }>(
  tenantId: string | null,
  name: 'breeds' | 'batches' | 'farmers' | 'orders',
): [T[], boolean] {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseReady || !tenantId) {
      setLoading(false);
      return;
    }
    const q = query(collection(getDb(), 'tenants', tenantId, name), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snap) => {
        setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T));
        setLoading(false);
      },
      () => setLoading(false),
    );
  }, [tenantId, name]);

  return [items, loading];
}

/**
 * Book a quantity of an open batch for a farmer, atomically enforcing the
 * booking cap (bookedTotal never exceeds batch quantity).
 */
export async function bookOrder(opts: {
  tenantId: string;
  batch: Batch;
  /** The batch's breed, if loaded — its prices are snapshotted onto the order. */
  breed?: Breed;
  farmer: Farmer;
  quantity: number;
  batchLabel: string;
  adminUid: string;
}): Promise<void> {
  const db = getDb();
  const batchRef = doc(db, 'tenants', opts.tenantId, 'batches', opts.batch.id);
  const orderRef = doc(collection(db, 'tenants', opts.tenantId, 'orders'));

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(batchRef);
    if (!snap.exists()) throw new Error('Batch no longer exists.');
    const b = snap.data() as Batch;
    if (!b.bookingOpen) throw new Error('This batch is not open for booking.');
    const remaining = b.quantity - (b.bookedTotal ?? 0);
    if (opts.quantity > remaining) {
      throw new Error(`Only ${remaining.toLocaleString()} qty remaining on this batch.`);
    }
    tx.update(batchRef, { bookedTotal: increment(opts.quantity) });
    tx.set(orderRef, {
      farmerId: opts.farmer.id,
      farmerName: opts.farmer.name,
      farmerPhone: opts.farmer.phone,
      batchId: opts.batch.id,
      batchLabel: opts.batchLabel,
      quantity: opts.quantity,
      unitPrice: opts.breed?.sellingPrice ?? 0,
      unitCost: opts.breed?.purchasePrice ?? 0,
      status: 'booked',
      bookedBy: opts.adminUid,
      createdAt: serverTimestamp(),
    });
  });
}

/** Cancel a booking and release its quantity back to the batch. */
export async function cancelOrder(tenantId: string, order: Order): Promise<void> {
  const db = getDb();
  const batchRef = doc(db, 'tenants', tenantId, 'batches', order.batchId);
  const orderRef = doc(db, 'tenants', tenantId, 'orders', order.id);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(batchRef);
    if (snap.exists()) tx.update(batchRef, { bookedTotal: increment(-order.quantity) });
    tx.delete(orderRef);
  });
}

function randomCode(len = 20): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

/**
 * Mark an order delivered: assigns the next invoice number from the tenant's
 * counter and publishes a public verification snapshot for the invoice QR.
 * Returns the verification code the QR should link to.
 */
export async function deliverOrder(opts: {
  tenantId: string;
  tenantName: string;
  order: Order;
}): Promise<{ invoiceNo: string; verifyCode: string }> {
  const db = getDb();
  const tenantRef = doc(db, 'tenants', opts.tenantId);
  const orderRef = doc(db, 'tenants', opts.tenantId, 'orders', opts.order.id);
  const verifyCode = randomCode();
  const verifyRef = doc(db, 'tenants', opts.tenantId, 'verifications', verifyCode);

  let invoiceNo = '';
  await runTransaction(db, async (tx) => {
    const t = await tx.get(tenantRef);
    const tenant = t.data() ?? {};
    const seq = ((tenant.invoiceSeq as number) ?? 0) + 1;
    const prefix = (tenant.invoicePrefix as string) || 'INV-';
    invoiceNo = `${prefix}${String(seq).padStart(5, '0')}`;
    tx.update(tenantRef, { invoiceSeq: seq });
    tx.update(orderRef, {
      status: 'delivered',
      invoiceNo,
      verifyCode,
      deliveredAt: serverTimestamp(),
    });
    tx.set(verifyRef, {
      tenantId: opts.tenantId,
      tenantName: opts.tenantName,
      tenantAddress: (tenant.address as string) ?? '',
      tenantContact: (tenant.contactPhone as string) ?? '',
      invoiceNo,
      farmerName: opts.order.farmerName,
      batchLabel: opts.order.batchLabel,
      quantity: opts.order.quantity,
      amount: opts.order.quantity * (opts.order.unitPrice ?? 0),
      status: 'delivered',
      createdAt: serverTimestamp(),
    });
  });
  return { invoiceNo, verifyCode };
}

/** Absolute URL of the public verification page for a code. */
export function verifyUrl(tenantId: string, code: string): string {
  const base = process.env.NEXT_PUBLIC_BASE_PATH || '';
  return `${window.location.origin}${base}/verify/?t=${tenantId}&c=${code}`;
}
