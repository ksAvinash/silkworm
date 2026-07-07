import type { Timestamp } from 'firebase/firestore';

export interface Tenant {
  id: string;
  name: string;
  adminPhone: string;
  status: 'active' | 'suspended';
  invoiceSeq?: number;
  /** Invoice number prefix, e.g. "BCR-" → BCR-00001. Defaults to "INV-". */
  invoicePrefix?: string;
  /** Business address, shown on public verification pages. */
  address?: string;
  /** Public contact phone, shown on public verification pages. */
  contactPhone?: string;
  createdAt?: Timestamp;
}

export interface Breed {
  id: string;
  name: string;
  code: string;
  /** What you pay per unit (egg/DFL), ₹ — feeds cost & margin in reports. */
  purchasePrice?: number | null;
  /** What a farmer pays per unit, ₹ — feeds booking value and invoices. */
  sellingPrice?: number | null;
  notes?: string;
  createdAt?: Timestamp;
}

export interface Batch {
  id: string;
  breedId: string;
  breedName: string;
  quantity: number;
  bookedTotal: number;
  availableDate: string; // ISO date (yyyy-mm-dd)
  bookingOpen: boolean;
  notes?: string;
  createdAt?: Timestamp;
}

export interface Farmer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  locationLink?: string;
  photoUrl?: string;
  notes?: string;
  createdAt?: Timestamp;
}

export type OrderStatus = 'booked' | 'allocated' | 'delivered';

export interface Order {
  id: string;
  farmerId: string;
  farmerName: string;
  farmerPhone: string;
  batchId: string;
  batchLabel: string; // e.g. "SCR — 5000 qty — 2026-07-20"
  quantity: number;
  /** Breed prices snapshotted at booking time, so later edits don't rewrite history. */
  unitPrice?: number;
  unitCost?: number;
  status: OrderStatus;
  invoiceNo?: string;
  verifyCode?: string;
  bookedBy: string; // admin uid
  createdAt?: Timestamp;
  deliveredAt?: Timestamp;
}

export interface Verification {
  tenantId: string;
  tenantName: string;
  tenantAddress?: string;
  tenantContact?: string;
  invoiceNo: string;
  farmerName: string;
  batchLabel: string;
  quantity: number;
  /** Invoice total (quantity × unit price), 0 when the breed had no price. */
  amount?: number;
  status: OrderStatus;
  createdAt?: Timestamp;
}

/** Format a number as Indian rupees, e.g. 12345.5 → "₹12,345.50". */
export function inr(n: number): string {
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export function batchLabel(b: Pick<Batch, 'breedName' | 'quantity' | 'availableDate'>): string {
  return `${b.breedName} — ${b.quantity.toLocaleString()} qty — ${b.availableDate}`;
}
