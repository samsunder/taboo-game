import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, onValue, remove } from "firebase/database";

// Game expiry in days
const GAME_EXPIRY_DAYS = 3;

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

// Create a storage interface that matches the window.storage API
export const firebaseStorage = {
  async get(key, shared) {
    const dbRef = ref(database, key);
    const snapshot = await get(dbRef);

    if (snapshot.exists()) {
      return { key, value: snapshot.val(), shared };
    }
    throw new Error('Key not found');
  },

  async set(key, value, shared) {
    const dbRef = ref(database, key);
    await set(dbRef, value);
    return { key, value, shared };
  },

  async delete(key, shared) {
    const dbRef = ref(database, key);
    const snapshot = await get(dbRef);
    const existed = snapshot.exists();
    await remove(dbRef);
    return { key, deleted: existed, shared };
  },

  async list(prefix, shared) {
    // For simplicity, we'll return empty array
    // In a real app, you'd query based on prefix
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
