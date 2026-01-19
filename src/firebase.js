import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, onValue, remove } from "firebase/database";

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
  }
};

export { database };
