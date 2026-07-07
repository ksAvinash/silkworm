'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from 'firebase/auth';
import { firebaseReady, getFirebaseAuth } from '@/lib/firebase';
import { useAuth } from '@/lib/auth';
import { ErrorNote, Field, Logo, Spinner } from '@/components/ui';

export default function LoginPage() {
  const router = useRouter();
  const { loading, user, tenantId, isSuperAdmin } = useAuth();
  const [phone, setPhone] = useState('+91');
  const [code, setCode] = useState('');
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const verifierRef = useRef<RecaptchaVerifier | null>(null);

  // Already signed in → go straight to the right console.
  useEffect(() => {
    if (loading || !user) return;
    if (isSuperAdmin) router.replace('/super/');
    else if (tenantId) router.replace('/admin/');
  }, [loading, user, tenantId, isSuperAdmin, router]);

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const auth = getFirebaseAuth();
      verifierRef.current ??= new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
      });
      setConfirmation(await signInWithPhoneNumber(auth, phone.trim(), verifierRef.current));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send the code. Try again.');
      verifierRef.current?.clear();
      verifierRef.current = null;
    } finally {
      setBusy(false);
    }
  };

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmation) return;
    setError(null);
    setBusy(true);
    try {
      await confirmation.confirm(code.trim());
      // The auth effect above redirects once claims are loaded.
    } catch {
      setError('That code didn’t match. Check it and try again.');
      setBusy(false);
    }
  };

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
          <h1>Admin sign in</h1>
          <p className="sub">Sign in with the phone number registered for your account.</p>

          {!firebaseReady ? (
            <ErrorNote message="Firebase isn’t configured yet. Copy .env.local.example to .env.local, fill in your Firebase project keys, and restart the dev server." />
          ) : loading ? (
            <Spinner label="Checking session…" />
          ) : user ? (
            <p className="muted">
              Signed in. {tenantId || isSuperAdmin ? 'Redirecting…' : 'No admin role is assigned to this account yet — contact the platform administrator.'}
            </p>
          ) : !confirmation ? (
            <form onSubmit={sendCode}>
              <Field label="Phone number" hint="Include the country code, e.g. +91 98765 43210">
                <input
                  className="input"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </Field>
              <ErrorNote message={error} />
              <button className="btn btn-primary" style={{ width: '100%' }} disabled={busy}>
                {busy ? 'Sending…' : 'Send verification code'}
              </button>
            </form>
          ) : (
            <form onSubmit={verifyCode}>
              <Field label={`Code sent to ${phone}`} hint="Enter the 6-digit code from the SMS">
                <input
                  className="input"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  autoFocus
                  required
                />
              </Field>
              <ErrorNote message={error} />
              <button className="btn btn-primary" style={{ width: '100%' }} disabled={busy}>
                {busy ? 'Verifying…' : 'Verify & sign in'}
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ width: '100%', marginTop: 10 }}
                onClick={() => {
                  setConfirmation(null);
                  setCode('');
                  setError(null);
                }}
              >
                Use a different number
              </button>
            </form>
          )}
          <div id="recaptcha-container" />
        </div>
      </main>
    </>
  );
}
