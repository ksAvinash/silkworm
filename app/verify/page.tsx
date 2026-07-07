'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { firebaseReady, getDb } from '@/lib/firebase';
import type { Verification } from '@/lib/types';
import { Logo, Spinner } from '@/components/ui';

function VerifyContent() {
  const params = useSearchParams();
  const code = params.get('c');
  const [state, setState] = useState<'loading' | 'ok' | 'notfound' | 'nocode'>(
    code ? 'loading' : 'nocode',
  );
  const [data, setData] = useState<Verification | null>(null);

  useEffect(() => {
    if (!code || !firebaseReady) {
      if (code && !firebaseReady) setState('notfound');
      return;
    }
    getDoc(doc(getDb(), 'verifications', code))
      .then((snap) => {
        if (snap.exists()) {
          setData(snap.data() as Verification);
          setState('ok');
        } else {
          setState('notfound');
        }
      })
      .catch(() => setState('notfound'));
  }, [code]);

  if (state === 'loading') return <Spinner label="Verifying order…" />;

  if (state === 'nocode') {
    return (
      <>
        <h1>Order verification</h1>
        <p className="sub">
          Scan the QR code on a Silkworm invoice to open this page with the order&apos;s
          verification code. Details appear here automatically — no sign-in needed.
        </p>
      </>
    );
  }

  if (state === 'notfound' || !data) {
    return (
      <>
        <h1>Order verification</h1>
        <div className="verify-status bad">✕ No matching order found</div>
        <p className="muted">
          This code doesn&apos;t match any order. The invoice may be invalid — check that the
          full QR link was opened.
        </p>
      </>
    );
  }

  return (
    <>
      <h1>Order verification</h1>
      <div className="verify-status ok">✓ Verified authentic order</div>
      <dl className="detail-list">
        <div className="detail-row">
          <dt>Invoice</dt>
          <dd>{data.invoiceNo}</dd>
        </div>
        <div className="detail-row">
          <dt>Distributor</dt>
          <dd>{data.tenantName}</dd>
        </div>
        <div className="detail-row">
          <dt>Farmer</dt>
          <dd>{data.farmerName}</dd>
        </div>
        <div className="detail-row">
          <dt>Batch</dt>
          <dd>{data.batchLabel}</dd>
        </div>
        <div className="detail-row">
          <dt>Quantity</dt>
          <dd>{data.quantity.toLocaleString()}</dd>
        </div>
        <div className="detail-row">
          <dt>Status</dt>
          <dd>Delivered</dd>
        </div>
      </dl>
    </>
  );
}

export default function VerifyPage() {
  return (
    <>
      <header className="topbar">
        <div className="container topbar-inner">
          <Link href="/" className="brand">
            <Logo /> Silkworm
          </Link>
        </div>
      </header>
      <main className="center-page">
        <div className="card auth-card">
          <Suspense fallback={<Spinner />}>
            <VerifyContent />
          </Suspense>
        </div>
      </main>
    </>
  );
}
