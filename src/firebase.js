import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, onValue, remove } from "firebase/database";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { getAnalytics } from "firebase/analytics";
import { getFunctions, httpsCallable } from "firebase/functions";

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
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);
const analytics = getAnalytics(app);
const functions = getFunctions(app);

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
        // Pre-warm cloud functions in background (non-blocking)
        cloudFunctions.warmup().catch(() => {});
        resolve(user);
      } else {
        try {
          const result = await signInAnonymously(auth);
          currentUser = result.user;
          authReady = true;
          authReadyResolve();
          console.log('Signed in anonymously:', result.user.uid);
          // Pre-warm cloud functions in background (non-blocking)
          cloudFunctions.warmup().catch(() => {});
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

// V2 Cloud Functions API (secure, server-side word generation)
export const cloudFunctions = {
  // Create a new game using V2 cloud function
  async createGame(hostName, hostEmoji, settings = {}) {
    await waitForAuth();
    const createGameV2 = httpsCallable(functions, 'createGameV2');
    const result = await createGameV2({ hostName, hostEmoji, settings });
    return result.data;
  },

  // Join an existing game
  async joinGame(gameId, playerName, playerEmoji) {
    await waitForAuth();
    const joinGameV2 = httpsCallable(functions, 'joinGameV2');
    const result = await joinGameV2({ gameId, playerName, playerEmoji });
    return result.data;
  },

  // Get game state (words hidden for guessers)
  async getGame(gameId) {
    await waitForAuth();
    const getGameV2 = httpsCallable(functions, 'getGameV2');
    const result = await getGameV2({ gameId });
    return result.data;
  },

  // Start a round (host only, generates words server-side)
  async startRound(gameId, describerId = null) {
    await waitForAuth();
    const startRoundV2 = httpsCallable(functions, 'startRoundV2');
    const result = await startRoundV2({ gameId, describerId });
    return result.data;
  },

  // Submit a guess
  async submitGuess(gameId, guess) {
    await waitForAuth();
    const submitGuessV2 = httpsCallable(functions, 'submitGuessV2');
    const result = await submitGuessV2({ gameId, guess });
    return result.data;
  },

  // Test function
  async ping() {
    const pingFn = httpsCallable(functions, 'ping');
    const result = await pingFn({});
    return result.data;
  },

  // End current round - copies words to public path for break screen display
  async endRound(gameId, options = {}) {
    await waitForAuth();
    const endRoundV2 = httpsCallable(functions, 'endRoundV2');
    const result = await endRoundV2({
      gameId,
      nextDescriberId: options.nextDescriberId,
      isLastRound: options.isLastRound || false,
      breakDuration: options.breakDuration,
      nextPlayingTeam: options.nextPlayingTeam,
      teamDescriberIndex: options.teamDescriberIndex,
      allSubmissions: options.allSubmissions
    });
    return result.data;
  },

  // Update game state (host only)
  async updateGameState(gameId, updates) {
    await waitForAuth();
    const updateGameStateV2 = httpsCallable(functions, 'updateGameStateV2');
    const result = await updateGameStateV2({ gameId, updates });
    return result.data;
  },

  // Finish game - transitions to finished state (host or describer)
  async finishGame(gameId) {
    await waitForAuth();
    const finishGameV2 = httpsCallable(functions, 'finishGameV2');
    const result = await finishGameV2({ gameId });
    return result.data;
  },

  // Leave game
  async leaveGame(gameId) {
    await waitForAuth();
    const leaveGameV2 = httpsCallable(functions, 'leaveGameV2');
    const result = await leaveGameV2({ gameId });
    return result.data;
  },

  // Kick player (host only)
  async kickPlayer(gameId, targetPlayerId) {
    await waitForAuth();
    const kickPlayerV2 = httpsCallable(functions, 'kickPlayerV2');
    const result = await kickPlayerV2({ gameId, targetPlayerId });
    return result.data;
  },

  // Switch team (player switches themselves, or host switches any player)
  async switchTeam(gameId, targetPlayerId) {
    await waitForAuth();
    const switchTeamV2 = httpsCallable(functions, 'switchTeamV2');
    const result = await switchTeamV2({ gameId, targetPlayerId });
    return result.data;
  },

  // Transfer host
  async transferHost(gameId, newHostId) {
    await waitForAuth();
    const transferHostV2 = httpsCallable(functions, 'transferHostV2');
    const result = await transferHostV2({ gameId, newHostId });
    return result.data;
  },

  // Skip turn (describer only)
  async skipTurn(gameId, nextDescriberId, teamDescriberIndex = null) {
    await waitForAuth();
    const skipTurnV2 = httpsCallable(functions, 'skipTurnV2');
    const result = await skipTurnV2({ gameId, nextDescriberId, teamDescriberIndex });
    return result.data;
  },

  // Initiate countdown (describer only)
  async initiateCountdown(gameId, countdownSeconds = 3) {
    await waitForAuth();
    const initiateCountdownV2 = httpsCallable(functions, 'initiateCountdownV2');
    const result = await initiateCountdownV2({ gameId, countdownSeconds });
    return result.data;
  },

  // Set round timing (describer only)
  async setRoundTiming(gameId, roundStartTime, currentRound, currentPlayingTeam) {
    await waitForAuth();
    const setRoundTimingV2 = httpsCallable(functions, 'setRoundTimingV2');
    const result = await setRoundTimingV2({ gameId, roundStartTime, currentRound, currentPlayingTeam });
    return result.data;
  },

  // Update player presence (direct write allowed by rules)
  async updatePresence(gameId, playerId) {
    const presenceRef = ref(database, `gamesV2/${gameId}/players/${playerId}/lastSeen`);
    await set(presenceRef, Date.now());
  },

  // Warmup function - call after auth to pre-warm cloud functions
  async warmup() {
    const warmupV2 = httpsCallable(functions, 'warmupV2');
    const result = await warmupV2({});
    return result.data;
  },

  // Subscribe to V2 game state for real-time updates
  // Returns unsubscribe function
  subscribeToGame(gameId, callback) {
    const gameRef = ref(database, `gamesV2/${gameId}`);
    return onValue(gameRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val());
      } else {
        callback(null);
      }
    }, (error) => {
      console.error('[V2] Subscription error:', error);
    });
  }
};

export { database, analytics };
