const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { initializeApp } = require("firebase-admin/app");
const { getDatabase } = require("firebase-admin/database");
const { getWordsForDifficulty } = require("./words");

// Initialize Firebase Admin
initializeApp();
const db = getDatabase();

/*
 * V2 DATA STRUCTURE - Secure word storage
 *
 * PUBLIC PATH: gamesV2/${gameId}/  (players can read for real-time sync)
 * {
 *   host: string,           // Firebase Auth UID
 *   hostName: string,
 *   createdAt: number,
 *   status: "waiting" | "playing" | "finished",
 *   settings: {
 *     difficulty: string,
 *     roundTime: number,
 *     totalRounds: number,
 *     bonusEnabled: boolean
 *   },
 *   currentRound: number,
 *   players: {
 *     [playerId]: {
 *       name: string,
 *       score: number,
 *       joinedAt: number,
 *       team: number
 *     }
 *   },
 *   round: {                 // Current round data (only when playing)
 *     describerId: string,
 *     wordCount: number,     // Only the count, NOT the actual words
 *     guesses: [...],
 *     startedAt: number,
 *     roundTime: number
 *   }
 * }
 *
 * PRIVATE PATH: gamesV2Words/${gameId}/  (ONLY cloud functions can access)
 * {
 *   words: [...]             // Actual words stored here
 * }
 *
 * Key security benefit: words are in a completely separate path
 * that clients cannot read. Only cloud functions can access them.
 */

// Helper to generate a 6-character game ID
function generateGameId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, O, 0, 1 to avoid confusion
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Simple test function to verify infrastructure
exports.ping = onCall((request) => {
  const timestamp = new Date().toISOString();

  return {
    success: true,
    message: "Cloud Functions are working!",
    timestamp: timestamp,
    authenticated: !!request.auth,
    uid: request.auth?.uid || null
  };
});

/**
 * Create a new game (V2 structure)
 * This writes to gamesV2/ path - parallel to old game/ path
 */
exports.createGameV2 = onCall(async (request) => {
  // Require authentication
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be logged in to create a game");
  }

  const { hostName, hostEmoji, settings } = request.data;
  const hostId = request.auth.uid;

  if (!hostName || typeof hostName !== "string" || hostName.trim().length === 0) {
    throw new HttpsError("invalid-argument", "Host name is required");
  }

  const emoji = hostEmoji || '😀';

  // Default settings
  const totalRounds = settings?.totalRounds || 3;
  const gameSettings = {
    difficulty: settings?.difficulty || "normal",
    roundTime: settings?.roundTime || 60,
    totalRounds: totalRounds,
    rounds: totalRounds,  // Alias for client compatibility
    bonusEnabled: settings?.bonusEnabled !== false,
    teamMode: settings?.teamMode || false
  };

  // Generate unique game ID
  let gameId;
  let attempts = 0;
  do {
    gameId = generateGameId();
    const existing = await db.ref(`gamesV2/${gameId}`).once("value");
    if (!existing.exists()) break;
    attempts++;
  } while (attempts < 10);

  if (attempts >= 10) {
    throw new HttpsError("internal", "Failed to generate unique game ID");
  }

  const now = Date.now();

  // Create game data
  const gameData = {
    host: hostId,
    hostName: hostName.trim(),
    createdAt: now,
    status: "waiting",
    settings: gameSettings,
    currentRound: 0,
    players: {
      [hostId]: {
        name: hostName.trim(),
        emoji: emoji,
        score: 0,
        joinedAt: now,
        lastSeen: now,  // Initialize lastSeen so player shows as connected
        team: 1
      }
    }
  };

  // Write to database
  await db.ref(`gamesV2/${gameId}`).set(gameData);

  return {
    success: true,
    gameId: gameId,
    game: gameData
  };
});

/**
 * Get game state (V2 structure)
 * Returns filtered data based on player role:
 * - Describer sees words
 * - Guessers don't see words
 */
exports.getGameV2 = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be logged in");
  }

  const { gameId } = request.data;
  const playerId = request.auth.uid;

  if (!gameId) {
    throw new HttpsError("invalid-argument", "Game ID is required");
  }

  const snapshot = await db.ref(`gamesV2/${gameId}`).once("value");

  if (!snapshot.exists()) {
    throw new HttpsError("not-found", "Game not found");
  }

  const game = snapshot.val();

  // Check if player is in the game
  const isPlayer = game.players && game.players[playerId];
  const isHost = game.host === playerId;

  // If not a player, return limited info (for join screen)
  if (!isPlayer && !isHost) {
    return {
      success: true,
      gameId: gameId,
      game: {
        host: game.host,
        hostName: game.hostName,
        status: game.status,
        settings: game.settings,
        players: game.players, // Needed to check zombie/stale state
        createdAt: game.createdAt
      },
      role: {
        isHost: false,
        isPlayer: false,
        isDescriber: false
      }
    };
  }

  // Filter sensitive data based on role
  // Check both round.describerId AND currentDescriber (in case one isn't set yet)
  const isDescriber = game.round?.describerId === playerId || game.currentDescriber === playerId;

  // In team mode, check if player is on the spectating (idle) team
  // Spectators can see words since they're not guessing
  const isTeamMode = game.settings?.teamMode;
  const playerTeam = game.players?.[playerId]?.team;
  const currentPlayingTeam = game.currentPlayingTeam;
  const isSpectatingTeam = isTeamMode && playerTeam && currentPlayingTeam && playerTeam !== currentPlayingTeam;

  // Create response
  const response = { ...game };

  // If describer OR spectating team, and game is playing, fetch words from private path
  // Spectating team can see words (they watch but don't guess)
  if ((isDescriber || isSpectatingTeam) && game.status === "playing") {
    const wordsSnapshot = await db.ref(`gamesV2Words/${gameId}/words`).once("value");
    if (wordsSnapshot.exists()) {
      response.round = {
        ...game.round,
        words: wordsSnapshot.val()
      };
    }
  }
  // For active team guessers, round data is already safe (no words in public path)

  return {
    success: true,
    gameId: gameId,
    game: response,
    role: {
      isHost,
      isPlayer: !!isPlayer,
      isDescriber
    }
  };
});

/**
 * Join an existing game (V2 structure)
 */
exports.joinGameV2 = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be logged in");
  }

  const { gameId, playerName, playerEmoji } = request.data;
  const playerId = request.auth.uid;

  if (!gameId) {
    throw new HttpsError("invalid-argument", "Game ID is required");
  }

  if (!playerName || typeof playerName !== "string" || playerName.trim().length === 0) {
    throw new HttpsError("invalid-argument", "Player name is required");
  }

  const emoji = playerEmoji || '😀';

  const gameRef = db.ref(`gamesV2/${gameId}`);
  const snapshot = await gameRef.once("value");

  if (!snapshot.exists()) {
    throw new HttpsError("not-found", "Game not found");
  }

  const game = snapshot.val();

  // Check if player is already in the game (allow rejoin even if game started)
  // Also verify player has valid data (name) - heartbeat can create ghost entries with only lastSeen
  if (game.players && game.players[playerId] && game.players[playerId].name) {
    // Already in game with valid data, just return success - allows rejoining
    return {
      success: true,
      gameId: gameId,
      message: "Already in game",
      player: game.players[playerId]
    };
  }

  // Allow new players to join even if game is in progress (they can join mid-game)
  // Also allow joining finished games (for restart purposes)

  // Assign team (alternate between teams for balance)
  const playerCount = Object.keys(game.players || {}).length;
  const team = (playerCount % 2) + 1;

  const now = Date.now();
  const playerData = {
    name: playerName.trim(),
    emoji: emoji,
    score: 0,
    joinedAt: now,
    lastSeen: now,  // Initialize lastSeen so player shows as connected
    team: team
  };

  // Add player to game
  await gameRef.child(`players/${playerId}`).set(playerData);

  return {
    success: true,
    gameId: gameId,
    player: playerData
  };
});

/**
 * Start a round (V2 structure)
 * Host or the designated describer can start. Generates words server-side.
 */
exports.startRoundV2 = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be logged in");
  }

  const { gameId, describerId } = request.data;
  const playerId = request.auth.uid;

  if (!gameId) {
    throw new HttpsError("invalid-argument", "Game ID is required");
  }

  const gameRef = db.ref(`gamesV2/${gameId}`);
  const snapshot = await gameRef.once("value");

  if (!snapshot.exists()) {
    throw new HttpsError("not-found", "Game not found");
  }

  const game = snapshot.val();

  // Allow host OR the designated describer to start rounds
  const isHost = game.host === playerId;
  const isDescriber = describerId && describerId === playerId;

  if (!isHost && !isDescriber) {
    throw new HttpsError("permission-denied", "Only host or describer can start rounds");
  }

  // Check game state
  if (game.status === "finished") {
    throw new HttpsError("failed-precondition", "Game is already finished");
  }

  // Validate describer is in the game
  const actualDescriberId = describerId || playerId; // Default to host if not specified
  if (!game.players || !game.players[actualDescriberId]) {
    throw new HttpsError("invalid-argument", "Describer must be a player in the game");
  }

  // Generate words for this round
  const words = getWordsForDifficulty(game.settings.difficulty, 16);

  const now = Date.now();
  const nextRound = (game.currentRound || 0) + 1;

  // Create PUBLIC round data (NO words - just metadata)
  const publicRoundData = {
    describerId: actualDescriberId,
    wordCount: words.length,
    guesses: [],
    startedAt: now,
    roundTime: game.settings.roundTime
  };

  // Store words in PRIVATE path (only cloud functions can access)
  await db.ref(`gamesV2Words/${gameId}`).set({ words: words });

  // Update PUBLIC game state (clients can subscribe to this)
  await gameRef.update({
    status: "playing",
    currentRound: nextRound,
    round: publicRoundData,
    bonusWordsAdded: false,  // Reset bonus words flag for new round
    bonusWordsNotificationEnd: null,
    lastBonusAtWordCount: 0  // Reset so bonus words can trigger again this round
  });

  // Only return words if the caller IS the describer
  const callerIsDescriber = playerId === actualDescriberId;

  return {
    success: true,
    gameId: gameId,
    round: nextRound,
    roundData: callerIsDescriber
      ? { ...publicRoundData, words: words }  // Describer gets words
      : publicRoundData                        // Others just get metadata
  };
});

/**
 * Submit a guess (V2 structure)
 */
exports.submitGuessV2 = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be logged in");
  }

  const { gameId, guess } = request.data;
  const playerId = request.auth.uid;

  if (!gameId) {
    throw new HttpsError("invalid-argument", "Game ID is required");
  }

  if (!guess || typeof guess !== "string" || guess.trim().length === 0) {
    throw new HttpsError("invalid-argument", "Guess is required");
  }

  // Prevent excessively long guesses
  if (guess.length > 100) {
    throw new HttpsError("invalid-argument", "Guess is too long");
  }

  const gameRef = db.ref(`gamesV2/${gameId}`);
  const snapshot = await gameRef.once("value");

  if (!snapshot.exists()) {
    throw new HttpsError("not-found", "Game not found");
  }

  const game = snapshot.val();

  // Check if player is in the game
  if (!game.players || !game.players[playerId]) {
    throw new HttpsError("permission-denied", "You are not in this game");
  }

  // Check game is playing
  if (game.status !== "playing" || !game.round) {
    throw new HttpsError("failed-precondition", "Game is not in playing state");
  }

  // Describer cannot guess - use currentDescriber which is what the UI uses
  // (round.describerId may be stale or mismatched)
  if (game.currentDescriber === playerId) {
    throw new HttpsError("permission-denied", "Describer cannot guess");
  }

  // In team mode, only players on the active team can guess
  // Spectating team must wait for their turn
  if (game.settings?.teamMode && game.currentPlayingTeam) {
    const playerTeam = game.players[playerId].team;
    if (playerTeam !== game.currentPlayingTeam) {
      throw new HttpsError("permission-denied", "Only the active team can guess");
    }
  }

  const normalizedGuess = guess.trim().toUpperCase();
  const playerName = game.players[playerId].name || "Unknown";

  // Read words from PRIVATE path (only cloud functions can access this)
  const wordsSnapshot = await db.ref(`gamesV2Words/${gameId}/words`).once("value");
  if (!wordsSnapshot.exists()) {
    throw new HttpsError("failed-precondition", "Round words not found");
  }

  // Check if guess matches any word
  let matchedWord = null;
  let pointsAwarded = 0;

  // Firebase may convert arrays to objects - handle both formats
  const words = wordsSnapshot.val();
  const wordsArray = Array.isArray(words) ? words : Object.values(words || {});
  const guessesArray = Array.isArray(game.round.guesses)
    ? game.round.guesses
    : Object.values(game.round.guesses || {});

  let alreadyGuessedWord = false;

  for (const wordObj of wordsArray) {
    if (!wordObj || !wordObj.word) continue;
    const wordNormalized = wordObj.word.toUpperCase();
    if (normalizedGuess === wordNormalized) {
      // Check if already guessed
      const wasGuessed = guessesArray.some(
        g => g && g.word && g.word.toUpperCase() === wordNormalized
      );

      if (wasGuessed) {
        alreadyGuessedWord = true;
      } else {
        matchedWord = wordObj;
        pointsAwarded = wordObj.points || 0;
      }
      break;
    }
  }

  const now = Date.now();
  const guessRecord = {
    playerId: playerId,
    playerName: playerName,
    guess: normalizedGuess,
    timestamp: now,
    correct: !!matchedWord,
    word: matchedWord?.word || null,
    points: pointsAwarded
  };

  // Add guess to round (use spread to avoid mutation race conditions)
  const guesses = [...(game.round.guesses || []), guessRecord];

  // Also add to submissions array for UI display (use spread to avoid mutation race conditions)
  const submissions = [...(game.submissions || []), {
    word: normalizedGuess,
    playerId: playerId,
    playerName: playerName,
    isCorrect: !!matchedWord,
    isDuplicate: alreadyGuessedWord,
    points: pointsAwarded,
    timestamp: now
  }];

  // Update player score if correct
  if (matchedWord) {
    const currentScore = game.players[playerId].score || 0;
    await gameRef.child(`players/${playerId}/score`).set(currentScore + pointsAwarded);
  }

  // Update guesses and submissions
  await gameRef.child("round/guesses").set(guesses);
  await gameRef.child("submissions").set(submissions);

  // Check for bonus words trigger (80% of CURRENT word count)
  // Bonus words keep adding until max limit of 32 words
  const correctGuesses = guesses.filter(g => g.correct).length;
  const currentWordCount = wordsArray.length;
  const MAX_WORDS = 32;
  const BONUS_WORD_COUNT = 4;
  const BONUS_THRESHOLD_PERCENT = 0.8;
  let bonusWordsAdded = false;

  // Calculate threshold based on current word count
  const threshold = Math.floor(currentWordCount * BONUS_THRESHOLD_PERCENT);

  // Track what word count we last added bonus at (to prevent duplicate adds at same threshold)
  const lastBonusAtWordCount = game.lastBonusAtWordCount || 0;

  // Add bonus words if:
  // 1. Correct guesses >= 80% of current words
  // 2. Current word count < max limit
  // 3. We haven't already added bonus for this word count level
  // 4. Bonus is enabled in settings
  if (correctGuesses >= threshold &&
      currentWordCount < MAX_WORDS &&
      currentWordCount > lastBonusAtWordCount &&
      game.settings?.bonusEnabled !== false) {

    // Generate bonus words
    const bonusWords = getWordsForDifficulty(game.settings?.difficulty || "normal", BONUS_WORD_COUNT);

    // Add to private words path
    const updatedWords = [...wordsArray, ...bonusWords];
    await db.ref(`gamesV2Words/${gameId}/words`).set(updatedWords);

    // Update game state with notification and new word count
    await gameRef.update({
      bonusWordsAdded: true,
      bonusWordsNotificationEnd: now + 5000, // Show notification for 5 seconds
      lastBonusAtWordCount: currentWordCount, // Track this threshold level
      "round/wordCount": updatedWords.length  // Update public word count for guessers
    });

    bonusWordsAdded = true;
  }

  return {
    success: true,
    correct: !!matchedWord,
    alreadyGuessed: alreadyGuessedWord,
    points: pointsAwarded,
    word: matchedWord?.word || null,
    totalGuesses: guesses.length,
    correctGuesses: correctGuesses,
    bonusWordsAdded: bonusWordsAdded
  };
});

/**
 * End current round
 * Copies words from private path to public path so break screen can show them
 */
exports.endRoundV2 = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be logged in");
  }

  const { gameId, nextDescriberId, isLastRound, breakDuration, nextPlayingTeam, teamDescriberIndex, allSubmissions } = request.data;
  const playerId = request.auth.uid;

  if (!gameId) {
    throw new HttpsError("invalid-argument", "Game ID is required");
  }

  // Validate allSubmissions size to prevent storage abuse
  if (allSubmissions && Array.isArray(allSubmissions) && allSubmissions.length > 10000) {
    throw new HttpsError("invalid-argument", "Submissions array too large");
  }

  const gameRef = db.ref(`gamesV2/${gameId}`);
  const snapshot = await gameRef.once("value");

  if (!snapshot.exists()) {
    throw new HttpsError("not-found", "Game not found");
  }

  const game = snapshot.val();

  // Guard against double-ending: if round is already null, it was already ended
  // This prevents race condition where host and describer both call endRound at timer=0
  if (!game.round) {
    return { success: true, alreadyEnded: true };
  }

  // Only host or current describer can end round
  // Check both round.describerId AND currentDescriber (in case one isn't set)
  const isHost = game.host === playerId;
  const isDescriber = game.round?.describerId === playerId || game.currentDescriber === playerId;

  if (!isHost && !isDescriber) {
    throw new HttpsError("permission-denied", "Only host or describer can end round");
  }

  const now = Date.now();

  // Fetch words from private path to copy to public for break screen
  const wordsSnapshot = await db.ref(`gamesV2Words/${gameId}/words`).once("value");
  const words = wordsSnapshot.exists() ? wordsSnapshot.val() : [];

  // Convert to array if needed (Firebase may store as object)
  const wordsArray = Array.isArray(words) ? words : Object.values(words || {});

  // Copy guesses to roundGuesses before clearing round (for break screen display)
  // Firebase may convert arrays to objects - handle both formats
  const guessesRaw = game.round?.guesses || [];
  const guessesArray = Array.isArray(guessesRaw) ? guessesRaw : Object.values(guessesRaw);

  if (isLastRound) {
    // Last round - show break screen for 20 seconds before going to Game Over
    // Client-side effect will transition to 'finished' when breakEndTime expires
    await gameRef.update({
      roundEndTime: now,
      breakEndTime: now + (breakDuration || 20000),
      roundStartTime: null,
      isLastRoundBreak: true,
      roundWords: wordsArray,
      roundGuesses: guessesArray,
      round: null,
      allSubmissions: allSubmissions || game.allSubmissions
    });
  } else {
    // Set up for break period
    const updates = {
      roundEndTime: now,
      breakEndTime: now + (breakDuration || 10000),
      currentDescriber: nextDescriberId || game.host,
      roundStartTime: null,
      isLastRoundBreak: false,
      roundWords: wordsArray,  // Copy words to public path for break screen
      roundGuesses: guessesArray,  // Copy guesses for break screen display
      round: null  // Clear old round data so next round generates fresh words
    };

    // Optional team mode fields
    if (nextPlayingTeam !== undefined) {
      updates.currentPlayingTeam = nextPlayingTeam;
    }
    if (teamDescriberIndex !== undefined && typeof teamDescriberIndex === 'object') {
      // Normalize indices to prevent negative or invalid values
      updates.teamDescriberIndex = {
        1: Math.max(0, parseInt(teamDescriberIndex[1]) || 0),
        2: Math.max(0, parseInt(teamDescriberIndex[2]) || 0)
      };
    }
    if (allSubmissions !== undefined) {
      updates.allSubmissions = allSubmissions;
    }

    await gameRef.update(updates);
  }

  return { success: true, isLastRound, words: wordsArray };
});

/**
 * Update game state (host only)
 */
exports.updateGameStateV2 = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be logged in");
  }

  const { gameId, updates } = request.data;
  const playerId = request.auth.uid;

  if (!gameId || !updates) {
    throw new HttpsError("invalid-argument", "Game ID and updates are required");
  }

  const gameRef = db.ref(`gamesV2/${gameId}`);
  const snapshot = await gameRef.once("value");

  if (!snapshot.exists()) {
    throw new HttpsError("not-found", "Game not found");
  }

  const game = snapshot.val();

  // Only host can update game state
  if (game.host !== playerId) {
    throw new HttpsError("permission-denied", "Only host can update game state");
  }

  // Sanitize updates - prevent writing to sensitive paths
  const safeUpdates = { ...updates };
  delete safeUpdates.host; // Can't change host through this function
  delete safeUpdates.createdAt;
  delete safeUpdates.words; // Words must NEVER be in public path

  // If updating round data, strip any words that might be included
  if (safeUpdates.round && typeof safeUpdates.round === 'object') {
    delete safeUpdates.round.words;
  }

  await gameRef.update(safeUpdates);

  return { success: true };
});

/**
 * Leave game
 */
exports.leaveGameV2 = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be logged in");
  }

  const { gameId } = request.data;
  const playerId = request.auth.uid;

  if (!gameId) {
    throw new HttpsError("invalid-argument", "Game ID is required");
  }

  const gameRef = db.ref(`gamesV2/${gameId}`);
  const snapshot = await gameRef.once("value");

  if (!snapshot.exists()) {
    throw new HttpsError("not-found", "Game not found");
  }

  const game = snapshot.val();

  // Remove player
  await gameRef.child(`players/${playerId}`).remove();

  const remainingPlayers = Object.keys(game.players || {}).filter(id => id !== playerId);

  // If host is leaving and there are other players, transfer host
  if (game.host === playerId && remainingPlayers.length > 0) {
    await gameRef.child("host").set(remainingPlayers[0]);
  }

  // If current describer is leaving and there are other players, transfer describer
  if (game.currentDescriber === playerId && remainingPlayers.length > 0) {
    await gameRef.child("currentDescriber").set(remainingPlayers[0]);
  }

  return { success: true };
});

/**
 * Kick player (host only)
 */
exports.kickPlayerV2 = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be logged in");
  }

  const { gameId, targetPlayerId } = request.data;
  const playerId = request.auth.uid;

  if (!gameId || !targetPlayerId) {
    throw new HttpsError("invalid-argument", "Game ID and target player ID are required");
  }

  const gameRef = db.ref(`gamesV2/${gameId}`);
  const snapshot = await gameRef.once("value");

  if (!snapshot.exists()) {
    throw new HttpsError("not-found", "Game not found");
  }

  const game = snapshot.val();

  // Only host can kick players
  if (game.host !== playerId) {
    throw new HttpsError("permission-denied", "Only host can kick players");
  }

  // Can't kick yourself
  if (targetPlayerId === playerId) {
    throw new HttpsError("invalid-argument", "Cannot kick yourself");
  }

  // Remove player
  await gameRef.child(`players/${targetPlayerId}`).remove();

  // If kicked player was the current describer, transfer to another player
  if (game.currentDescriber === targetPlayerId) {
    const remainingPlayers = Object.keys(game.players || {}).filter(id => id !== targetPlayerId);
    if (remainingPlayers.length > 0) {
      await gameRef.child("currentDescriber").set(remainingPlayers[0]);
    }
  }

  return { success: true };
});

/**
 * Switch team
 * Can be called by:
 * 1. Any player to switch themselves
 * 2. Host to switch any player
 */
exports.switchTeamV2 = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be logged in");
  }

  const { gameId, targetPlayerId } = request.data;
  const callerId = request.auth.uid;

  if (!gameId || !targetPlayerId) {
    throw new HttpsError("invalid-argument", "Game ID and target player ID are required");
  }

  const gameRef = db.ref(`gamesV2/${gameId}`);
  const snapshot = await gameRef.once("value");

  if (!snapshot.exists()) {
    throw new HttpsError("not-found", "Game not found");
  }

  const game = snapshot.val();

  // Check if caller is in game
  if (!game.players || !game.players[callerId]) {
    throw new HttpsError("permission-denied", "You are not in this game");
  }

  // Check if target player exists
  if (!game.players[targetPlayerId]) {
    throw new HttpsError("not-found", "Target player not found");
  }

  // Permission check: can only switch yourself OR host can switch anyone
  const isHost = game.host === callerId;
  const isSwitchingSelf = callerId === targetPlayerId;

  if (!isSwitchingSelf && !isHost) {
    throw new HttpsError("permission-denied", "Only the host can switch other players");
  }

  // Determine if switching is allowed:
  // 1. In lobby (waiting state)
  // 2. During break period (between rounds)
  // 3. Before first round starts
  const isInLobby = game.status === "waiting";
  const isDuringBreak = game.breakEndTime && !game.roundStartTime;
  const isBeforeFirstRound = game.status === "playing" && !game.roundStartTime && !game.breakEndTime;

  if (!isInLobby && !isDuringBreak && !isBeforeFirstRound) {
    throw new HttpsError("failed-precondition", "Can only switch teams in lobby or during breaks");
  }

  // Don't allow current describer to switch teams
  if (game.currentDescriber === targetPlayerId) {
    throw new HttpsError("failed-precondition", "Cannot switch the describer's team");
  }

  // Calculate new team
  const currentTeam = game.players[targetPlayerId].team || 1;
  const newTeam = currentTeam === 1 ? 2 : 1;

  await gameRef.child(`players/${targetPlayerId}/team`).set(newTeam);

  return { success: true, targetPlayerId, newTeam };
});

/**
 * Transfer host
 * Can be called by:
 * 1. Current host to transfer to any player
 * 2. Any player to claim host if current host is offline for 120+ seconds
 */
exports.transferHostV2 = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be logged in");
  }

  const { gameId, newHostId } = request.data;
  const playerId = request.auth.uid;

  if (!gameId || !newHostId) {
    throw new HttpsError("invalid-argument", "Game ID and new host ID are required");
  }

  const gameRef = db.ref(`gamesV2/${gameId}`);
  const snapshot = await gameRef.once("value");

  if (!snapshot.exists()) {
    throw new HttpsError("not-found", "Game not found");
  }

  const game = snapshot.val();
  const now = Date.now();
  const HOST_OFFLINE_THRESHOLD = 120000; // 120 seconds

  // Check if current host is offline
  const currentHost = game.players?.[game.host];
  const hostLastSeen = currentHost?.lastSeen || 0;
  const isHostOffline = (now - hostLastSeen) > HOST_OFFLINE_THRESHOLD;

  // Allow transfer if: caller is current host OR host has been offline for 120+ seconds
  if (game.host !== playerId && !isHostOffline) {
    throw new HttpsError("permission-denied", "Only host can transfer host (or claim if host offline for 120s)");
  }

  // If claiming due to offline host, new host must be the caller
  if (game.host !== playerId && newHostId !== playerId) {
    throw new HttpsError("permission-denied", "Can only claim host for yourself when host is offline");
  }

  // Check new host is in game
  if (!game.players || !game.players[newHostId]) {
    throw new HttpsError("invalid-argument", "New host must be a player in the game");
  }

  await gameRef.child("host").set(newHostId);

  return { success: true, newHostId, claimedDueToOffline: game.host !== playerId };
});

/**
 * Skip turn (describer only)
 * Allows the current describer to skip their turn and pass to the next player
 */
exports.skipTurnV2 = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be logged in");
  }

  const { gameId, nextDescriberId, teamDescriberIndex } = request.data;
  const playerId = request.auth.uid;

  if (!gameId) {
    throw new HttpsError("invalid-argument", "Game ID is required");
  }

  const gameRef = db.ref(`gamesV2/${gameId}`);
  const snapshot = await gameRef.once("value");

  if (!snapshot.exists()) {
    throw new HttpsError("not-found", "Game not found");
  }

  const game = snapshot.val();

  // Only current describer can skip their turn
  if (game.currentDescriber !== playerId) {
    throw new HttpsError("permission-denied", "Only the current describer can skip their turn");
  }

  // Update to next describer
  const updates = {
    currentDescriber: nextDescriberId,
    breakEndTime: Date.now() + 10000
  };

  // Include team describer index if provided (for team mode)
  if (teamDescriberIndex) {
    updates.teamDescriberIndex = teamDescriberIndex;
  }

  await gameRef.update(updates);

  return { success: true, nextDescriberId };
});

/**
 * Initiate countdown before round starts (describer only)
 * Sets the countdown end time so all clients can sync
 */
exports.initiateCountdownV2 = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be logged in");
  }

  const { gameId, countdownSeconds } = request.data;
  const playerId = request.auth.uid;

  if (!gameId) {
    throw new HttpsError("invalid-argument", "Game ID is required");
  }

  const gameRef = db.ref(`gamesV2/${gameId}`);
  const snapshot = await gameRef.once("value");

  if (!snapshot.exists()) {
    throw new HttpsError("not-found", "Game not found");
  }

  const game = snapshot.val();

  // Only current describer or host can initiate countdown
  const isHost = game.host === playerId;
  const isDescriber = game.currentDescriber === playerId;

  if (!isHost && !isDescriber) {
    throw new HttpsError("permission-denied", "Only host or describer can initiate countdown");
  }

  // Don't allow if already counting down
  if (game.roundStartCountdownEnd) {
    throw new HttpsError("failed-precondition", "Countdown already in progress");
  }

  const seconds = countdownSeconds || 3;
  await gameRef.update({
    roundStartCountdownEnd: Date.now() + (seconds * 1000)
  });

  return { success: true, countdownEnd: Date.now() + (seconds * 1000) };
});

/**
 * Set round timing fields (describer only)
 * Called after startRoundV2 to set client-side timing fields
 */
exports.setRoundTimingV2 = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be logged in");
  }

  const { gameId, roundStartTime, currentRound, currentPlayingTeam } = request.data;
  const playerId = request.auth.uid;

  if (!gameId) {
    throw new HttpsError("invalid-argument", "Game ID is required");
  }

  const gameRef = db.ref(`gamesV2/${gameId}`);
  const snapshot = await gameRef.once("value");

  if (!snapshot.exists()) {
    throw new HttpsError("not-found", "Game not found");
  }

  const game = snapshot.val();

  // Only current describer or host can set timing
  const isHost = game.host === playerId;
  const isDescriber = game.currentDescriber === playerId || game.round?.describerId === playerId;

  if (!isHost && !isDescriber) {
    throw new HttpsError("permission-denied", "Only host or describer can set round timing");
  }

  const updates = {
    roundStartTime: roundStartTime || Date.now(),
    roundEndTime: null,
    breakEndTime: null,
    roundStartCountdownEnd: null,
    submissions: [],
    roundWords: null,  // Clear previous round's words
    roundGuesses: null  // Clear previous round's guesses
  };

  // Optional updates for team mode
  if (currentRound !== undefined) {
    updates.currentRound = currentRound;
  }
  if (currentPlayingTeam !== undefined) {
    updates.currentPlayingTeam = currentPlayingTeam;
  }

  await gameRef.update(updates);

  return { success: true };
});

/**
 * Scheduled warmup - runs every 5 minutes to keep container warm
 * This reduces cold start latency for all functions in this file
 */
exports.warmupScheduledV2 = onSchedule("every 5 minutes", async (event) => {
  console.log("Scheduled warmup ping at", new Date().toISOString());
  return null;
});

/**
 * Client-callable warmup - called after auth to pre-warm functions
 * Lightweight function that just returns immediately
 */
exports.warmupV2 = onCall(async (request) => {
  return { success: true, timestamp: Date.now() };
});

/**
 * Scheduled cleanup - runs daily to delete old/orphaned games
 * Deletes games older than 3 days to prevent database bloat
 */
exports.cleanupOldGamesV2 = onSchedule("every 24 hours", async () => {
  const GAME_EXPIRY_DAYS = 3;
  const expiryMs = GAME_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
  const now = Date.now();

  console.log("Starting scheduled cleanup at", new Date().toISOString());

  try {
    // Clean up gamesV2 (main game data)
    const gamesRef = db.ref("gamesV2");
    const gamesSnapshot = await gamesRef.once("value");
    let deletedGames = 0;

    if (gamesSnapshot.exists()) {
      const games = gamesSnapshot.val();
      const deletePromises = [];

      for (const [gameId, game] of Object.entries(games)) {
        const createdAt = game?.createdAt || 0;
        const isExpired = (now - createdAt) > expiryMs;

        // Also delete games with no players (orphaned)
        const hasPlayers = game?.players && Object.keys(game.players).length > 0;

        if (isExpired || !hasPlayers) {
          console.log(`Deleting game ${gameId}: expired=${isExpired}, hasPlayers=${hasPlayers}`);
          deletePromises.push(db.ref(`gamesV2/${gameId}`).remove());
          deletePromises.push(db.ref(`gamesV2Words/${gameId}`).remove());
          deletedGames++;
        }
      }

      await Promise.all(deletePromises);
    }

    console.log(`Cleanup complete: deleted ${deletedGames} games`);
    return null;
  } catch (error) {
    console.error("Cleanup error:", error);
    return null;
  }
});
