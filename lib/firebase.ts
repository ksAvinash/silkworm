import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/** True once the Firebase env vars are filled in (.env.local). */
export const firebaseReady = Boolean(config.apiKey && config.projectId && config.appId);

let app: FirebaseApp | null = null;
if (firebaseReady) {
  app = getApps()[0] ?? initializeApp(config);
}

export function getFirebaseAuth(): Auth {
  if (!app) throw new Error('Firebase is not configured. Copy .env.local.example to .env.local and fill it in.');
  return getAuth(app);
}

export function getDb(): Firestore {
  if (!app) throw new Error('Firebase is not configured. Copy .env.local.example to .env.local and fill it in.');
  return getFirestore(app);
}
