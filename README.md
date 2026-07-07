# Silkworm

A web platform for silkworm-rearing farmers to manage the egg catalog and track
batching/distribution of eggs to pre-booked farmers.

Built with [Next.js](https://nextjs.org/), statically exported and hosted on
[GitHub Pages](https://pages.github.com/), backed by
[Firebase Cloud Firestore](https://firebase.google.com/docs/firestore) and
[Firebase Authentication](https://firebase.google.com/docs/auth).

## Overview

Egg distributors ("admins") maintain a catalog of silkworm egg breeds and
production batches. A batch only accepts pre-bookings once an admin opens it
for booking. Farmers can pre-book eggs from an open batch either by signing
in themselves, or over a phone call — in which case an admin books on their
behalf. Admins allocate each batch across pre-booked farmers and track
delivery status through to completion. Every completed order generates an
invoice with a unique QR code that links to a public, read-only verification
page — so anyone (e.g. a delivery agent) can confirm an order's authenticity
without signing in.

## Roles

- **Admin (distributor)** — manages breeds, opens batches for booking,
  books on behalf of farmers who call in, allocates batches, marks orders as
  delivered, views reporting/dashboard.
- **Farmer** — signs in, maintains their profile, browses open batches,
  pre-books eggs, views their own orders and invoices.

## Features

- **Catalog** — browse egg breeds/varieties and batch availability.
- **Batch booking window** — a batch is only open for pre-booking once an
  admin explicitly opens it; otherwise it's catalog-only (not yet bookable).
- **Booking cap** — total pre-booked quantity against a batch cannot exceed
  its stated quantity (e.g. a 5000-qty batch stops accepting bookings once
  5000 is reached).
- **Pre-booking, two ways** — farmers pre-book themselves via login, or call
  in and have an admin book on their behalf.
- **Farmer profiles** — name, address, location link (e.g. maps pin), photo,
  and other fields useful for delivery/verification.
- **Batch lifecycle** — batch opened → allocate to pre-booked farmers →
  deliver.
- **Invoicing** — per-order invoice with a unique QR code.
- **Public order verification** — scanning an invoice QR opens a read-only
  page showing order/batch details, no login required.
- **Reporting dashboard** — distribution totals, per-farmer history, and
  batch-level stats.
- **Mobile-friendly** — responsive UI throughout, since admins often book on
  behalf of farmers over the phone while away from a desk, and farmers
  primarily browse/book from their phones.

## Pages

| Page | Access | Description |
|---|---|---|
| Home | Public | Introduction to the platform |
| Login / Sign up | Public | Farmer and admin authentication via phone number OTP |
| Catalog | Signed-in farmers | Browse breeds and upcoming batches |
| Farmer dashboard | Signed-in farmers | Pre-book eggs, view own orders/invoices |
| Admin dashboard | Admin | Manage breeds, create/allocate batches, mark deliveries |
| Reports | Admin | Distribution and batch reporting |
| Order verification | Public (via QR) | Read-only invoice/order details |

## Tech stack

- **Next.js** — static export (`output: 'export'`) so the site can be served
  from GitHub Pages
- **Responsive design** — mobile-first layout so admins and farmers can use
  the full booking/allocation workflow from a phone
- **Firebase Cloud Firestore** — catalog, batches, orders/allocations
- **Firebase Authentication** — phone number + OTP sign-in for farmers and
  admins (no Google/social sign-in)
- **Firebase Cloud Functions** — server-side logic that can't run on a static
  host (e.g. invoice number generation, notifications)

## Architecture note

GitHub Pages only serves static files, so this app has no Next.js server or
API routes at runtime. All Firestore/Auth access happens client-side via the
Firebase JS SDK, secured with Firestore security rules. Any logic that must
run server-side (e.g. sensitive writes, invoice generation) is implemented as
a Firebase Cloud Function, deployed and hosted separately from the static
site — the two are decoupled but share the same Firebase project.

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

- `breeds` — egg breed/variety metadata (e.g. "SCR")
- `batches` — production batches: breed, quantity, date (e.g. "SCR Eggs —
  5000 qty — 20th July"), booking status (closed/open), running total
  booked (capped at quantity), allocation, delivery status
- `orders` — a farmer's pre-booking against an open batch (allocation,
  delivery status, invoice/QR reference, booked-via login-or-phone +
  booked-by admin if phone)
- `farmers` — farmer profile (name, address, location link, photo, contact
  info), keyed by Firebase Auth UID where the farmer has an account
- `users` — admin accounts, keyed by Firebase Auth UID

## License

TBD
