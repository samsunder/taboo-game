import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, onValue, remove } from "firebase/database";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

// Game expiry in days
const GAME_EXPIRY_DAYS = 3;

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 1000; // 1 second window
const RATE_LIMIT_MAX_ACTIONS = 10; // Max 10 actions per second

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

// Initialize App Check with reCAPTCHA v3
// This protects your Firebase resources from abuse
initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('6Lf4U1MsAAAAAHh7eJXE-if0E2ZcY6wkijpCNTNo'),
  isTokenAutoRefreshEnabled: true
});

// Authentication state
let currentUser = null;
let authReady = false;
let authReadyPromise = null;
let authReadyResolve = null;

// Create a promise that resolves when auth is ready
authReadyPromise = new Promise((resolve) => {
  authReadyResolve = resolve;
});

// Initialize anonymous authentication
const initAuth = async () => {
  return new Promise((resolve, reject) => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        currentUser = user;
        authReady = true;
        authReadyResolve();
        console.log('Authenticated anonymously:', user.uid);
        resolve(user);
      } else {
        try {
          const result = await signInAnonymously(auth);
          currentUser = result.user;
          authReady = true;
          authReadyResolve();
          console.log('Signed in anonymously:', result.user.uid);
          resolve(result.user);
        } catch (error) {
          console.error('Anonymous auth failed:', error);
          reject(error);
        }
      }
    });
  });
};

// Start auth initialization
initAuth().catch(console.error);

// Wait for auth to be ready
const waitForAuth = async () => {
  if (authReady) return currentUser;
  await authReadyPromise;
  return currentUser;
};

// Client-side rate limiting
const rateLimitState = {
  actions: [],
};

const checkRateLimit = () => {
  const now = Date.now();
  // Remove actions outside the window
  rateLimitState.actions = rateLimitState.actions.filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS
  );

  if (rateLimitState.actions.length >= RATE_LIMIT_MAX_ACTIONS) {
    throw new Error('Rate limit exceeded. Please slow down.');
  }

  rateLimitState.actions.push(now);
  return true;
};

// Create a storage interface that matches the window.storage API
export const firebaseStorage = {
  async get(key, shared) {
    await waitForAuth();
    checkRateLimit();

    const dbRef = ref(database, key);
    const snapshot = await get(dbRef);

    if (snapshot.exists()) {
      return { key, value: snapshot.val(), shared };
    }
    throw new Error('Key not found');
  },

  async set(key, value, shared) {
    await waitForAuth();
    checkRateLimit();

    const dbRef = ref(database, key);
    await set(dbRef, value);
    return { key, value, shared };
  },

  async delete(key, shared) {
    await waitForAuth();
    checkRateLimit();

    const dbRef = ref(database, key);
    const snapshot = await get(dbRef);
    const existed = snapshot.exists();
    await remove(dbRef);
    return { key, deleted: existed, shared };
  },

  async list(prefix, shared) {
    await waitForAuth();
    return { keys: [], prefix, shared };
  },

  // Helper function to subscribe to real-time updates
  subscribe(key, callback) {
    const dbRef = ref(database, key);
    return onValue(dbRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val());
      }
    });
  },

  // Get current authenticated user
  getCurrentUser() {
    return currentUser;
  },

  // Check if auth is ready
  isAuthReady() {
    return authReady;
  },

  // Cleanup old games
  async cleanupOldGames() {
    try {
      const gamesRef = ref(database, 'game');
      const snapshot = await get(gamesRef);

      if (!snapshot.exists()) return { deleted: 0 };

      const now = Date.now();
      const expiryMs = GAME_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
      let deletedCount = 0;

      const games = snapshot.val();
      const deletePromises = [];

      for (const [gameId, gameData] of Object.entries(games)) {
        const game = typeof gameData === 'string' ? JSON.parse(gameData) : gameData;
        const createdAt = game.createdAt || 0;

        if (now - createdAt > expiryMs) {
          console.log(`Deleting expired game: ${gameId} (created ${Math.floor((now - createdAt) / (24 * 60 * 60 * 1000))} days ago)`);
          deletePromises.push(remove(ref(database, `game/${gameId}`)));
          deletedCount++;
        }
      }

      await Promise.all(deletePromises);
      console.log(`Cleanup complete: deleted ${deletedCount} old games`);
      return { deleted: deletedCount };
    } catch (err) {
      console.error('Cleanup error:', err);
      return { deleted: 0, error: err.message };
    }
  }
};

export { database };
