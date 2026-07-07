'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, signOut as fbSignOut, type User } from 'firebase/auth';
import { firebaseReady, getFirebaseAuth } from './firebase';

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

  useEffect(() => {
    if (!firebaseReady) return;
    const auth = getFirebaseAuth();
    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setState({ loading: false, user: null, tenantId: null, isSuperAdmin: false });
        return;
      }
      const token = await user.getIdTokenResult();
      setState({
        loading: false,
        user,
        tenantId: (token.claims.tenantId as string) ?? null,
        isSuperAdmin: token.claims.superAdmin === true,
      });
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
