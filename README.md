# Silkworm

A web platform for silkworm-rearing farmers to manage the egg catalog and track
batching/distribution of eggs to pre-booked farmers.

Built with [Next.js](https://nextjs.org/), statically exported and hosted on
[GitHub Pages](https://pages.github.com/), backed by
[Firebase Cloud Firestore](https://firebase.google.com/docs/firestore) and
[Firebase Authentication](https://firebase.google.com/docs/auth).

## Overview

Silkworm is **multi-tenant**: each tenant is a silkworm-rearing admin
(distributor) running their own independent operation — their own breeds,
batches, farmers, and orders, isolated from every other tenant. Tenants are
onboarded by a platform super-admin.

Within a tenant, the admin maintains a catalog of silkworm egg breeds and
production batches. A batch only accepts pre-bookings once the admin opens it
for booking. In this first release, farmers do not sign in — all pre-booking
happens over a phone call, with the admin booking on the farmer's behalf and
maintaining their profile. The admin allocates each batch across pre-booked
farmers and tracks delivery status through to completion. Every completed
order generates an invoice with a unique QR code that links to a public,
read-only verification page — so anyone (e.g. a delivery agent) can confirm
an order's authenticity without signing in.

Because farmer records are per-tenant, the same real-world farmer (e.g. same
phone number) can have an independent profile and order history with
multiple different tenants.

## Roles

- **Super admin (platform)** — onboards and manages tenants; no visibility
  into a tenant's day-to-day catalog/batch data beyond what's needed to
  administer the platform.
- **Admin (tenant / rearer)** — scoped to their own tenant only; manages
  breeds, opens batches for booking, books on behalf of farmers who call in,
  maintains farmer profiles, allocates batches, marks orders as delivered,
  views their tenant's reporting/dashboard.
- **Farmer** — no login in this release. Profile and bookings are entered
  and maintained by the tenant admin on the farmer's behalf.

## Features

- **Catalog** — browse egg breeds/varieties and batch availability.
- **Batch booking window** — a batch is only open for pre-booking once an
  admin explicitly opens it; otherwise it's catalog-only (not yet bookable).
- **Booking cap** — total pre-booked quantity against a batch cannot exceed
  its stated quantity (e.g. a 5000-qty batch stops accepting bookings once
  5000 is reached).
- **Phone-in pre-booking** — farmers call in; the tenant admin books on their
  behalf (no farmer login in this release).
- **Farmer profiles** — name, address, location link (e.g. maps pin), photo,
  and other fields useful for delivery/verification, scoped to the tenant
  that maintains them.
- **Multi-tenancy** — each rearer/admin operates in an isolated tenant with
  their own breeds, batches, farmers, and orders.
- **Batch lifecycle** — batch opened → allocate to pre-booked farmers →
  deliver.
- **Invoicing** — per-order invoice with a unique QR code.
- **Public order verification** — scanning an invoice QR opens a read-only
  page showing order/batch details, no login required.
- **Reporting dashboard** — distribution totals, per-farmer history, and
  batch-level stats.
- **Mobile-friendly** — responsive UI throughout, since admins often book on
  behalf of farmers over the phone while away from a desk.

## Pages

| Page | Access | Description |
|---|---|---|
| Home | Public | Introduction to the platform |
| Login | Public | Admin authentication via phone number OTP |
| Admin dashboard | Admin (tenant) | Manage breeds, create/allocate batches, manage farmer profiles, book on a farmer's behalf, mark deliveries |
| Reports | Admin (tenant) | Distribution and batch reporting for their tenant |
| Tenant management | Super admin | Onboard/manage tenants |
| Order verification | Public (via QR) | Read-only invoice/order details |

## Tech stack

- **Next.js** — static export (`output: 'export'`) so the site can be served
  from GitHub Pages
- **Responsive design** — mobile-first layout so admins and farmers can use
  the full booking/allocation workflow from a phone
- **Firebase Cloud Firestore** — multi-tenant catalog, batches, farmers, and
  orders/allocations
- **Firebase Authentication** — phone number + OTP sign-in for admins and the
  super admin (no Google/social sign-in; no farmer login in this release)
- **Firebase Cloud Functions** — server-side logic that can't run on a static
  host (e.g. tenant onboarding, invoice number generation, notifications)

## Architecture note

GitHub Pages only serves static files, so this app has no Next.js server or
API routes at runtime. All Firestore/Auth access happens client-side via the
Firebase JS SDK, secured with Firestore security rules. Any logic that must
run server-side (e.g. sensitive writes, invoice generation) is implemented as
a Firebase Cloud Function, deployed and hosted separately from the static
site — the two are decoupled but share the same Firebase project.

**Multi-tenancy** is enforced at the data layer: each admin is tagged with a
`tenantId` (via a Firebase custom claim, set when the super admin creates the
tenant), and Firestore security rules restrict every read/write to documents
under that admin's own `/tenants/{tenantId}` subtree. The super admin's
claim allows tenant-management operations only, not access to tenant data.

## Getting started

```bash
git clone https://github.com/<your-org-or-user>/silkworm.git
cd silkworm
npm install
```

Create a `.env.local` with your Firebase project config:

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

Run the dev server:

```bash
npm run dev
```

Build the static site (output goes to `out/`):

```bash
npm run build
```

## Deployment

The static export in `out/` is published to GitHub Pages, typically via a
GitHub Actions workflow that builds on push to `main` and deploys to the
`gh-pages` branch (or the `Deploy from a branch` Pages setting).

Firebase Cloud Functions are deployed separately via the Firebase CLI:

```bash
firebase deploy --only functions
```

## Data model (Firestore)

Tenant-scoped data lives under `/tenants/{tenantId}/...` subcollections so
each rearer's data is isolated by construction:

- `tenants/{tenantId}` — tenant metadata (rearer/business name, admin contact,
  created-by super admin, status)
- `tenants/{tenantId}/breeds` — egg breed/variety metadata (e.g. "SCR")
- `tenants/{tenantId}/batches` — production batches: breed, quantity, date
  (e.g. "SCR Eggs — 5000 qty — 20th July"), booking status (closed/open),
  running total booked (capped at quantity), allocation, delivery status
- `tenants/{tenantId}/farmers` — farmer profile (name, address, location
  link, photo, contact info), entered/maintained by the tenant admin
- `tenants/{tenantId}/orders` — a farmer's phone-in pre-booking against an
  open batch (allocation, delivery status, invoice/QR reference, which admin
  booked it)

Platform-level (non-tenant-scoped) data:

- `admins` — tenant admin accounts, keyed by Firebase Auth UID, each tagged
  with the `tenantId` they belong to
- `superAdmins` — platform super-admin accounts, keyed by Firebase Auth UID

## Roadmap (future releases)

This first release is admin-only: tenant admins run their whole operation
(catalog, batches, farmer profiles, phone-in bookings) without any farmer
login. Planned for later releases:

- **Farmer login** — farmers sign in themselves (phone OTP) instead of
  everything being entered by the admin.
- **Self-service pre-booking** — farmers browse open batches and pre-book
  directly, rather than calling the admin in.
- **Paid bookings via payment gateway** — farmers pay to confirm a
  pre-booking, with a payment gateway integration sitting between farmer and
  rearer admin to handle the transaction.

## License

TBD
