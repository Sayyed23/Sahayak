
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { initializeFirestore, CACHE_SIZE_UNLIMITED, memoryLocalCache, persistentLocalCache } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// A comprehensive check to see if Firebase has been configured.
export const firebaseInitialized = !!(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.storageBucket &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.appId &&
    !firebaseConfig.apiKey.startsWith('REPLACE_WITH')
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (firebaseInitialized) {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    // Use initializeFirestore with cache settings to enable offline persistence
    // This replaces the deprecated enableIndexedDbPersistence()
    try {
        db = initializeFirestore(app, {
            localCache: persistentLocalCache({ cacheSizeBytes: CACHE_SIZE_UNLIMITED }),
        });
    } catch (e) {
        // This can happen in certain browser environments (e.g., private browsing)
        // or if persistence has already been initialized in another tab.
        // We fall back to in-memory cache.
        console.warn("Could not enable Firestore persistence. Falling back to in-memory cache.", e);
        db = initializeFirestore(app, {
            localCache: memoryLocalCache(),
        });
    }
} else {
    // This warning will be shown in the server console if env vars are missing
    console.warn(
        "Firebase environment variables are not set or are incomplete. Firebase features will be disabled. Please check your .env file."
    );
}

export { app, auth, db };
