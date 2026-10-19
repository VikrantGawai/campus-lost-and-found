/**
 * Firebase configuration.
 * When VITE_FIREBASE_API_KEY is not set (or VITE_FORCE_DEMO_MODE is 'true'),
 * the app runs in local demo mode with seeded data.
 */

let app = null;
let auth = null;
let db = null;
let storage = null;

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const isFirebaseConfigured =
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== 'your_api_key_here' &&
  import.meta.env.VITE_FORCE_DEMO_MODE !== 'true';

if (isFirebaseConfigured) {
  import('firebase/app').then(({ initializeApp }) => {
    app = initializeApp(firebaseConfig);
    import('firebase/auth').then(({ getAuth }) => {
      auth = getAuth(app);
    });
    import('firebase/firestore').then(({ getFirestore }) => {
      db = getFirestore(app);
    });
    import('firebase/storage').then(({ getStorage }) => {
      storage = getStorage(app);
    });
  });
}

export const isDemoMode = !isFirebaseConfigured;
export { app, auth, db, storage };
