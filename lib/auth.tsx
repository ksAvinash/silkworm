'use client';

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { onIdTokenChanged, signOut as fbSignOut, type User } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { firebaseReady, getFirebaseAuth, getFunctionsClient } from './firebase';

interface AuthState {
  loading: boolean;
  user: User | null;
  /** Tenant this admin belongs to (custom claim), null if none. */
  tenantId: string | null;
  isSuperAdmin: boolean;
}

interface AuthContextValue extends AuthState {
  signOut: () => Promise<void>;
}

const SESSION_KEY = 'silkworm_session_expiry';
const SESSION_MS = 7 * 24 * 60 * 60 * 1000; // auto sign-out after 7 days

const AuthContext = createContext<AuthContextValue>({
  loading: true,
  user: null,
  tenantId: null,
  isSuperAdmin: false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    loading: firebaseReady,
    user: null,
    tenantId: null,
    isSuperAdmin: false,
  });

  // uid we already tried syncClaims for, so a role-less account doesn't
  // retry the callable on every token refresh.
  const syncTriedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!firebaseReady) return;
    const auth = getFirebaseAuth();
    return onIdTokenChanged(auth, async (user) => {
      if (!user) {
        syncTriedFor.current = null;
        localStorage.removeItem(SESSION_KEY);
        setState({ loading: false, user: null, tenantId: null, isSuperAdmin: false });
        return;
      }

      // Session cap: force sign-out 7 days after the original sign-in.
      const expiry = Number(localStorage.getItem(SESSION_KEY) ?? 0);
      if (!expiry) {
        localStorage.setItem(SESSION_KEY, String(Date.now() + SESSION_MS));
      } else if (Date.now() > expiry) {
        localStorage.removeItem(SESSION_KEY);
        await fbSignOut(auth);
        return;
      }

      let token = await user.getIdTokenResult();
      let tenantId = (token.claims.tenantId as string) ?? null;
      // token.superAdmin is the legacy claim shape, accepted during transition.
      let isSuperAdmin = token.claims.role === 'superadmin' || token.claims.superAdmin === true;

      // No claims in the token yet — ask the syncClaims function to mirror
      // the recorded role (admins/superAdmins doc) into custom claims, then
      // force-refresh the token to pick them up.
      if (!tenantId && !isSuperAdmin && syncTriedFor.current !== user.uid) {
        syncTriedFor.current = user.uid;
        try {
          await httpsCallable(getFunctionsClient(), 'syncClaims')();
          token = await user.getIdTokenResult(true);
          tenantId = (token.claims.tenantId as string) ?? null;
          isSuperAdmin = token.claims.role === 'superadmin' || token.claims.superAdmin === true;
        } catch {
          // No role recorded for this account — leave claims empty.
        }
      }

      setState({ loading: false, user, tenantId, isSuperAdmin });
    });
  }, []);

  const signOut = async () => {
    if (firebaseReady) await fbSignOut(getFirebaseAuth());
  };

  return <AuthContext.Provider value={{ ...state, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
