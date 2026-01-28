import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, onValue, remove, update, connectDatabaseEmulator } from "firebase/database";
import { getAuth, signInAnonymously, onAuthStateChanged, connectAuthEmulator } from "firebase/auth";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { getAnalytics } from "firebase/analytics";
import { getFunctions, httpsCallable, connectFunctionsEmulator } from "firebase/functions";

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

// Connect to emulators in development
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  connectDatabaseEmulator(database, 'localhost', 9001);
  connectFunctionsEmulator(functions, 'localhost', 5001);
  console.log('Connected to emulators: Auth (9099), Database (9001), Functions (5001)');
}

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
      await waitForAuth();
      const user = currentUser;
      if (!user) return { deleted: 0 }; // Not logged in, can't cleanup

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

        // Only delete games that the current user is the host of
        if (game.host === user.uid && now - createdAt > expiryMs) {
          console.log(`Deleting expired game: ${gameId} (created ${Math.floor((now - createdAt) / (24 * 60 * 60 * 1000))} days ago)`);
          deletePromises.push(remove(ref(database, `game/${gameId}`)));
          deletedCount++;
        }
      }

      if (deletePromises.length > 0) {
        await Promise.all(deletePromises);
        console.log(`Cleanup complete: deleted ${deletedCount} old games`);
      }
      return { deleted: deletedCount };
    } catch (err) {
      // Silently handle permission errors - expected when user can't access all games
      if (!err.message?.includes('Permission denied')) {
        console.error('Cleanup error:', err);
      }
      return { deleted: 0, error: err.message };
    }
  },

  // ===== NEW STRUCTURED DATA METHODS =====

  // Get full game state (combines all paths)
  async getGameState(gameId) {
    await waitForAuth();

    // Try new structured format first
    const [gameSnap, playersSnap, submissionsSnap, guessesSnap] = await Promise.all([
      get(ref(database, `games/${gameId}`)),
      get(ref(database, `players/${gameId}`)),
      get(ref(database, `submissions/${gameId}`)),
      get(ref(database, `guesses/${gameId}`))
    ]);

    if (gameSnap.exists()) {
      // New structured format
      const game = gameSnap.val();
      const playersObj = playersSnap.val() || {};
      const players = Object.entries(playersObj).map(([id, data]) => ({ id, ...data }));

      return {
        ...game,
        players,
        submissions: submissionsSnap.val() || [],
        guesses: guessesSnap.val() || [],
        allSubmissions: game.allSubmissions || []
      };
    }

    // Backwards compatibility: Try old format (game:${gameId})
    const oldGameSnap = await get(ref(database, `game:${gameId}`));
    if (oldGameSnap.exists()) {
      console.log('Found old format game, using backwards compatibility');
      const gameData = oldGameSnap.val();
      // Old format was JSON string or object
      const game = typeof gameData === 'string' ? JSON.parse(gameData) : gameData;
      return game;
    }

    return null;
  },

  // Set game core data
  async setGame(gameId, gameData) {
    await waitForAuth();
    const dbRef = ref(database, `games/${gameId}`);
    await set(dbRef, gameData);
  },

  // Update player data
  async updatePlayer(gameId, playerId, playerData) {
    await waitForAuth();
    const dbRef = ref(database, `players/${gameId}/${playerId}`);
    await update(dbRef, playerData);
  },

  // Set all players
  async setPlayers(gameId, players) {
    await waitForAuth();
    const playersObj = {};
    players.forEach(p => {
      playersObj[p.id] = { ...p };
      delete playersObj[p.id].id; // Don't duplicate id
    });
    const dbRef = ref(database, `players/${gameId}`);
    await set(dbRef, playersObj);
  },

  // Set words (protected - only describer can read)
  async setWords(gameId, words, describerId) {
    await waitForAuth();
    const dbRef = ref(database, `words/${gameId}`);
    await set(dbRef, { words, describer: describerId });
  },

  // Get words (only if you're the describer)
  async getWords(gameId) {
    await waitForAuth();
    const dbRef = ref(database, `words/${gameId}`);
    const snapshot = await get(dbRef);
    if (!snapshot.exists()) return null;
    return snapshot.val().words;
  },

  // Add submission
  async addSubmission(gameId, submission) {
    await waitForAuth();
    const dbRef = ref(database, `submissions/${gameId}`);
    const snapshot = await get(dbRef);
    const submissions = snapshot.val() || [];
    submissions.push(submission);
    await set(dbRef, submissions);
  },

  // Set submissions
  async setSubmissions(gameId, submissions) {
    await waitForAuth();
    const dbRef = ref(database, `submissions/${gameId}`);
    await set(dbRef, submissions);
  },

  // Add guess
  async addGuess(gameId, guess) {
    await waitForAuth();
    const dbRef = ref(database, `guesses/${gameId}`);
    const snapshot = await get(dbRef);
    const guesses = snapshot.val() || [];
    guesses.push(guess);
    await set(dbRef, guesses);
  },

  // Subscribe to game state changes
  subscribeToGame(gameId, callback) {
    // Subscribe to both old and new formats simultaneously
    // Whichever exists will trigger the callback
    const oldGameRef = ref(database, `game:${gameId}`);
    const gameRef = ref(database, `games/${gameId}`);
    const playersRef = ref(database, `players/${gameId}`);
    const submissionsRef = ref(database, `submissions/${gameId}`);
    const guessesRef = ref(database, `guesses/${gameId}`);

    let usingOldFormat = false;
    let gameData = null;
    let playersData = null;
    let submissionsData = [];
    let guessesData = [];

    const notifyNewFormat = () => {
      if (usingOldFormat) return;
      // Only notify when we have both essential pieces of data
      if (!gameData || !playersData) {
        console.log('[Firebase] Not notifying yet - waiting for data:', { hasGameData: !!gameData, hasPlayersData: !!playersData });
        return;
      }

      const playersArray = Object.entries(playersData).map(([id, data]) => ({ id, ...data }));
      console.log('[Firebase] Notifying with combined data:', {
        gameId: gameData.id,
        playerCount: playersArray.length,
        players: playersArray.map(p => ({ id: p.id, name: p.name, emoji: p.emoji }))
      });
      callback({
        ...gameData,
        players: playersArray,
        submissions: submissionsData,
        guesses: guessesData
      });
    };

    // Subscribe to old format
    const unsubOld = onValue(oldGameRef, (snap) => {
      if (snap.exists()) {
        usingOldFormat = true;
        const gameData = snap.val();
        const game = typeof gameData === 'string' ? JSON.parse(gameData) : gameData;
        callback(game);
      }
    });

    // Subscribe to new format
    const unsubGame = onValue(gameRef, (snap) => {
      if (snap.exists()) {
        gameData = snap.val();
        console.log('[Firebase] Game data received:', { id: gameId, host: gameData.host, status: gameData.status });
        notifyNewFormat();
      }
    });

    const unsubPlayers = onValue(playersRef, (snap) => {
      if (snap.exists()) {
        playersData = snap.val();
        console.log('[Firebase] Players data received:', Object.keys(playersData).length, 'players');
        notifyNewFormat();
      } else {
        console.log('[Firebase] No players data exists yet for game:', gameId);
      }
    });

    const unsubSubmissions = onValue(submissionsRef, (snap) => {
      const val = snap.val();
      // Firebase push() creates objects, not arrays - convert if needed
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        submissionsData = Object.values(val);
      } else {
        submissionsData = val || [];
      }
      notifyNewFormat();
    });

    const unsubGuesses = onValue(guessesRef, (snap) => {
      const val = snap.val();
      // Firebase push() creates objects, not arrays - convert if needed
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        guessesData = Object.values(val);
      } else {
        guessesData = val || [];
      }
      notifyNewFormat();
    });

    // Return unsubscribe function that cleans up all subscriptions
    return () => {
      unsubOld();
      unsubGame();
      unsubPlayers();
      unsubSubmissions();
      unsubGuesses();
    };
  },

  // Delete entire game (all paths)
  async deleteGame(gameId) {
    await waitForAuth();
    await Promise.all([
      remove(ref(database, `games/${gameId}`)),
      remove(ref(database, `players/${gameId}`)),
      remove(ref(database, `words/${gameId}`)),
      remove(ref(database, `submissions/${gameId}`)),
      remove(ref(database, `guesses/${gameId}`))
    ]);
  },

  // ===== CLOUD FUNCTIONS =====

  // Submit guess (validated server-side)
  async submitGuess(gameId, word) {
    await waitForAuth();
    const submitGuessFn = httpsCallable(functions, 'submitGuess');
    const result = await submitGuessFn({ gameId, word });
    return result.data;
  },

  // Join game (validated server-side)
  async joinGameSecure(gameId, playerName, playerEmoji) {
    await waitForAuth();
    const user = auth.currentUser;
    console.log('[Firebase] Calling joinGameSecure:', { gameId, playerName, playerEmoji, playerId: user?.uid });
    const joinGameFn = httpsCallable(functions, 'joinGame');
    const result = await joinGameFn({ gameId, playerName, playerEmoji });
    console.log('[Firebase] joinGameSecure result:', result.data);
    return result.data;
  },

  // Start round (generates words server-side)
  async startRoundSecure(gameId, difficulty, wordCount, describerId) {
    await waitForAuth();
    const startRoundFn = httpsCallable(functions, 'startRound');
    const result = await startRoundFn({ gameId, difficulty, wordCount, describerId });
    return result.data;
  }
};

export { database, analytics };
