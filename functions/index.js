/**
 * Cloud Functions for Taboo Game - Structured Data Version
 * Uses Firebase Auth UID for player identification
 */

const { onCall } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.database();

// Constants
const MAX_PLAYERS_FFA = 12;
const MAX_PLAYERS_TEAM = 12;
const MAX_PLAYERS_PER_TEAM = 6;

/**
 * Helper: Get current user UID
 */
function requireAuth(request) {
  if (!request.auth) {
    throw new Error("Must be authenticated");
  }
  return request.auth.uid;
}

/**
 * submitGuess - Server-side guess validation
 *
 * Validates word against current round's word list
 * Calculates points server-side
 * Prevents duplicate guesses
 */
exports.submitGuess = onCall(async (request) => {
  const playerId = requireAuth(request);
  const { gameId, word } = request.data;

  if (!gameId || !word) {
    throw new Error("Missing gameId or word");
  }

  const normalizedWord = word.trim().toLowerCase();

  // Warmup call
  if (normalizedWord === "__warmup__") {
    return { success: true, isWarmup: true };
  }

  try {
    // Get game state
    const [gameSnap, playerSnap, wordsSnap, guessesSnap, submissionsSnap] = await Promise.all([
      db.ref(`games/${gameId}`).once("value"),
      db.ref(`players/${gameId}/${playerId}`).once("value"),
      db.ref(`words/${gameId}`).once("value"),
      db.ref(`guesses/${gameId}`).once("value"),
      db.ref(`submissions/${gameId}`).once("value")
    ]);

    if (!gameSnap.exists()) {
      throw new Error("Game not found");
    }

    const game = gameSnap.val();
    const player = playerSnap.val();
    const wordsData = wordsSnap.val();

    // Firebase push() creates objects, not arrays - convert if needed
    const guessesVal = guessesSnap.val();
    const guesses = guessesVal
      ? (Array.isArray(guessesVal) ? guessesVal : Object.values(guessesVal))
      : [];

    const submissionsVal = submissionsSnap.val();
    const submissions = submissionsVal
      ? (Array.isArray(submissionsVal) ? submissionsVal : Object.values(submissionsVal))
      : [];

    // Validate game state
    if (game.status !== "playing") {
      throw new Error("Game not in playing state");
    }

    if (!player) {
      throw new Error("Player not in game");
    }

    // Validate not describer
    if (playerId === game.currentDescriber) {
      throw new Error("Describer cannot guess");
    }

    // Validate team mode
    if (game.settings.teamMode && player.team !== game.currentPlayingTeam) {
      throw new Error("Not your team's turn");
    }

    // Check if already guessed - filter out invalid entries
    const alreadyGuessed = guesses.some(g => g && g.word && g.word.toLowerCase() === normalizedWord);
    const isDuplicate = submissions.some(s => s && s.word && s.word.toLowerCase() === normalizedWord);

    // Check against words list
    const words = wordsData?.words || [];
    const targetWord = words.find(w => w.word.toLowerCase() === normalizedWord);
    // Use !! to ensure boolean value (Firebase doesn't allow undefined)
    const isCorrect = !!(targetWord && !alreadyGuessed);

    // Create submission - ensure all values are defined (Firebase doesn't allow undefined)
    const submission = {
      playerId,
      playerName: player.name || "Unknown",
      word: normalizedWord,
      timestamp: Date.now(),
      isCorrect: isCorrect,
      isDuplicate: !!(isDuplicate || alreadyGuessed),
      isCorrectWord: !!targetWord,
      points: isCorrect ? (targetWord?.points || 0) : 0
    };

    // Update submissions - filter out any invalid entries and sanitize existing data
    const sanitizedSubmissions = submissions
      .filter(s => s && s.word) // Remove null/undefined entries
      .map(s => ({
        playerId: s.playerId || "",
        playerName: s.playerName || "Unknown",
        word: s.word,
        timestamp: s.timestamp || Date.now(),
        isCorrect: !!s.isCorrect,
        isDuplicate: !!s.isDuplicate,
        isCorrectWord: !!s.isCorrectWord,
        points: s.points || 0
      }));
    sanitizedSubmissions.push(submission);
    await db.ref(`submissions/${gameId}`).set(sanitizedSubmissions);

    // If correct, update score and guesses
    if (isCorrect) {
      await Promise.all([
        db.ref(`players/${gameId}/${playerId}/score`).set((player.score || 0) + targetWord.points),
        db.ref(`guesses/${gameId}`).push({
          word: targetWord.word,
          playerId,
          playerName: player.name,
          points: targetWord.points,
          timestamp: Date.now()
        })
      ]);
    }

    return {
      success: true,
      isCorrect,
      isDuplicate: submission.isDuplicate,
      points: submission.points,
      word: normalizedWord
    };
  } catch (error) {
    console.error("submitGuess error:", error);
    throw error;
  }
});

/**
 * joinGame - Server-side player join validation
 *
 * Validates player limits and team balance
 */
exports.joinGame = onCall(async (request) => {
  const playerId = requireAuth(request);
  const { gameId, playerName, playerEmoji } = request.data;

  // Warmup call
  if (playerName === "__warmup__") {
    return { success: true, isWarmup: true };
  }

  if (!gameId || !playerName) {
    throw new Error("Missing gameId or playerName");
  }

  try {
    const [gameSnap, playersSnap] = await Promise.all([
      db.ref(`games/${gameId}`).once("value"),
      db.ref(`players/${gameId}`).once("value")
    ]);

    if (!gameSnap.exists()) {
      throw new Error("Game not found");
    }

    const game = gameSnap.val();
    const playersObj = playersSnap.val() || {};
    const players = Object.values(playersObj);

    // Check if game is abandoned (no players left and current user is not the host)
    // Allow the host to join as the first player when creating a new game
    if (players.length === 0 && !playersObj[playerId] && game.host !== playerId) {
      throw new Error("This game has been abandoned. Please create a new game.");
    }

    // Check if player already exists
    if (playersObj[playerId]) {
      // Update existing player
      await db.ref(`players/${gameId}/${playerId}`).update({
        name: playerName,
        emoji: playerEmoji,
        lastSeen: Date.now()
      });
      return { success: true, reconnected: true };
    }

    // Check player limits
    const maxPlayers = game.settings.teamMode ? MAX_PLAYERS_TEAM : MAX_PLAYERS_FFA;
    if (players.length >= maxPlayers) {
      throw new Error(`Game is full! Maximum ${maxPlayers} players`);
    }

    // Check team limits
    let teamAssignment = null;
    if (game.settings.teamMode) {
      const team1 = players.filter(p => p.team === 1);
      const team2 = players.filter(p => p.team === 2);
      teamAssignment = team1.length <= team2.length ? 1 : 2;

      if ((teamAssignment === 1 && team1.length >= MAX_PLAYERS_PER_TEAM) ||
          (teamAssignment === 2 && team2.length >= MAX_PLAYERS_PER_TEAM)) {
        throw new Error("Both teams are full");
      }
    }

    // Add player
    await db.ref(`players/${gameId}/${playerId}`).set({
      name: playerName,
      emoji: playerEmoji,
      score: 0,
      team: teamAssignment,
      lastSeen: Date.now()
    });

    return { success: true, reconnected: false, team: teamAssignment };
  } catch (error) {
    console.error("joinGame error:", error);
    throw error;
  }
});

/**
 * startRound - Generate words and start new round
 *
 * Generates words server-side and stores in protected location
 * Only describer can access words
 */
exports.startRound = onCall(async (request) => {
  const playerId = requireAuth(request);
  const { gameId, difficulty, wordCount, describerId } = request.data;

  // Warmup call
  if (gameId === "__warmup__") {
    return { success: true, isWarmup: true };
  }

  if (!gameId) {
    throw new Error("Missing gameId");
  }

  try {
    const gameSnap = await db.ref(`games/${gameId}`).once("value");

    if (!gameSnap.exists()) {
      throw new Error("Game not found");
    }

    const game = gameSnap.val();

    // Only host or current describer can start rounds
    if (game.host !== playerId && game.currentDescriber !== playerId) {
      throw new Error("Only host or current describer can start round");
    }

    // Use provided describerId or fall back to game's currentDescriber
    const currentDescriber = describerId || game.currentDescriber;

    if (!currentDescriber) {
      throw new Error("No describer specified");
    }

    // Generate words using the same logic as client
    const { getWordsForDifficulty } = require("./words");
    const words = getWordsForDifficulty(difficulty || game.settings?.difficulty || "normal", wordCount || 16);

    // Store words in protected location
    await db.ref(`words/${gameId}`).set({
      words,
      describer: currentDescriber
    });

    // Clear submissions and guesses
    await Promise.all([
      db.ref(`submissions/${gameId}`).set([]),
      db.ref(`guesses/${gameId}`).set([])
    ]);

    return { success: true, wordCount: words.length };
  } catch (error) {
    console.error("startRound error:", error);
    throw error;
  }
});

/**
 * Warmup function - keeps functions warm
 * NOTE: Commented out because it requires Cloud Scheduler API and additional billing setup
 */
// exports.warmup = functions.pubsub.schedule("every 10 minutes").onRun(async () => {
//   console.log("Warming up cloud functions");
//   return null;
// });
