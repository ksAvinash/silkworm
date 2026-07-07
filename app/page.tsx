import Link from 'next/link';
import { Logo } from '@/components/ui';
import { Reveal } from '@/components/reveal';

const MARQUEE = [
  'Breed catalog',
  'Booking windows',
  'Hard quantity caps',
  'Phone-in bookings',
  'Farmer profiles',
  'QR-verified invoices',
  'Delivery tracking',
  'Reports',
];

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
            Sign in
          </Link>
          <a href="#request-access" className="btn btn-primary btn-sm">
            Request access
          </a>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="container">
            <p className="kicker rise-1">For silkworm-rearing distributors</p>
            <h1 className="rise-2">
              Egg distribution, from <span className="hl">catalog</span> to{' '}
              <span className="hl">delivery</span>.
            </h1>
            <div className="hero-row rise-3">
              <p className="lede">
                Silkworm is where rearers run pre-bookings, batch allocation, and QR-verified
                deliveries — from any phone.
              </p>
              <a href="#request-access" className="btn btn-primary btn-lg">
                Request access →
              </a>
            </div>
          </div>
        </section>

        <div className="marquee" aria-hidden>
          <div className="marquee-track">
            {[0, 1].map((half) => (
              <div className="marquee-half" key={half}>
                {MARQUEE.map((item) => (
                  <span key={item}>
                    {item} <span className="dot">✦</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        <section className="section">
          <div className="container">
            <div className="blocks">
              <Reveal>
                <div className="block block-dark">
                  <h3>Zero over-booking.</h3>
                  <p>
                    The cap is enforced inside the database transaction — a 5,000-qty batch can
                    never book 5,001. Not even with two admins booking at once.
                  </p>
                </div>
              </Reveal>
              <Reveal delay={120}>
                <div className="block block-yellow">
                  <h3>Book in seconds.</h3>
                  <p>
                    A farmer calls, you book on their behalf, and it&apos;s done before the call
                    ends. Profiles, quantities, and history stay attached.
                  </p>
                </div>
              </Reveal>
              <Reveal delay={240}>
                <div className="block block-gray">
                  <h3>Proof on delivery.</h3>
                  <p>
                    Every completed order carries an invoice with a unique QR code — scannable by
                    anyone, verifiable by no one&apos;s word but the database&apos;s.
                  </p>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        <section className="section" id="features" style={{ paddingTop: 0 }}>
          <div className="container">
            <Reveal>
              <div className="section-head">
                <h2>Everything a rearer needs to distribute eggs.</h2>
                <p>
                  Purpose-built for the way egg distribution actually works: pre-bookings over the
                  phone, hard quantity caps, and proof of delivery.
                </p>
              </div>
            </Reveal>
            <div className="feature-grid">
              {FEATURES.map((f, i) => (
                <Reveal key={f.title} delay={(i % 3) * 100}>
                  <div className="feature">
                    <div className="feature-icon" aria-hidden>
                      {f.icon}
                    </div>
                    <h3>{f.title}</h3>
                    <p>{f.text}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <div className="statement">
          <div className="container">
            <Reveal>
              <p>
                Bookings capped at <span className="hl">exactly</span> the batch quantity.
                Invoices verified by <span className="hl">anyone</span>, trusted by everyone.
              </p>
            </Reveal>
          </div>
        </div>

        <section className="section" id="how-it-works" style={{ paddingTop: 0 }}>
          <div className="container">
            <Reveal>
              <div className="section-head">
                <h2>Three steps to a verified delivery.</h2>
              </div>
            </Reveal>
            <div className="steps">
              {STEPS.map((s, i) => (
                <Reveal key={s.title} delay={i * 120}>
                  <div className="step">
                    <span className="step-num">0{i + 1}</span>
                    <h3>{s.title}</h3>
                    <p>{s.text}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="request-access" style={{ paddingTop: 0 }}>
          <div className="container">
            <Reveal>
              <div className="cta-band">
                <h2>Ready to bring your operation online?</h2>
                <p>
                  Silkworm is onboarding distributors now. Tell us about your operation and
                  we&apos;ll set up your account.
                </p>
                <a
                  className="btn btn-lg"
                  href="mailto:kemparaju.avinash@gmail.com?subject=Silkworm%20access%20request&body=Business%20name%3A%0APhone%3A%0ALocation%3A%0AApprox.%20batches%20per%20season%3A"
                >
                  Request access →
                </a>
              </div>
            </Reveal>
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
