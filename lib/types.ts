import type { Timestamp } from 'firebase/firestore';

export interface Tenant {
  id: string;
  name: string;
  adminPhone: string;
  status: 'active' | 'suspended';
  invoiceSeq?: number;
  createdAt?: Timestamp;
}

export interface Breed {
  id: string;
  name: string;
  code: string;
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
  invoiceNo: string;
  farmerName: string;
  batchLabel: string;
  quantity: number;
  status: OrderStatus;
  createdAt?: Timestamp;
}

export function batchLabel(b: Pick<Batch, 'breedName' | 'quantity' | 'availableDate'>): string {
  return `${b.breedName} — ${b.quantity.toLocaleString()} qty — ${b.availableDate}`;
}
