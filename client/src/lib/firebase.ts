import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const requiredFirebaseKeys = Object.values(firebaseConfig);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.setCustomParameters({ prompt: 'select_account' });

export const isFirebaseConfigured = () => requiredFirebaseKeys.every(Boolean);

export const getFirebaseAuth = () => {
  if (typeof window === 'undefined') {
    throw new Error('Firebase auth is only available in the browser');
  }

  if (!isFirebaseConfigured()) {
    throw new Error('Firebase Google sign-in is not configured');
  }

  if (!app) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  }

  if (!auth) {
    auth = getAuth(app);
  }

  return auth;
};

export { firebaseConfig };
