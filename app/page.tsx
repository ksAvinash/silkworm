import Link from 'next/link';
import { Logo } from '@/components/ui';

const FEATURES = [
  {
    icon: '🗂️',
    title: 'Breed catalog',
    text: 'Maintain your egg breeds and varieties in one place, with every production batch listed against its breed, quantity, and date.',
  },
  {
    icon: '📅',
    title: 'Controlled booking windows',
    text: 'A batch accepts pre-bookings only after you open it. Until then it stays catalog-only — no surprise orders.',
  },
  {
    icon: '🧮',
    title: 'Automatic booking cap',
    text: 'Bookings against a batch can never exceed its stated quantity. A 5,000-qty batch stops accepting at exactly 5,000.',
  },
  {
    icon: '📞',
    title: 'Phone-in bookings',
    text: 'Farmers call in; you book on their behalf in seconds and keep their profile — name, address, location pin — up to date.',
  },
  {
    icon: '🧾',
    title: 'QR-verified invoices',
    text: 'Every completed order gets an invoice with a unique QR code. Anyone can scan it to verify the order — no login needed.',
  },
  {
    icon: '📊',
    title: 'Reporting dashboard',
    text: 'Distribution totals, per-farmer history, and batch-level stats, always current, on any device.',
  },
];

const STEPS = [
  {
    title: 'Publish a batch',
    text: 'Add a production batch to your catalog — breed, quantity, and availability date — and open it for booking when ready.',
  },
  {
    title: 'Book for farmers',
    text: 'As farmers call in, record their pre-booking against the open batch. The cap is enforced automatically.',
  },
  {
    title: 'Allocate & deliver',
    text: 'Allocate the batch across booked farmers, mark deliveries, and hand over a QR-verified invoice with each order.',
  },
];

export default function HomePage() {
  return (
    <>
      <header className="topbar">
        <div className="container topbar-inner">
          <Link href="/" className="brand">
            <Logo /> Silkworm
          </Link>
          <span className="topbar-spacer" />
          <Link href="/login/" className="btn btn-ghost btn-sm">
            Admin sign in
          </Link>
        </div>
      </header>

      <main>
        <section className="hero">
          <span className="eyebrow">For silkworm-rearing distributors</span>
          <h1>Run your egg distribution from catalog to delivery</h1>
          <p className="lede">
            Silkworm manages your breed catalog, batch pre-bookings, farmer profiles, and
            deliveries — with QR-verified invoices your farmers and delivery agents can trust.
          </p>
          <div className="hero-cta">
            <a href="#request-access" className="btn btn-primary">
              Request access
            </a>
            <a href="#how-it-works" className="btn btn-ghost">
              See how it works
            </a>
          </div>
        </section>

        <section className="section section-alt" id="features">
          <div className="container">
            <h2>Everything a rearer needs to distribute eggs</h2>
            <p className="section-sub">
              Purpose-built for the way egg distribution actually works: pre-bookings over the
              phone, hard quantity caps, and proof of delivery.
            </p>
            <div className="feature-grid">
              {FEATURES.map((f) => (
                <div className="feature" key={f.title}>
                  <div className="feature-icon" aria-hidden>
                    {f.icon}
                  </div>
                  <h3>{f.title}</h3>
                  <p>{f.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="how-it-works">
          <div className="container">
            <h2>How it works</h2>
            <p className="section-sub">
              Three steps from a new production batch to a verified delivery.
            </p>
            <div className="steps">
              {STEPS.map((s, i) => (
                <div className="step" key={s.title}>
                  <span className="step-num">{i + 1}</span>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="request-access">
          <div className="container">
            <div className="cta-band">
              <h2>Ready to bring your operation online?</h2>
              <p>
                Silkworm is onboarding distributors now. Tell us about your operation and
                we&apos;ll set up your account.
              </p>
              <a
                className="btn"
                href="mailto:kemparaju.avinash@gmail.com?subject=Silkworm%20access%20request&body=Business%20name%3A%0APhone%3A%0ALocation%3A%0AApprox.%20batches%20per%20season%3A"
              >
                Request access
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="container site-footer">
        <span>
          <Logo size={18} /> Silkworm © {new Date().getFullYear()}
        </span>
        <span>
          Scanned an invoice QR? <Link href="/verify/">Verify an order</Link>
        </span>
      </footer>
    </>
  );
}
