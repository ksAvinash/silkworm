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
        setState({ loading: false, user: null, tenantId: null, isSuperAdmin: false });
        return;
      }
      let token = await user.getIdTokenResult();
      let tenantId = (token.claims.tenantId as string) ?? null;
      let isSuperAdmin = token.claims.superAdmin === true;

      // No claims in the token yet — ask the syncClaims function to mirror
      // the recorded role (admins/superAdmins doc) into custom claims, then
      // force-refresh the token to pick them up.
      if (!tenantId && !isSuperAdmin && syncTriedFor.current !== user.uid) {
        syncTriedFor.current = user.uid;
        try {
          await httpsCallable(getFunctionsClient(), 'syncClaims')();
          token = await user.getIdTokenResult(true);
          tenantId = (token.claims.tenantId as string) ?? null;
          isSuperAdmin = token.claims.superAdmin === true;
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
