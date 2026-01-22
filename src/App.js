import React, { useState, useEffect } from 'react';
import { Timer, Users, Trophy, Play, Copy, Crown, Zap, Star, Settings, LogOut, SkipForward, Menu, UserX, X, Link, BookOpen, ChevronRight, Mic, MicVocal, MessageCircle, Target, Clock, Sparkles, AlertCircle } from 'lucide-react';
import { firebaseStorage } from './firebase';
import { getWordsForDifficulty, DIFFICULTY_CONFIG } from './words';

// Use Firebase storage
window.storage = firebaseStorage;

// Player name validation
const PLAYER_NAME_MAX_LENGTH = 20;
const PLAYER_NAME_MIN_LENGTH = 2;

// Player emoji options
const PLAYER_EMOJIS = ['😀', '😎', '🤓', '🦊', '🐱', '🐶', '🦄', '🚀', '⭐', '🎮', '🎯', '🔥'];

const validatePlayerName = (name) => {
  const trimmed = name.trim();

  if (trimmed.length < PLAYER_NAME_MIN_LENGTH) {
    return { valid: false, error: `Name must be at least ${PLAYER_NAME_MIN_LENGTH} characters` };
  }

  if (trimmed.length > PLAYER_NAME_MAX_LENGTH) {
    return { valid: false, error: `Name must be ${PLAYER_NAME_MAX_LENGTH} characters or less` };
  }

  // Only allow alphanumeric, spaces, and basic punctuation
  const validPattern = /^[a-zA-Z0-9\s\-_.]+$/;
  if (!validPattern.test(trimmed)) {
    return { valid: false, error: 'Name can only contain letters, numbers, spaces, hyphens, underscores, and periods' };
  }

  return { valid: true, error: null };
};

const sanitizePlayerName = (name) => {
  // Remove any HTML/script tags and trim
  return name
    .replace(/<[^>]*>/g, '')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, PLAYER_NAME_MAX_LENGTH);
};

// Floating background particles component
function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Animated gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
      <div className="absolute top-1/2 right-1/3 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '2s' }} />

      {/* Floating word hints */}
      <div className="absolute top-[15%] left-[10%] text-slate-700/30 text-2xl font-bold animate-float" style={{ animationDuration: '8s' }}>WORD</div>
      <div className="absolute top-[25%] right-[15%] text-slate-700/20 text-xl font-bold animate-float" style={{ animationDuration: '10s', animationDelay: '2s' }}>GUESS</div>
      <div className="absolute bottom-[30%] left-[20%] text-slate-700/25 text-lg font-bold animate-float" style={{ animationDuration: '9s', animationDelay: '1s' }}>TABOO</div>
      <div className="absolute bottom-[20%] right-[10%] text-slate-700/20 text-2xl font-bold animate-float" style={{ animationDuration: '7s', animationDelay: '3s' }}>PLAY</div>
      <div className="absolute top-[60%] left-[5%] text-slate-700/15 text-xl font-bold animate-float" style={{ animationDuration: '11s', animationDelay: '4s' }}>FUN</div>

      {/* CSS for float animation */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.3; }
          25% { transform: translateY(-20px) rotate(2deg); opacity: 0.5; }
          50% { transform: translateY(-10px) rotate(-1deg); opacity: 0.4; }
          75% { transform: translateY(-25px) rotate(1deg); opacity: 0.3; }
        }
        .animate-float { animation: float ease-in-out infinite; }

        @keyframes logo-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(6, 182, 212, 0.3), 0 0 40px rgba(6, 182, 212, 0.1); }
          50% { box-shadow: 0 0 30px rgba(6, 182, 212, 0.5), 0 0 60px rgba(6, 182, 212, 0.2); }
        }
        .animate-logo-glow { animation: logo-glow 3s ease-in-out infinite; }

        @keyframes title-shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .animate-shimmer {
          background-size: 200% auto;
          animation: title-shimmer 4s linear infinite;
        }
      `}</style>
    </div>
  );
}

function HomeScreen({ playerName, setPlayerName, playerEmoji, setPlayerEmoji, setScreen, createGame }) {
  const [showSettings, setShowSettings] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [nameError, setNameError] = useState(null);
  const [settings, setSettings] = useState({
    rounds: 3,
    roundTime: 60,
    difficulty: 'mixed',
    teamMode: false
  });

  const handleNameChange = (e) => {
    const sanitized = sanitizePlayerName(e.target.value);
    setPlayerName(sanitized);

    if (sanitized.length > 0) {
      const validation = validatePlayerName(sanitized);
      setNameError(validation.error);
    } else {
      setNameError(null);
    }
  };

  const handleCreate = async () => {
    const validation = validatePlayerName(playerName);
    if (!validation.valid) {
      setNameError(validation.error);
      return;
    }
    try {
      await createGame(settings);
    } catch (err) {
      console.error('Create game error:', err);
      alert('Failed to create game: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-zinc-900 text-white flex items-center justify-center p-4 relative">
      <FloatingParticles />

      <div className="max-w-md w-full space-y-6 relative z-10">
        {/* Logo and Title */}
        <div className="text-center space-y-2">
          <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-logo-glow transform hover:scale-110 transition-transform duration-300 relative">
            <MessageCircle className="w-14 h-14 drop-shadow-lg" />
            <span className="absolute inset-0 flex items-center justify-center text-cyan-900 font-bold text-sm mt-1">Aa</span>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent animate-shimmer">
            Taboo Online
          </h1>
          <p className="text-slate-300">Multiplayer word guessing game</p>
        </div>

        {/* Quick Stats / Features */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-3 text-center border border-slate-700/50 hover:border-cyan-500/30 transition-colors">
            <Users className="w-5 h-5 mx-auto mb-1 text-cyan-400" />
            <div className="text-xs text-slate-400">2+ Players</div>
          </div>
          <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-3 text-center border border-slate-700/50 hover:border-teal-500/30 transition-colors">
            <Clock className="w-5 h-5 mx-auto mb-1 text-teal-400" />
            <div className="text-xs text-slate-400">Quick Rounds</div>
          </div>
          <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-3 text-center border border-slate-700/50 hover:border-violet-500/30 transition-colors">
            <Trophy className="w-5 h-5 mx-auto mb-1 text-amber-400" />
            <div className="text-xs text-slate-400">Score Points</div>
          </div>
        </div>

        {/* Emoji Picker Modal */}
        {showEmojiPicker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowEmojiPicker(false)} />
            <div className="relative bg-slate-800 border border-slate-600 rounded-2xl p-6 shadow-2xl">
              <h3 className="text-lg font-semibold text-center mb-4 text-slate-200">Choose your avatar</h3>
              <div className="grid grid-cols-4 gap-3">
                {PLAYER_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => { setPlayerEmoji(emoji); setShowEmojiPicker(false); }}
                    className={`w-14 h-14 text-3xl rounded-xl transition-all hover:bg-slate-700 hover:scale-110 flex items-center justify-center ${
                      playerEmoji === emoji ? 'bg-cyan-500/30 border-2 border-cyan-400 scale-110' : 'bg-slate-700/50'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main Card */}
        <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl p-6 border border-slate-700 space-y-4">
          <div>
            <div className="flex gap-2">
              {/* Emoji Picker Button */}
              <button
                onClick={() => setShowEmojiPicker(true)}
                className="w-12 h-12 text-2xl bg-slate-900/50 border border-slate-600 rounded-xl hover:border-cyan-500 hover:scale-105 transition-all flex items-center justify-center"
                title="Choose avatar"
              >
                {playerEmoji}
              </button>
              <input
                type="text"
                placeholder="Enter your name"
                value={playerName}
                onChange={handleNameChange}
                maxLength={PLAYER_NAME_MAX_LENGTH}
                className={`flex-1 bg-slate-900/50 border rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                  nameError ? 'border-red-500 focus:ring-red-500' : 'border-slate-600 focus:ring-cyan-500'
                }`}
              />
            </div>
            {nameError && (
              <div className="flex items-center gap-1 mt-1 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{nameError}</span>
              </div>
            )}
            <div className="text-right text-xs text-slate-500 mt-1">
              {playerName.length}/{PLAYER_NAME_MAX_LENGTH}
            </div>
          </div>

          {showSettings && (
            <div className="space-y-4 pt-4 border-t border-slate-600">
              <div>
                <label className="block text-sm text-slate-300 mb-2">Rounds</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={settings.rounds}
                  onChange={(e) => setSettings({...settings, rounds: parseInt(e.target.value)})}
                  className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-2">Round Time (seconds)</label>
                <input
                  type="number"
                  min="30"
                  max="180"
                  value={settings.roundTime}
                  onChange={(e) => setSettings({...settings, roundTime: parseInt(e.target.value)})}
                  className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-2">Difficulty</label>
                <select
                  value={settings.difficulty}
                  onChange={(e) => setSettings({...settings, difficulty: e.target.value})}
                  className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-2 text-white"
                >
                  {Object.entries(DIFFICULTY_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.label} {config.points ? `(${config.points} pt${config.points > 1 ? 's' : ''})` : '(All)'}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="teamMode"
                  checked={settings.teamMode}
                  onChange={(e) => setSettings({...settings, teamMode: e.target.checked})}
                  className="w-5 h-5 accent-cyan-500"
                />
                <label htmlFor="teamMode" className="text-slate-300">Team Mode</label>
                <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">Beta</span>
              </div>
            </div>
          )}

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="w-full flex items-center justify-center gap-2 bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600 px-4 py-2 rounded-xl transition-colors"
          >
            <Settings className="w-4 h-4" />
            {showSettings ? 'Hide' : 'Show'} Settings
          </button>

          <button
            onClick={handleCreate}
            className="w-full bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700 px-6 py-3 rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg shadow-cyan-500/20"
          >
            <Play className="w-5 h-5 inline mr-2" />
            Create Game
          </button>

          <button
            onClick={() => setScreen('join')}
            className="w-full bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600 px-6 py-3 rounded-xl font-bold transition-all hover:border-slate-500"
          >
            Join Game
          </button>
        </div>

        {/* How to Play Button */}
        <button
          onClick={() => setShowHowToPlay(true)}
          className="w-full flex items-center justify-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors py-4 min-h-[48px]"
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-base">How to Play</span>
        </button>

        {/* Footer - only on home screen */}
        <div className="mt-6 pt-4 border-t border-slate-700/50 text-center text-sm text-slate-500">
          <div className="flex items-center justify-center gap-3">
            <span>Made by Sam</span>
            <span className="text-slate-600">|</span>
            <button
              onClick={() => setShowPrivacy(true)}
              className="hover:text-cyan-400 transition-colors"
            >
              Privacy Policy
            </button>
          </div>
        </div>
      </div>

      {/* How to Play Modal */}
      {showHowToPlay && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowHowToPlay(false)}>
          <div className="bg-slate-800 border border-slate-600 rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-600 sticky top-0 bg-slate-800">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                How to Play
              </h2>
              <button onClick={() => setShowHowToPlay(false)} className="p-1 hover:bg-slate-700 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-4 space-y-6">
              {/* Game Overview */}
              <div className="space-y-2">
                <h3 className="font-semibold text-cyan-300 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Game Overview
                </h3>
                <p className="text-sm text-slate-300">
                  Taboo is a fast-paced word guessing game! One player describes words while others race to guess them correctly.
                </p>
              </div>

              {/* Roles */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-cyan-500/10 to-teal-500/10 rounded-xl p-4 border border-cyan-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageCircle className="w-4 h-4 text-cyan-400" />
                    <span className="font-semibold text-cyan-300">Describer</span>
                  </div>
                  <p className="text-xs text-slate-300">Give clues without saying the word itself. Describe as many words as you can!</p>
                </div>
                <div className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 rounded-xl p-4 border border-violet-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-violet-400" />
                    <span className="font-semibold text-violet-300">Guesser</span>
                  </div>
                  <p className="text-xs text-slate-300">Listen to clues and type your guesses. First to guess correctly gets the points!</p>
                </div>
              </div>

              {/* Scoring */}
              <div className="space-y-3">
                <h3 className="font-semibold text-amber-300 flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  Scoring
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2 flex justify-between items-center">
                    <span className="text-sm text-emerald-300">Easy</span>
                    <span className="font-bold text-emerald-400">10 pts</span>
                  </div>
                  <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg px-3 py-2 flex justify-between items-center">
                    <span className="text-sm text-cyan-300">Normal</span>
                    <span className="font-bold text-cyan-400">20 pts</span>
                  </div>
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2 flex justify-between items-center">
                    <span className="text-sm text-amber-300">Hard</span>
                    <span className="font-bold text-amber-400">25 pts</span>
                  </div>
                  <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2 flex justify-between items-center">
                    <span className="text-sm text-rose-300">Insane</span>
                    <span className="font-bold text-rose-400">50 pts</span>
                  </div>
                </div>
              </div>

              {/* Tips */}
              <div className="space-y-2">
                <h3 className="font-semibold text-teal-300 flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  Pro Tips
                </h3>
                <ul className="text-sm text-slate-300 space-y-1">
                  <li className="flex items-start gap-2">
                    <span className="text-teal-400">•</span>
                    Describers can describe any word on the board in any order
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-400">•</span>
                    Use synonyms, examples, or "rhymes with" clues
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-400">•</span>
                    Type fast - first correct guess wins the points!
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-400">•</span>
                    Higher difficulty = bigger risk, bigger reward
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Policy Modal */}
      {showPrivacy && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowPrivacy(false)}>
          <div className="bg-slate-800 border border-slate-600 rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-600 sticky top-0 bg-slate-800">
              <h2 className="text-xl font-bold text-white">Privacy Policy</h2>
              <button onClick={() => setShowPrivacy(false)} className="p-1 hover:bg-slate-700 rounded-lg transition-colors text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4 text-slate-300">
              <p className="text-sm">
                <strong className="text-white">Last updated:</strong> January 2025
              </p>

              <div>
                <h3 className="font-semibold text-cyan-400 mb-2">Information We Collect</h3>
                <p className="text-sm">
                  We collect minimal information to provide the game experience:
                </p>
                <ul className="text-sm list-disc list-inside mt-2 space-y-1">
                  <li>Player name (chosen by you)</li>
                  <li>Game session data (scores, game state)</li>
                  <li>A randomly generated player ID stored locally</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-cyan-400 mb-2">How We Use Your Information</h3>
                <p className="text-sm">
                  Your information is used solely to enable multiplayer gameplay. We do not sell, share, or use your data for advertising purposes.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-cyan-400 mb-2">Data Storage</h3>
                <p className="text-sm">
                  Game data is stored temporarily in Firebase for active game sessions. Player IDs are stored in your browser's local storage. No personal information is permanently retained.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-cyan-400 mb-2">Cookies</h3>
                <p className="text-sm">
                  We use local storage to remember your player ID and theme preference. No tracking cookies are used.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-cyan-400 mb-2">Contact</h3>
                <p className="text-sm">
                  For any questions about this privacy policy, please visit our website.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function JoinScreen({ gameId, setGameId, playerName, setPlayerName, playerEmoji, setPlayerEmoji, joinGame, setScreen }) {
  const [gamePreview, setGamePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [nameError, setNameError] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleNameChange = (e) => {
    const sanitized = sanitizePlayerName(e.target.value);
    setPlayerName(sanitized);

    if (sanitized.length > 0) {
      const validation = validatePlayerName(sanitized);
      setNameError(validation.error);
    } else {
      setNameError(null);
    }
  };

  const handleJoin = () => {
    const validation = validatePlayerName(playerName);
    if (!validation.valid) {
      setNameError(validation.error);
      return;
    }
    joinGame();
  };

  // Fetch game preview when gameId changes
  useEffect(() => {
    const fetchGamePreview = async () => {
      if (!gameId || gameId.length < 4) {
        setGamePreview(null);
        setError('');
        return;
      }

      setLoading(true);
      setError('');

      try {
        const result = await window.storage.get(`game:${gameId}`, true);
        if (result) {
          const game = JSON.parse(result.value);
          setGamePreview(game);
          setError('');
        } else {
          setGamePreview(null);
          setError('Game not found');
        }
      } catch (err) {
        setGamePreview(null);
        setError('Game not found');
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchGamePreview, 300);
    return () => clearTimeout(debounceTimer);
  }, [gameId]);

  const hostPlayer = gamePreview?.players?.find(p => p.id === gamePreview.host);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-zinc-900 text-white flex items-center justify-center p-4 relative">
      <FloatingParticles />

      <div className="max-w-md w-full space-y-6 relative z-10">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-logo-glow">
            <Users className="w-10 h-10" />
          </div>
          <h2 className="text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">Join Game</h2>
          <p className="text-slate-300">Enter game code to join</p>
        </div>

        {/* Emoji Picker Modal */}
        {showEmojiPicker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowEmojiPicker(false)} />
            <div className="relative bg-slate-800 border border-slate-600 rounded-2xl p-6 shadow-2xl">
              <h3 className="text-lg font-semibold text-center mb-4 text-slate-200">Choose your avatar</h3>
              <div className="grid grid-cols-4 gap-3">
                {PLAYER_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => { setPlayerEmoji(emoji); setShowEmojiPicker(false); }}
                    className={`w-14 h-14 text-3xl rounded-xl transition-all hover:bg-slate-700 hover:scale-110 flex items-center justify-center ${
                      playerEmoji === emoji ? 'bg-cyan-500/30 border-2 border-cyan-400 scale-110' : 'bg-slate-700/50'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl p-6 border border-slate-700 space-y-4">
          <div>
            <div className="flex gap-2">
              {/* Emoji Picker Button */}
              <button
                onClick={() => setShowEmojiPicker(true)}
                className="w-12 h-12 text-2xl bg-slate-900/50 border border-slate-600 rounded-xl hover:border-cyan-500 hover:scale-105 transition-all flex items-center justify-center"
                title="Choose avatar"
              >
                {playerEmoji}
              </button>
              <input
                type="text"
                placeholder="Your name"
                value={playerName}
                onChange={handleNameChange}
                maxLength={PLAYER_NAME_MAX_LENGTH}
                className={`flex-1 bg-slate-900/50 border rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                  nameError ? 'border-red-500 focus:ring-red-500' : 'border-slate-600 focus:ring-cyan-500'
                }`}
              />
            </div>
            {nameError && (
              <div className="flex items-center gap-1 mt-1 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{nameError}</span>
              </div>
            )}
            <div className="text-right text-xs text-slate-500 mt-1">
              {playerName.length}/{PLAYER_NAME_MAX_LENGTH}
            </div>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Game Code"
              value={gameId}
              onChange={(e) => setGameId(e.target.value.toUpperCase())}
              className={`w-full bg-slate-900/50 border rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 uppercase transition-colors ${
                error ? 'border-red-500/50 focus:ring-red-500' :
                gamePreview ? 'border-emerald-500/50 focus:ring-emerald-500' :
                'border-slate-600 focus:ring-cyan-500'
              }`}
            />
            {loading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {!loading && gamePreview && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>

          {/* Game Preview Card */}
          {gamePreview && (
            <div className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-xl p-4 border border-slate-600/50 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span className="text-sm text-slate-300">Host:</span>
                  <span className="font-semibold text-white">{hostPlayer?.name || 'Unknown'}</span>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  gamePreview.status === 'lobby' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                  gamePreview.status === 'playing' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                  'bg-slate-500/20 text-slate-300 border border-slate-500/30'
                }`}>
                  {gamePreview.status === 'lobby' ? 'Waiting' :
                   gamePreview.status === 'playing' ? 'In Progress' : 'Finished'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-slate-800/50 rounded-lg px-3 py-2 flex items-center gap-2">
                  <Users className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-400">Players:</span>
                  <span className="font-medium text-white">{gamePreview.players?.length || 0}</span>
                </div>
                <div className="bg-slate-800/50 rounded-lg px-3 py-2 flex items-center gap-2">
                  <Target className="w-4 h-4 text-teal-400" />
                  <span className="text-slate-400">Rounds:</span>
                  <span className="font-medium text-white">{gamePreview.settings?.rounds || 3}</span>
                </div>
                <div className="bg-slate-800/50 rounded-lg px-3 py-2 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-violet-400" />
                  <span className="text-slate-400">Time:</span>
                  <span className="font-medium text-white">{gamePreview.settings?.roundTime || 60}s</span>
                </div>
                <div className="bg-slate-800/50 rounded-lg px-3 py-2 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span className="text-slate-400">Mode:</span>
                  <span className="font-medium text-white capitalize">{gamePreview.settings?.difficulty || 'mixed'}</span>
                </div>
              </div>

              {/* Player list preview */}
              {gamePreview.players?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {gamePreview.players.slice(0, 6).map((player, idx) => (
                    <span key={idx} className="bg-slate-700/50 px-2 py-1 rounded-md text-xs text-slate-300 flex items-center gap-1">
                      {player.id === gamePreview.host && <Crown className="w-3 h-3 text-amber-400" />}
                      {player.name}
                    </span>
                  ))}
                  {gamePreview.players.length > 6 && (
                    <span className="bg-slate-700/50 px-2 py-1 rounded-md text-xs text-slate-400">
                      +{gamePreview.players.length - 6} more
                    </span>
                  )}
                </div>
              )}

              <style>{`
                @keyframes fadeIn {
                  from { opacity: 0; transform: translateY(-10px); }
                  to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
              `}</style>
            </div>
          )}

          {/* Error message */}
          {error && gameId.length >= 4 && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-300 text-sm flex items-center gap-2">
              <X className="w-4 h-4" />
              {error}
            </div>
          )}

          <button
            onClick={handleJoin}
            disabled={!gamePreview || !playerName.trim() || nameError}
            className={`w-full px-6 py-3 rounded-xl font-bold transition-all transform shadow-lg flex items-center justify-center gap-2 ${
              gamePreview && playerName.trim()
                ? 'bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700 hover:scale-105 shadow-cyan-500/20'
                : 'bg-slate-700 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Play className="w-5 h-5" />
            {gamePreview?.status === 'playing' ? 'Join In Progress' : 'Join Game'}
          </button>

          <button
            onClick={() => setScreen('home')}
            className="w-full bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600 px-6 py-3 rounded-xl font-bold transition-all hover:border-slate-500"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
}

function LobbyScreen({ gameState, gameId, isHost, copyGameLink, startGame, leaveGame }) {
  if (!gameState) return null;

  const team1 = gameState.players.filter(p => p.team === 1);
  const team2 = gameState.players.filter(p => p.team === 2);

  // For team mode, require at least 2 players per team (4 total)
  const canStartTeamGame = team1.length >= 2 && team2.length >= 2;
  const canStartFFAGame = gameState.players.length >= 2;
  const canStart = gameState.settings.teamMode ? canStartTeamGame : canStartFFAGame;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-zinc-900 text-white p-4">
      <div className="max-w-4xl mx-auto space-y-6 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">Game Lobby</h2>
            <p className="text-slate-300 mt-1">Waiting for players...</p>
          </div>
          <button
            onClick={leaveGame}
            className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 px-4 py-2 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Leave
          </button>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xl font-bold text-cyan-300">Game Code: {gameId}</span>
            <button
              onClick={copyGameLink}
              className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 px-4 py-2 rounded-xl transition-colors"
            >
              <Copy className="w-4 h-4" />
              Copy Link
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <h3 className="text-sm text-slate-400 mb-2">Settings</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-slate-700/50 px-3 py-2 rounded-lg">Rounds: {gameState.settings.rounds}</div>
                <div className="bg-slate-700/50 px-3 py-2 rounded-lg">Time: {gameState.settings.roundTime}s</div>
                <div className="bg-slate-700/50 px-3 py-2 rounded-lg">Difficulty: {gameState.settings.difficulty}</div>
                <div className="bg-slate-700/50 px-3 py-2 rounded-lg">Mode: {gameState.settings.teamMode ? 'Teams' : 'FFA'}</div>
              </div>
            </div>
          </div>
        </div>

        {gameState.settings.teamMode ? (
          <div className="grid grid-cols-2 gap-4">
            <div className={`backdrop-blur-md rounded-2xl p-6 border ${team1.length >= 2 ? 'bg-cyan-500/20 border-cyan-500/30' : 'bg-cyan-500/10 border-cyan-500/20'}`}>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-cyan-300">
                <Users className="w-5 h-5" />
                Team 1 ({team1.length}/2+)
              </h3>
              <div className="space-y-2">
                {team1.map(player => (
                  <div key={player.id} className="bg-slate-800/50 px-4 py-2 rounded-lg flex items-center gap-2">
                    <span className="text-lg">{player.emoji || '😀'}</span>
                    {player.id === gameState.host && <Crown className="w-4 h-4 text-amber-400" />}
                    {player.name}
                  </div>
                ))}
                {team1.length < 2 && (
                  <div className="text-cyan-400/60 text-sm italic px-4 py-2">
                    Need {2 - team1.length} more player{2 - team1.length > 1 ? 's' : ''}...
                  </div>
                )}
              </div>
            </div>
            <div className={`backdrop-blur-md rounded-2xl p-6 border ${team2.length >= 2 ? 'bg-rose-500/20 border-rose-500/30' : 'bg-rose-500/10 border-rose-500/20'}`}>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-rose-300">
                <Users className="w-5 h-5" />
                Team 2 ({team2.length}/2+)
              </h3>
              <div className="space-y-2">
                {team2.map(player => (
                  <div key={player.id} className="bg-slate-800/50 px-4 py-2 rounded-lg flex items-center gap-2">
                    <span className="text-lg">{player.emoji || '😀'}</span>
                    {player.id === gameState.host && <Crown className="w-4 h-4 text-amber-400" />}
                    {player.name}
                  </div>
                ))}
                {team2.length < 2 && (
                  <div className="text-rose-400/60 text-sm italic px-4 py-2">
                    Need {2 - team2.length} more player{2 - team2.length > 1 ? 's' : ''}...
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl p-6 border border-slate-700">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-cyan-300">
              <Users className="w-5 h-5" />
              Players ({gameState.players.length})
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {gameState.players.map(player => (
                <div key={player.id} className="bg-slate-700/50 px-4 py-2 rounded-lg flex items-center gap-2">
                  <span className="text-lg">{player.emoji || '😀'}</span>
                  {player.id === gameState.host && <Crown className="w-4 h-4 text-amber-400" />}
                  {player.name}
                </div>
              ))}
            </div>
          </div>
        )}

        {isHost && canStart && (
          <button
            onClick={startGame}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 px-6 py-4 rounded-xl font-bold text-xl transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
          >
            <Play className="w-6 h-6" />
            Start Game
          </button>
        )}

        {isHost && !canStart && (
          <div className="text-center text-slate-400">
            {gameState.settings.teamMode
              ? `Waiting for at least 2 players per team (${team1.length} in Team 1, ${team2.length} in Team 2)...`
              : 'Waiting for at least 2 players to start...'}
          </div>
        )}

        {!isHost && (
          <div className="text-center text-slate-400">
            Waiting for host to start the game...
          </div>
        )}
      </div>
    </div>
  );
}

function GameMenu({ gameState, playerId, isHost, logoutPlayer, copyGameLink, kickPlayer, promoteDescriber, transferHost }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showPlayers, setShowPlayers] = useState(false);
  const [showRules, setShowRules] = useState(false);

  const currentPlayer = gameState?.players?.find(p => p.id === playerId);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isOpen && !e.target.closest('.game-menu-container')) {
        setIsOpen(false);
        setShowPlayers(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="game-menu-container relative">
      {/* Menu Button */}
      <button
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); setShowPlayers(false); }}
        className="flex items-center gap-2 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600 px-4 py-2 rounded-xl transition-colors"
      >
        <Menu className="w-5 h-5" />
        <span className="hidden sm:inline">Menu</span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="fixed sm:absolute inset-x-4 sm:inset-x-auto sm:right-0 top-16 sm:top-full sm:mt-2 w-auto sm:w-64 bg-slate-800 border border-slate-600 rounded-xl shadow-xl z-50 overflow-hidden max-h-[80vh] overflow-y-auto">
          {/* Player Info Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-cyan-500/20 to-teal-500/20 border-b border-slate-600">
            <div className="flex items-center gap-2">
              {isHost && <Crown className="w-4 h-4 text-amber-400" />}
              <span className="font-semibold">{currentPlayer?.name}</span>
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Score: <span className="text-amber-400 font-bold">{currentPlayer?.score || 0}</span>
            </div>
          </div>

          {/* Players Submenu */}
          <div className="border-b border-slate-700">
            <button
              onClick={(e) => { e.stopPropagation(); setShowPlayers(!showPlayers); }}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-700/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-cyan-400" />
                <span>Players ({gameState?.players?.length || 0})</span>
              </div>
              <ChevronRight className={`w-4 h-4 transition-transform ${showPlayers ? 'rotate-90' : ''}`} />
            </button>

            {showPlayers && (
              <div className="bg-slate-900/50 max-h-48 sm:max-h-48 overflow-y-auto">
                {gameState?.players?.map(player => (
                  <div
                    key={player.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-2 hover:bg-slate-700/30 gap-1 sm:gap-0"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{player.emoji || '😀'}</span>
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${player.connected !== false ? 'bg-emerald-400' : 'bg-red-400'}`} />
                      {player.id === gameState.host && <Crown className="w-3 h-3 text-amber-400 flex-shrink-0" />}
                      <span className={`text-sm truncate ${player.connected === false ? 'text-slate-500' : ''}`}>
                        {player.name}
                        {player.id === playerId && ' (You)'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 ml-6 sm:ml-0">
                      <span className="text-xs text-amber-400">{player.score}pts</span>
                      {player.id === gameState.currentDescriber && (
                        <Mic className="w-3 h-3 text-cyan-400 flex-shrink-0" title="Current describer" />
                      )}
                      {isHost && player.id !== playerId && player.id !== gameState.currentDescriber && (
                        <button
                          onClick={(e) => { e.stopPropagation(); promoteDescriber(player.id); }}
                          className="p-1.5 hover:bg-cyan-500/30 rounded transition-colors"
                          title="Make describer"
                        >
                          <MicVocal className="w-4 h-4 sm:w-3 sm:h-3 text-cyan-400" />
                        </button>
                      )}
                      {isHost && player.id !== playerId && (
                        <button
                          onClick={(e) => { e.stopPropagation(); transferHost(player.id); }}
                          className="p-1.5 hover:bg-amber-500/30 rounded transition-colors"
                          title="Transfer host"
                        >
                          <Crown className="w-4 h-4 sm:w-3 sm:h-3 text-amber-400" />
                        </button>
                      )}
                      {isHost && player.id !== playerId && (
                        <button
                          onClick={(e) => { e.stopPropagation(); kickPlayer(player.id); }}
                          className="p-1.5 hover:bg-red-500/30 rounded transition-colors"
                          title="Kick player"
                        >
                          <UserX className="w-4 h-4 sm:w-3 sm:h-3 text-red-400" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Copy Game Link */}
          <button
            onClick={(e) => { e.stopPropagation(); copyGameLink(); }}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700/50 transition-colors border-b border-slate-700"
          >
            <Link className="w-4 h-4 text-cyan-400" />
            <span>Copy Game Link</span>
          </button>

          {/* Game Rules */}
          <button
            onClick={(e) => { e.stopPropagation(); setShowRules(true); setIsOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700/50 transition-colors border-b border-slate-700"
          >
            <BookOpen className="w-4 h-4 text-teal-400" />
            <span>Game Rules</span>
          </button>

          {/* Logout */}
          <button
            onClick={(e) => { e.stopPropagation(); logoutPlayer(); }}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-500/20 transition-colors text-red-400"
          >
            <LogOut className="w-4 h-4" />
            <span>Leave Game</span>
          </button>
        </div>
      )}

      {/* Rules Modal */}
      {showRules && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowRules(false)}>
          <div className="bg-slate-800 border border-slate-600 rounded-2xl max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-600">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-teal-400" />
                Game Rules
              </h2>
              <button onClick={() => setShowRules(false)} className="p-1 hover:bg-slate-700 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4 text-slate-300">
              <div>
                <h3 className="font-semibold text-white mb-1">Objective</h3>
                <p className="text-sm">Guess as many words as possible based on the describer's clues.</p>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Describer's Role</h3>
                <p className="text-sm">Describe any word on the board without saying the word itself. You can describe multiple words in any order.</p>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Guesser's Role</h3>
                <p className="text-sm">Type your guesses in the input box. Points go to the first player to guess correctly.</p>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Scoring</h3>
                <ul className="text-sm list-disc list-inside space-y-1">
                  <li>Easy words: 1 point</li>
                  <li>Normal words: 2 points</li>
                  <li>Hard words: 3 points</li>
                  <li>Insane words: 5 points</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Winning</h3>
                <p className="text-sm">The player with the most points at the end of all rounds wins!</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GameScreen({ gameState, playerId, isDescriber, timeRemaining, breakTimeRemaining, restartCountdownRemaining, guessInput, setGuessInput, submitGuess, isHost, startNextRound, skipTurn, leaveGame, logoutPlayer, restartGame, copyGameLink, kickPlayer, promoteDescriber, transferHost }) {
  if (!gameState || gameState.status === 'finished') {
    return <ResultsScreen
      gameState={gameState}
      playerId={playerId}
      isHost={isHost}
      leaveGame={leaveGame}
      restartGame={restartGame}
      logoutPlayer={logoutPlayer}
      copyGameLink={copyGameLink}
      kickPlayer={kickPlayer}
      transferHost={transferHost}
    />;
  }

  const player = gameState.players.find(p => p.id === playerId);
  const describer = gameState.players.find(p => p.id === gameState.currentDescriber);
  const isDescriberOffline = describer && describer.connected === false;
  const onlinePlayers = gameState.players.filter(p => p.connected !== false);
  const availableDescribers = onlinePlayers.filter(p => p.id !== gameState.currentDescriber);

  // Team mode info
  const isTeamMode = gameState.settings.teamMode;
  const currentPlayingTeam = gameState.currentPlayingTeam;
  // Player is on active team if: not team mode, OR their team matches the current playing team
  const playerTeam = player?.team;
  const isOnActiveTeam = !isTeamMode || (playerTeam != null && playerTeam === currentPlayingTeam);
  // Player is idle (spectating) if: team mode is on AND they are NOT on the active team
  const isIdleTeam = isTeamMode && playerTeam != null && playerTeam !== currentPlayingTeam;
  const canGuess = !isDescriber && isOnActiveTeam;

  // Calculate team scores
  const team1Players = gameState.players.filter(p => p.team === 1);
  const team2Players = gameState.players.filter(p => p.team === 2);
  const team1Score = team1Players.reduce((sum, p) => sum + p.score, 0);
  const team2Score = team2Players.reduce((sum, p) => sum + p.score, 0);

  // Check if we're in restart countdown period
  const isRestartCountdown = gameState.restartCountdownEnd && !gameState.roundStartTime;

  // Check if we're in break period
  const isBreak = gameState.breakEndTime && !gameState.roundStartTime;

  // Show restart countdown screen
  if (isRestartCountdown) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-zinc-900 text-white p-4 flex items-center justify-center">
        <div className="text-center space-y-8">
          {/* Animated countdown circle */}
          <div className="relative inline-flex items-center justify-center">
            <div className="w-40 h-40 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-600/20 border-4 border-emerald-500/50 flex items-center justify-center animate-pulse">
              <span className="text-7xl font-bold text-emerald-400">
                {restartCountdownRemaining}
              </span>
            </div>
          </div>

          {/* Title */}
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">
              Get Ready!
            </h1>
            <p className="text-slate-400 mt-2 text-lg">New game starting...</p>
          </div>

          {/* First describer info */}
          <div className="bg-slate-800/50 backdrop-blur-md rounded-xl p-4 border border-slate-700 inline-block">
            <p className="text-slate-400 text-sm">First to describe</p>
            <p className="text-xl font-bold text-cyan-300">
              {describer?.emoji} {describer?.name}
              {isDescriber && <span className="text-amber-400 text-sm ml-2">(You)</span>}
            </p>
            {isTeamMode && (
              <span className={`text-xs px-2 py-1 rounded mt-1 inline-block ${currentPlayingTeam === 1 ? 'bg-cyan-500/30 text-cyan-300' : 'bg-rose-500/30 text-rose-300'}`}>
                Team {currentPlayingTeam}
              </span>
            )}
          </div>

          {/* Sparkle decoration */}
          <div className="flex justify-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-400 animate-pulse" />
            <Sparkles className="w-6 h-6 text-emerald-400 animate-pulse" style={{ animationDelay: '0.2s' }} />
            <Sparkles className="w-6 h-6 text-cyan-400 animate-pulse" style={{ animationDelay: '0.4s' }} />
          </div>
        </div>
      </div>
    );
  }

  // Show break screen
  if (isBreak) {
    // Group submissions by player
    const submissionsByPlayer = {};
    (gameState.submissions || []).forEach(sub => {
      if (!submissionsByPlayer[sub.playerId]) {
        submissionsByPlayer[sub.playerId] = {
          playerName: sub.playerName,
          submissions: []
        };
      }
      submissionsByPlayer[sub.playerId].submissions.push(sub);
    });

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-zinc-900 text-white p-4">
        {/* Menu in top right */}
        <div className="fixed top-4 right-4 z-50">
          <GameMenu
            gameState={gameState}
            playerId={playerId}
            isHost={isHost}
            logoutPlayer={logoutPlayer}
            copyGameLink={copyGameLink}
            kickPlayer={kickPlayer}
            promoteDescriber={promoteDescriber}
            transferHost={transferHost}
          />
        </div>

        <div className="max-w-4xl mx-auto space-y-5 py-6">

          {/* Header - Round Complete */}
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-cyan-300 to-teal-300 bg-clip-text text-transparent">
              {gameState.isLastRoundBreak ? 'Final Round Complete!' :
                isTeamMode ? `Team ${currentPlayingTeam === 1 ? 2 : 1}'s Turn Complete!` : `Round ${gameState.currentRound} Complete!`}
            </h1>
            {gameState.isLastRoundBreak && (
              <p className="text-slate-300 mt-2">Results coming up...</p>
            )}
          </div>

          {/* Team Scores during break (team mode only) */}
          {isTeamMode && (
            <div className="grid grid-cols-2 gap-4">
              <div className={`backdrop-blur-md rounded-xl p-4 border text-center ${currentPlayingTeam === 1 ? 'bg-cyan-500/20 border-cyan-500/40' : 'bg-cyan-500/10 border-cyan-500/20'}`}>
                <span className="text-cyan-300 font-bold">Team 1</span>
                <p className="text-2xl font-bold text-amber-400">{team1Score}</p>
                {currentPlayingTeam === 1 && <span className="text-xs text-cyan-400">Playing next</span>}
              </div>
              <div className={`backdrop-blur-md rounded-xl p-4 border text-center ${currentPlayingTeam === 2 ? 'bg-rose-500/20 border-rose-500/40' : 'bg-rose-500/10 border-rose-500/20'}`}>
                <span className="text-rose-300 font-bold">Team 2</span>
                <p className="text-2xl font-bold text-amber-400">{team2Score}</p>
                {currentPlayingTeam === 2 && <span className="text-xs text-rose-400">Playing next</span>}
              </div>
            </div>
          )}

          {/* Next Round Card - Primary Action at Top (only show if not last round) */}
          {!gameState.isLastRoundBreak ? (
            <div className="bg-gradient-to-br from-violet-500/10 to-purple-600/10 backdrop-blur-md rounded-2xl p-5 border border-violet-500/30">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Left side - Timer and Describer Info */}
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 ${isDescriberOffline ? 'bg-gradient-to-br from-red-500 to-rose-600' : 'bg-gradient-to-br from-cyan-500 to-teal-600'} rounded-xl flex items-center justify-center shrink-0`}>
                    <span className="text-2xl font-bold">{breakTimeRemaining}s</span>
                  </div>
                  <div className="text-center sm:text-left">
                    <p className="text-sm text-slate-400">
                      {isTeamMode ? `Team ${currentPlayingTeam}'s turn` : `Round ${gameState.currentRound + 1}`} starts in
                    </p>
                    <p className="text-lg">
                      <span className="text-slate-400">Next up: </span>
                      <span className={`font-bold ${isDescriberOffline ? 'text-red-400' : 'text-cyan-300'}`}>{describer?.name}</span>
                      {isTeamMode && (
                        <span className={`text-xs ml-2 px-1.5 py-0.5 rounded ${currentPlayingTeam === 1 ? 'bg-cyan-500/30 text-cyan-300' : 'bg-rose-500/30 text-rose-300'}`}>
                          Team {currentPlayingTeam}
                        </span>
                      )}
                      {isDescriber && <span className="text-xs ml-2 text-amber-400">(You)</span>}
                      {isDescriberOffline && <span className="text-xs ml-2 text-red-400">(Offline)</span>}
                    </p>
                  </div>
                </div>

                {/* Right side - Action Buttons */}
                <div className="flex flex-col gap-2 w-full sm:w-auto">
                  {isDescriber && breakTimeRemaining <= 0 && gameState.players.length >= 2 && (
                    <div className="flex gap-2">
                      <button
                        onClick={startNextRound}
                        className="flex-1 sm:flex-none bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 px-5 py-3 rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                      >
                        <Play className="w-5 h-5" />
                        Start Round
                      </button>
                      <button
                        onClick={skipTurn}
                        className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 px-4 py-3 rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                        title="Skip your turn"
                      >
                        <SkipForward className="w-5 h-5" />
                        <span className="hidden sm:inline">Skip</span>
                      </button>
                    </div>
                  )}
                  {gameState.players.length < 2 && (
                    <div className="text-amber-400 bg-amber-500/10 border border-amber-500/30 px-4 py-2 rounded-xl text-sm">
                      Need 2+ players to continue
                    </div>
                  )}
                  {/* Describer offline warning */}
                  {isDescriberOffline && !isDescriber && gameState.players.length >= 2 && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-2">
                      <p className="text-red-400 text-sm">
                        <span className="font-semibold">{describer?.name}</span> appears to be offline.
                        {!isHost && ' Waiting for host to assign a new describer...'}
                      </p>
                    </div>
                  )}
                  {/* Host controls - always show during break when not the describer */}
                  {isHost && !isDescriber && availableDescribers.length > 0 && gameState.players.length >= 2 && (
                    <div className="bg-slate-700/30 border border-slate-600 rounded-xl p-3">
                      <span className="text-xs text-slate-400 block mb-2">Assign describer:</span>
                      <div className="flex flex-wrap gap-2">
                        {availableDescribers.map(p => (
                          <button
                            key={p.id}
                            onClick={() => promoteDescriber(p.id)}
                            className="bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1"
                          >
                            <Mic className="w-3 h-3" />
                            {p.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Host but no available describers */}
                  {isHost && !isDescriber && availableDescribers.length === 0 && gameState.players.length >= 2 && (
                    <p className="text-amber-400 text-xs px-4 py-2">
                      No other online players available to assign.
                    </p>
                  )}
                  {/* Normal waiting state for non-hosts */}
                  {!isHost && !isDescriberOffline && !isDescriber && gameState.players.length >= 2 && (
                    <div className="text-slate-400 text-sm px-4 py-2">
                      Waiting for {describer?.name}...
                    </div>
                  )}
                  {/* Describer waiting state */}
                  {isDescriber && breakTimeRemaining > 0 && gameState.players.length >= 2 && (
                    <div className="text-slate-400 text-sm px-4 py-2">
                      Get ready to describe!
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-amber-500/10 to-orange-600/10 backdrop-blur-md rounded-2xl p-5 border border-amber-500/30">
              <div className="flex items-center justify-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shrink-0">
                  <Trophy className="w-8 h-8" />
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-lg font-bold text-amber-300">Game Over!</p>
                  <p className="text-sm text-slate-400">Showing results in {breakTimeRemaining}s...</p>
                </div>
              </div>
            </div>
          )}

          {/* Words This Round - Primary Focus */}
          <div className="bg-gradient-to-br from-cyan-500/10 to-teal-600/10 backdrop-blur-md rounded-2xl p-5 border border-cyan-500/30">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Zap className="w-6 h-6 text-cyan-400" />
              Words This Round
              <span className="text-sm font-normal text-slate-300 ml-auto bg-slate-800/50 px-3 py-1 rounded-full">
                {gameState.guesses.length}/{gameState.words.length} guessed
              </span>
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {gameState.words.map((wordObj, idx) => {
                const guessInfo = gameState.guesses.find(g => g.word === wordObj.word);
                const wasGuessed = !!guessInfo;
                const wordLen = wordObj.word.length;
                // More granular font sizing based on word length
                const fontSizeClass = wordLen > 14 ? 'text-[0.5rem] sm:text-[0.6rem]'
                  : wordLen > 11 ? 'text-[0.6rem] sm:text-[0.7rem]'
                  : wordLen > 8 ? 'text-[0.7rem] sm:text-xs'
                  : 'text-xs sm:text-sm';
                return (
                  <div
                    key={idx}
                    className={`p-2 sm:p-3 rounded-xl text-center transition-all overflow-hidden ${
                      wasGuessed
                        ? 'bg-emerald-500/30 border-2 border-emerald-400/70 shadow-lg shadow-emerald-500/20'
                        : 'bg-slate-800/60 border border-slate-600/50'
                    }`}
                  >
                    <div
                      className={`font-bold leading-tight min-h-[2.5em] flex items-center justify-center ${wasGuessed ? 'text-emerald-100' : 'text-slate-200'} ${fontSizeClass}`}
                      style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                    >
                      {wordObj.word}
                    </div>
                    <div className={`text-xs mt-1 ${wasGuessed ? 'text-emerald-300' : 'text-amber-400'}`}>
                      {wasGuessed ? `✓ ${guessInfo.playerName}` : `${wordObj.points}pt`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Player Submissions */}
          {(gameState.submissions || []).length > 0 && (
            <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-md rounded-2xl p-5 border border-slate-500/30">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Users className="w-6 h-6 text-teal-400" />
                Player Submissions
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.values(submissionsByPlayer).map((playerData, idx) => {
                  const totalPoints = playerData.submissions.reduce((sum, s) => sum + (s.isCorrect ? s.points : 0), 0);
                  return (
                    <div key={idx} className="bg-slate-800/60 rounded-xl p-4 border border-slate-600/40">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-cyan-300">{playerData.playerName}</h3>
                        <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded-full">
                          +{totalPoints} pts
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {playerData.submissions.map((sub, subIdx) => (
                          <div
                            key={subIdx}
                            className={`px-2.5 py-1.5 rounded-lg text-sm font-medium ${
                              sub.isCorrect
                                ? 'bg-emerald-500/30 border border-emerald-400/60 text-emerald-100'
                                : 'bg-red-500/20 border border-red-400/40 text-red-300/80 line-through'
                            }`}
                          >
                            {sub.word}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Standings - Compact at Bottom */}
          <div className="bg-slate-800/30 backdrop-blur-md rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-semibold text-slate-300">Current Standings</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {[...gameState.players].sort((a, b) => b.score - a.score).map((p, idx) => (
                <div
                  key={p.id}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                    idx === 0 ? 'bg-amber-500/20 border border-amber-500/40' :
                    'bg-slate-700/40 border border-slate-600/40'
                  }`}
                >
                  <span className="text-xs font-bold text-slate-400">#{idx + 1}</span>
                  <span className="text-sm font-medium">{p.name}</span>
                  <span className="text-sm font-bold text-amber-400">{p.score}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-zinc-900 text-white p-4">
      <div className="max-w-6xl mx-auto space-y-4 py-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            <div className={`flex items-center gap-2 bg-slate-800/50 px-4 py-2 rounded-xl border ${timeRemaining <= 10 ? 'bg-red-500/20 border-red-500/50' : 'border-slate-700'}`}>
              <Timer className={`w-5 h-5 ${timeRemaining <= 10 ? 'text-red-400 animate-pulse' : 'text-cyan-400'}`} />
              <span className={`text-2xl font-bold ${timeRemaining <= 10 ? 'text-red-400' : 'text-white'}`}>{timeRemaining}s</span>
            </div>
            <div className="bg-slate-800/50 px-4 py-2 rounded-xl border border-slate-700">
              Round {gameState.currentRound}/{gameState.settings.rounds}
            </div>
            {isTeamMode ? (
              <div className="flex items-center gap-2">
                <div className={`px-3 py-2 rounded-xl border ${currentPlayingTeam === 1 ? 'bg-cyan-500/30 border-cyan-500/50' : 'bg-cyan-500/10 border-cyan-500/20'}`}>
                  <span className="text-cyan-300 text-sm font-medium">T1: {team1Score}</span>
                </div>
                <div className={`px-3 py-2 rounded-xl border ${currentPlayingTeam === 2 ? 'bg-rose-500/30 border-rose-500/50' : 'bg-rose-500/10 border-rose-500/20'}`}>
                  <span className="text-rose-300 text-sm font-medium">T2: {team2Score}</span>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-amber-500/20 to-orange-600/20 px-4 py-2 rounded-xl border border-amber-500/30">
                <span className="text-slate-300 text-sm mr-2">Score:</span>
                <span className="text-xl font-bold text-amber-400">{player?.score || 0}</span>
              </div>
            )}
          </div>
          <GameMenu
            gameState={gameState}
            playerId={playerId}
            isHost={isHost}
            logoutPlayer={logoutPlayer}
            copyGameLink={copyGameLink}
            kickPlayer={kickPlayer}
            promoteDescriber={promoteDescriber}
            transferHost={transferHost}
          />
        </div>

        {/* Team Mode Status Banner */}
        {isTeamMode && (
          <div className={`text-center py-2 px-4 rounded-xl ${
            isIdleTeam
              ? 'bg-slate-700/50 border border-slate-600'
              : currentPlayingTeam === 1
                ? 'bg-cyan-500/20 border border-cyan-500/40'
                : 'bg-rose-500/20 border border-rose-500/40'
          }`}>
            {isIdleTeam ? (
              <span className="text-slate-300">
                Team {currentPlayingTeam} is playing - Watch and wait for your turn!
              </span>
            ) : (
              <span className={currentPlayingTeam === 1 ? 'text-cyan-300' : 'text-rose-300'}>
                Your team (Team {currentPlayingTeam}) is playing!
              </span>
            )}
          </div>
        )}

        <div className="space-y-4">
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md rounded-2xl p-6 border border-cyan-500/20">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2 text-cyan-300">
                <Crown className="w-5 h-5 text-amber-400" />
                <span>Describer: {describer?.name}</span>
                {isTeamMode && (
                  <span className={`text-xs px-2 py-0.5 rounded ${describer?.team === 1 ? 'bg-cyan-500/30 text-cyan-300' : 'bg-rose-500/30 text-rose-300'}`}>
                    Team {describer?.team}
                  </span>
                )}
              </div>

              {/* Show word grid to: describer, idle team spectators */}
              {/* Show "listen and guess" to: active team guessers */}
              {(isDescriber || isIdleTeam) ? (
                <div className="space-y-4">
                  {isDescriber ? (
                    <p className="text-lg text-cyan-200">Describe any word to your team!</p>
                  ) : (
                    <p className="text-lg text-slate-400">Spectating Team {currentPlayingTeam} - watch the words being described!</p>
                  )}
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                    {gameState.words.map((wordObj, idx) => {
                      const isGuessed = gameState.guesses.some(g => g.word === wordObj.word);
                      const isLongWord = wordObj.word.length > 12;
                      const pointColors = {
                        1: 'from-emerald-500/20 to-emerald-600/20 border-emerald-500/40 hover:border-emerald-400',
                        2: 'from-cyan-500/20 to-blue-600/20 border-cyan-500/40 hover:border-cyan-400',
                        3: 'from-amber-500/20 to-orange-600/20 border-amber-500/40 hover:border-amber-400',
                        4: 'from-rose-500/20 to-pink-600/20 border-rose-500/40 hover:border-rose-400',
                        5: 'from-violet-500/20 to-purple-600/20 border-violet-500/40 hover:border-violet-400'
                      };
                      const textColors = {
                        1: 'text-emerald-300',
                        2: 'text-cyan-300',
                        3: 'text-amber-300',
                        4: 'text-rose-300',
                        5: 'text-violet-300'
                      };
                      // Idle team sees slightly muted colors
                      const idleOpacity = isIdleTeam ? 'opacity-80' : '';
                      return (
                        <div
                          key={idx}
                          className={`p-2 sm:p-3 rounded-xl border-2 transition-all transform hover:scale-[1.02] overflow-hidden ${idleOpacity} ${
                            isGuessed
                              ? 'bg-slate-800/50 border-slate-600/50 opacity-40'
                              : `bg-gradient-to-br ${pointColors[wordObj.points] || pointColors[3]}`
                          }`}
                        >
                          <div className="text-center">
                            <h3 className={`font-bold break-all leading-tight min-h-[2.5em] flex items-center justify-center ${
                              isGuessed ? 'text-slate-400 line-through' : (textColors[wordObj.points] || 'text-white')
                            } ${isLongWord ? 'text-[0.6rem] sm:text-xs' : 'text-xs sm:text-sm'}`}>
                              {wordObj.word}
                            </h3>
                            <div className="flex items-center justify-center gap-1 mt-1">
                              <Star className={`w-3 h-3 ${isGuessed ? 'text-slate-500' : 'text-amber-400'}`} />
                              <span className={`text-xs font-bold ${isGuessed ? 'text-slate-500' : 'text-amber-300'}`}>
                                {wordObj.points}pt
                              </span>
                            </div>
                            {isGuessed && (
                              <div className="text-xs text-emerald-400 font-semibold">✓</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-lg text-slate-300">Listen and guess any word!</p>
                  <div className="text-center">
                    <div className="text-sm text-slate-400 mb-2">Words Remaining</div>
                    <div className="text-3xl font-bold text-cyan-400">
                      {gameState.words.length - gameState.guesses.length}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Guessing input - only for active team guessers */}
          {canGuess && (
            <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl p-6 border border-slate-700">
              <form onSubmit={(e) => { e.preventDefault(); submitGuess(); }} className="flex gap-3">
                <input
                  type="text"
                  placeholder="Type your guess..."
                  value={guessInput}
                  onChange={(e) => setGuessInput(e.target.value)}
                  className="flex-1 bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  autoFocus
                />
                <button
                  type="submit"
                  className="bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700 px-6 py-3 rounded-xl font-bold transition-all"
                >
                  Submit
                </button>
              </form>
            </div>
          )}

          {/* Idle team watching message */}
          {isIdleTeam && (
            <div className="bg-slate-700/30 backdrop-blur-md rounded-2xl p-4 border border-slate-600 text-center">
              <p className="text-slate-400 text-sm">Spectating - your team plays next!</p>
            </div>
          )}

          {(gameState.submissions || []).length > 0 && (
            <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl p-6 border border-slate-700">
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                Submitted Words This Round
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {(gameState.submissions || []).slice().reverse().map((submission, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between px-4 py-2 rounded-lg border ${
                      submission.isCorrect
                        ? 'bg-emerald-500/20 border-emerald-500/30'
                        : 'bg-red-500/10 border-red-500/20'
                    }`}
                  >
                    <span className="font-semibold">{submission.playerName}</span>
                    <div className="flex items-center gap-2">
                      <span className={submission.isCorrect ? 'text-emerald-300' : 'text-red-300/60'}>
                        {submission.word}
                      </span>
                      {submission.isCorrect && (
                        <span className="text-amber-400 text-sm">+{submission.points}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Confetti component for winner celebration
function Confetti() {
  const colors = ['#fbbf24', '#22d3ee', '#f472b6', '#a78bfa', '#34d399', '#fb923c'];
  const confettiPieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 3,
    duration: 2 + Math.random() * 2,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: 8 + Math.random() * 8,
    rotation: Math.random() * 360
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {confettiPieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute animate-confetti-fall"
          style={{
            left: `${piece.left}%`,
            top: '-20px',
            width: `${piece.size}px`,
            height: `${piece.size}px`,
            backgroundColor: piece.color,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
            transform: `rotate(${piece.rotation}deg)`,
            borderRadius: Math.random() > 0.5 ? '50%' : '0%'
          }}
        />
      ))}
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .animate-confetti-fall {
          animation: confetti-fall linear forwards;
        }
      `}</style>
    </div>
  );
}

// Animated counter component
function AnimatedScore({ value, duration = 1500 }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime;
    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      setDisplayValue(Math.floor(progress * value));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [value, duration]);

  return <span>{displayValue}</span>;
}

// Generate player avatar with initials
function PlayerAvatar({ name, emoji, size = 'md', highlight = false }) {
  const getColorFromName = (name) => {
    const colors = [
      'from-cyan-400 to-blue-500',
      'from-purple-400 to-pink-500',
      'from-amber-400 to-orange-500',
      'from-emerald-400 to-teal-500',
      'from-rose-400 to-red-500',
      'from-indigo-400 to-purple-500'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-xl',
    lg: 'w-16 h-16 text-2xl',
    xl: 'w-20 h-20 text-3xl'
  };

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${getColorFromName(name)} flex items-center justify-center font-bold text-white shadow-lg ${highlight ? 'ring-4 ring-amber-400 ring-offset-2 ring-offset-slate-900' : ''}`}>
      {emoji || '😀'}
    </div>
  );
}

// Fun title generator based on performance
function getPlayerTitle(player, allPlayers, submissions, isWinner) {
  if (isWinner) return { title: 'Champion', icon: '👑', color: 'text-amber-400' };

  const playerSubmissions = submissions.filter(s => s.playerId === player.id);
  const correctGuesses = playerSubmissions.filter(s => s.isCorrect).length;
  const totalSubmissions = playerSubmissions.length;

  if (correctGuesses === 0 && totalSubmissions > 5) return { title: 'Persistent', icon: '💪', color: 'text-blue-400' };
  if (correctGuesses > 0 && totalSubmissions > 0 && correctGuesses / totalSubmissions > 0.7) return { title: 'Sharpshooter', icon: '🎯', color: 'text-emerald-400' };
  if (player.score === allPlayers[allPlayers.length - 1]?.score && player.score > 0) return { title: 'Underdog', icon: '🐕', color: 'text-orange-400' };
  if (correctGuesses >= 5) return { title: 'Word Wizard', icon: '🧙', color: 'text-purple-400' };
  if (totalSubmissions > 10) return { title: 'Eager Beaver', icon: '🦫', color: 'text-amber-600' };

  return { title: 'Player', icon: '🎮', color: 'text-slate-400' };
}

function ResultsScreen({ gameState, playerId, isHost, leaveGame, restartGame, logoutPlayer, copyGameLink, kickPlayer, transferHost }) {
  const [showSettings, setShowSettings] = useState(false);
  const [newSettings, setNewSettings] = useState(gameState?.settings || { rounds: 3, roundTime: 60, difficulty: 'mixed', teamMode: false });
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  if (!gameState) return null;

  const isTeamMode = gameState.settings.teamMode;
  const sortedPlayers = [...gameState.players].sort((a, b) => b.score - a.score);
  const connectedPlayers = gameState.players.filter(p => p.connected !== false);
  const canRestart = connectedPlayers.length >= 2;
  const submissions = gameState.submissions || [];

  // Calculate game statistics
  const gameDuration = gameState.createdAt ? Math.floor((Date.now() - gameState.createdAt) / 1000 / 60) : 0;
  const totalWordsGuessed = (gameState.guesses || []).length;
  const totalWords = gameState.words?.length || 0;

  // Calculate best streak per player
  const calculateBestStreak = () => {
    const streaks = {};
    let currentStreaks = {};

    submissions.filter(s => s.isCorrect).forEach(sub => {
      currentStreaks[sub.playerId] = (currentStreaks[sub.playerId] || 0) + 1;
      streaks[sub.playerId] = Math.max(streaks[sub.playerId] || 0, currentStreaks[sub.playerId]);
    });

    submissions.filter(s => !s.isCorrect).forEach(sub => {
      currentStreaks[sub.playerId] = 0;
    });

    let bestPlayer = null;
    let bestStreak = 0;
    Object.entries(streaks).forEach(([playerId, streak]) => {
      if (streak > bestStreak) {
        bestStreak = streak;
        bestPlayer = gameState.players.find(p => p.id === playerId);
      }
    });

    return { player: bestPlayer, streak: bestStreak };
  };

  // Find MVP (most points in a single round concept - approximated by highest scorer)
  const mvp = sortedPlayers[0];
  const bestStreakData = calculateBestStreak();

  // Calculate accuracy per player
  const getPlayerAccuracy = (playerId) => {
    const playerSubs = submissions.filter(s => s.playerId === playerId);
    if (playerSubs.length === 0) return 0;
    const correct = playerSubs.filter(s => s.isCorrect).length;
    return Math.round((correct / playerSubs.length) * 100);
  };

  // Calculate team scores for team mode
  const team1Players = gameState.players.filter(p => p.team === 1);
  const team2Players = gameState.players.filter(p => p.team === 2);
  const team1Score = team1Players.reduce((sum, p) => sum + p.score, 0);
  const team2Score = team2Players.reduce((sum, p) => sum + p.score, 0);
  const winningTeam = team1Score > team2Score ? 1 : team1Score < team2Score ? 2 : 0; // 0 = tie
  const winner = isTeamMode ? null : sortedPlayers[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-zinc-900 text-white flex items-center justify-center p-4 overflow-hidden">
      {/* Confetti Animation */}
      {showConfetti && <Confetti />}

      {/* Menu in top right */}
      <div className="fixed top-4 right-4 z-50">
        <GameMenu
          gameState={gameState}
          playerId={playerId}
          isHost={isHost}
          logoutPlayer={logoutPlayer}
          copyGameLink={copyGameLink}
          kickPlayer={kickPlayer}
          promoteDescriber={() => {}} // Not needed in results screen
          transferHost={transferHost}
        />
      </div>

      <div className="max-w-4xl w-full space-y-6 relative z-10">
        {/* Winner Announcement with Animated Trophy */}
        <div className="text-center space-y-4">
          <div className="relative inline-block">
            <Trophy className="w-24 h-24 text-amber-400 mx-auto animate-bounce" />
            <div className="absolute inset-0 w-24 h-24 mx-auto bg-amber-400/20 rounded-full blur-xl animate-pulse" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-400 bg-clip-text text-transparent animate-pulse">
            Game Over!
          </h1>
          {isTeamMode ? (
            <p className="text-2xl md:text-3xl text-cyan-300">
              {winningTeam === 0 ? "It's a tie!" : `Team ${winningTeam} wins!`}
            </p>
          ) : (
            <div className="flex items-center justify-center gap-3">
              <PlayerAvatar name={winner?.name || 'Winner'} emoji={winner?.emoji} size="lg" highlight />
              <p className="text-2xl md:text-3xl text-cyan-300">{winner?.name} wins!</p>
            </div>
          )}
        </div>

        {/* Game Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-gradient-to-br from-cyan-500/20 to-blue-600/20 backdrop-blur-md rounded-xl p-4 border border-cyan-500/30 text-center">
            <Clock className="w-6 h-6 mx-auto mb-2 text-cyan-400" />
            <p className="text-2xl font-bold text-white">{gameDuration}</p>
            <p className="text-xs text-slate-400">Minutes Played</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-500/20 to-teal-600/20 backdrop-blur-md rounded-xl p-4 border border-emerald-500/30 text-center">
            <Target className="w-6 h-6 mx-auto mb-2 text-emerald-400" />
            <p className="text-2xl font-bold text-white">{totalWordsGuessed}/{totalWords}</p>
            <p className="text-xs text-slate-400">Words Guessed</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500/20 to-pink-600/20 backdrop-blur-md rounded-xl p-4 border border-purple-500/30 text-center">
            <Sparkles className="w-6 h-6 mx-auto mb-2 text-purple-400" />
            <p className="text-2xl font-bold text-white">{bestStreakData.streak}</p>
            <p className="text-xs text-slate-400">Best Streak</p>
          </div>
          <div className="bg-gradient-to-br from-amber-500/20 to-orange-600/20 backdrop-blur-md rounded-xl p-4 border border-amber-500/30 text-center">
            <Star className="w-6 h-6 mx-auto mb-2 text-amber-400" />
            <p className="text-2xl font-bold text-white">{mvp?.name?.split(' ')[0] || '-'}</p>
            <p className="text-xs text-slate-400">MVP</p>
          </div>
        </div>

        {/* Team Scores (for team mode) */}
        {isTeamMode && (
          <div className="grid grid-cols-2 gap-4">
            <div className={`backdrop-blur-md rounded-2xl p-6 border text-center transform transition-all hover:scale-105 ${
              winningTeam === 1 ? 'bg-gradient-to-br from-amber-500/20 to-cyan-500/20 border-amber-500/50 shadow-lg shadow-amber-500/20' : 'bg-cyan-500/20 border-cyan-500/30'
            }`}>
              <h3 className="text-xl font-bold mb-2 flex items-center justify-center gap-2 text-cyan-300">
                {winningTeam === 1 && <Trophy className="w-5 h-5 text-amber-400" />}
                Team 1
              </h3>
              <p className="text-4xl font-bold text-amber-400"><AnimatedScore value={team1Score} /></p>
              <p className="text-sm text-slate-400 mt-2">{team1Players.length} players</p>
            </div>
            <div className={`backdrop-blur-md rounded-2xl p-6 border text-center transform transition-all hover:scale-105 ${
              winningTeam === 2 ? 'bg-gradient-to-br from-amber-500/20 to-rose-500/20 border-amber-500/50 shadow-lg shadow-amber-500/20' : 'bg-rose-500/20 border-rose-500/30'
            }`}>
              <h3 className="text-xl font-bold mb-2 flex items-center justify-center gap-2 text-rose-300">
                {winningTeam === 2 && <Trophy className="w-5 h-5 text-amber-400" />}
                Team 2
              </h3>
              <p className="text-4xl font-bold text-amber-400"><AnimatedScore value={team2Score} /></p>
              <p className="text-sm text-slate-400 mt-2">{team2Players.length} players</p>
            </div>
          </div>
        )}

        {/* Podium for top 3 (non-team mode) */}
        {!isTeamMode && sortedPlayers.length >= 3 && (
          <div className="flex items-end justify-center gap-2 md:gap-4 h-48">
            {/* 2nd Place */}
            <div className="flex flex-col items-center">
              <PlayerAvatar name={sortedPlayers[1]?.name || ''} emoji={sortedPlayers[1]?.emoji} size="md" />
              <p className="text-sm font-semibold mt-2 text-slate-300 truncate max-w-[80px]">{sortedPlayers[1]?.name}</p>
              <div className="bg-gradient-to-t from-slate-400/40 to-slate-300/20 border border-slate-400/50 rounded-t-lg w-20 md:w-24 h-24 flex flex-col items-center justify-center mt-2">
                <span className="text-3xl">🥈</span>
                <p className="text-xl font-bold text-white"><AnimatedScore value={sortedPlayers[1]?.score || 0} /></p>
              </div>
            </div>
            {/* 1st Place */}
            <div className="flex flex-col items-center">
              <div className="relative">
                <PlayerAvatar name={sortedPlayers[0]?.name || ''} emoji={sortedPlayers[0]?.emoji} size="lg" highlight />
                <div className="absolute -top-2 -right-2 text-2xl animate-bounce">👑</div>
              </div>
              <p className="text-sm font-semibold mt-2 text-amber-300 truncate max-w-[80px]">{sortedPlayers[0]?.name}</p>
              <div className="bg-gradient-to-t from-amber-500/40 to-yellow-400/20 border-2 border-amber-500/50 rounded-t-lg w-24 md:w-28 h-32 flex flex-col items-center justify-center mt-2 shadow-lg shadow-amber-500/20">
                <span className="text-4xl">🥇</span>
                <p className="text-2xl font-bold text-amber-400"><AnimatedScore value={sortedPlayers[0]?.score || 0} /></p>
              </div>
            </div>
            {/* 3rd Place */}
            <div className="flex flex-col items-center">
              <PlayerAvatar name={sortedPlayers[2]?.name || ''} emoji={sortedPlayers[2]?.emoji} size="md" />
              <p className="text-sm font-semibold mt-2 text-slate-300 truncate max-w-[80px]">{sortedPlayers[2]?.name}</p>
              <div className="bg-gradient-to-t from-orange-700/40 to-orange-600/20 border border-orange-700/50 rounded-t-lg w-20 md:w-24 h-20 flex flex-col items-center justify-center mt-2">
                <span className="text-2xl">🥉</span>
                <p className="text-lg font-bold text-white"><AnimatedScore value={sortedPlayers[2]?.score || 0} /></p>
              </div>
            </div>
          </div>
        )}

        {/* Full Leaderboard */}
        <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl p-6 border border-slate-700/50">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            {isTeamMode ? 'Individual Contributions' : 'Final Standings'}
          </h2>
          <div className="space-y-2">
            {sortedPlayers.map((player, idx) => {
              const playerTitle = getPlayerTitle(player, sortedPlayers, submissions, idx === 0 && !isTeamMode);
              const accuracy = getPlayerAccuracy(player.id);

              return (
                <div
                  key={player.id}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:scale-[1.02] ${
                    !isTeamMode && idx === 0 ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/50' :
                    !isTeamMode && idx === 1 ? 'bg-gradient-to-r from-slate-400/10 to-slate-300/10 border border-slate-400/30' :
                    !isTeamMode && idx === 2 ? 'bg-gradient-to-r from-orange-700/20 to-orange-600/10 border border-orange-700/30' :
                    isTeamMode && player.team === 1 ? 'bg-cyan-500/10 border border-cyan-500/30' :
                    isTeamMode && player.team === 2 ? 'bg-rose-500/10 border border-rose-500/30' :
                    'bg-slate-800/30 border border-slate-700/50'
                  }`}
                >
                  {/* Rank */}
                  {!isTeamMode && (
                    <span className="text-2xl font-bold w-8 text-center">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                    </span>
                  )}

                  {/* Team Badge */}
                  {isTeamMode && (
                    <span className={`text-xs px-2 py-1 rounded font-semibold ${player.team === 1 ? 'bg-cyan-500/30 text-cyan-300' : 'bg-rose-500/30 text-rose-300'}`}>
                      T{player.team}
                    </span>
                  )}

                  {/* Avatar */}
                  <PlayerAvatar name={player.name} emoji={player.emoji} size="sm" />

                  {/* Name and Title */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{player.name}</p>
                    <p className={`text-xs ${playerTitle.color}`}>
                      {playerTitle.icon} {playerTitle.title}
                    </p>
                  </div>

                  {/* Accuracy */}
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-slate-400">Accuracy</p>
                    <p className="text-sm font-semibold text-emerald-400">{accuracy}%</p>
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <p className="text-2xl font-bold text-amber-400">
                      <AnimatedScore value={player.score} duration={1000 + idx * 200} />
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Host Controls */}
        {isHost ? (
          <div className="space-y-3">
            {showSettings && (
              <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl p-6 border border-slate-700 space-y-4">
                <h3 className="text-xl font-bold mb-2">Game Settings</h3>
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Rounds</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newSettings.rounds}
                    onChange={(e) => setNewSettings({...newSettings, rounds: parseInt(e.target.value)})}
                    className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Round Time (seconds)</label>
                  <input
                    type="number"
                    min="30"
                    max="180"
                    value={newSettings.roundTime}
                    onChange={(e) => setNewSettings({...newSettings, roundTime: parseInt(e.target.value)})}
                    className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Difficulty</label>
                  <select
                    value={newSettings.difficulty}
                    onChange={(e) => setNewSettings({...newSettings, difficulty: e.target.value})}
                    className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-2 text-white"
                  >
                    {Object.entries(DIFFICULTY_CONFIG).map(([key, config]) => (
                      <option key={key} value={key}>
                        {config.label} {config.points ? `(${config.points} pt${config.points > 1 ? 's' : ''})` : '(All)'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowSettings(!showSettings)}
              className="w-full bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600 px-6 py-3 rounded-xl font-bold transition-all"
            >
              <Settings className="w-5 h-5 inline mr-2" />
              {showSettings ? 'Hide Settings' : 'Change Settings'}
            </button>

            {!canRestart && (
              <div className="bg-amber-500/20 border border-amber-500/50 rounded-xl px-4 py-3 text-amber-300 text-center">
                <AlertCircle className="w-5 h-5 inline mr-2" />
                Need at least 2 connected players to restart ({connectedPlayers.length} connected)
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => restartGame(newSettings)}
                disabled={!canRestart}
                className={`px-6 py-4 rounded-xl font-bold text-lg transition-all shadow-lg flex items-center justify-center gap-2 ${
                  canRestart
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 transform hover:scale-105'
                    : 'bg-slate-600 cursor-not-allowed opacity-50'
                }`}
              >
                <Play className="w-5 h-5" />
                Play Again
              </button>

              <button
                onClick={leaveGame}
                className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 px-6 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105"
              >
                Exit
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={leaveGame}
            className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 px-6 py-4 rounded-xl font-bold text-xl transition-all transform hover:scale-105"
          >
            Back to Home
          </button>
        )}
      </div>
    </div>
  );
}

function App() {
  const [screen, setScreen] = useState('home');
  const [gameId, setGameId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [playerEmoji, setPlayerEmoji] = useState(PLAYER_EMOJIS[0]);
  const [playerId, setPlayerId] = useState('');
  const [gameState, setGameState] = useState(null);
  const [guessInput, setGuessInput] = useState('');
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Update current time every second for timer display
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const savedPlayerId = window.localStorage.getItem('taboo_player_id');
    if (savedPlayerId) setPlayerId(savedPlayerId);

    const urlParams = new URLSearchParams(window.location.search);
    const gameParam = urlParams.get('game');
    if (gameParam) {
      setGameId(gameParam);

      // Check if game exists and if player is already in it
      window.storage.get(`game:${gameParam}`, true).then(result => {
        if (result) {
          const game = JSON.parse(result.value);

          // Check if game is stale/corrupted (no players or no host)
          const isStaleGame = !game.players || game.players.length === 0 || !game.host;
          if (isStaleGame) {
            console.log('Stale game detected, redirecting to home');
            window.history.replaceState({}, '', window.location.pathname);
            setGameId('');
            alert('This game session has expired. Please create or join a new game.');
            setScreen('home');
            return;
          }

          // Check if all players have been offline for too long (zombie game)
          const ZOMBIE_THRESHOLD = 30 * 60 * 1000; // 30 minutes
          const now = Date.now();
          const allPlayersOfflineTooLong = game.players.every(p => {
            if (!p.lastSeen) return true; // No lastSeen means never connected properly
            return (now - p.lastSeen) > ZOMBIE_THRESHOLD;
          });
          if (allPlayersOfflineTooLong) {
            console.log('Zombie game detected (all players offline 30+ min), redirecting to home');
            window.history.replaceState({}, '', window.location.pathname);
            setGameId('');
            alert('This game session has expired. All players have been inactive for too long.');
            setScreen('home');
            return;
          }

          // Check if saved player is in this game
          if (savedPlayerId) {
            const existingPlayer = game.players.find(p => p.id === savedPlayerId);

            if (existingPlayer) {
              // Player is already in the game - rejoin directly
              console.log('Player refreshed - rejoining game directly');
              setPlayerName(existingPlayer.name);
              setGameState(game);

              if (game.status === 'playing') {
                setScreen('game');
              } else if (game.status === 'finished') {
                setScreen('game');
              } else {
                setScreen('lobby');
              }
              return;
            }
          }
          // Game exists but player not in it - show join screen
          setScreen('join');
        } else {
          // Game doesn't exist - clear URL and show home with message
          console.log('Game not found, redirecting to home');
          window.history.replaceState({}, '', window.location.pathname);
          setGameId('');
          alert('This game no longer exists. It may have expired or been deleted.');
          setScreen('home');
        }
      }).catch(() => {
        // Error fetching game - clear URL and show home
        window.history.replaceState({}, '', window.location.pathname);
        setGameId('');
        setScreen('home');
      });
    }
  }, []);

  // Subscribe to real-time updates from Firebase
  useEffect(() => {
    if (gameId && (screen === 'game' || screen === 'lobby')) {
      console.log('Setting up Firebase listener for game:', gameId);

      // Subscribe to real-time updates
      const unsubscribe = firebaseStorage.subscribe(`game:${gameId}`, (data) => {
        if (data) {
          const newState = JSON.parse(data);
          console.log('Real-time update:', newState.players.length, 'players', newState.players.map(p => p.name), 'status:', newState.status);

          // Check if current player was kicked
          const currentPlayerId = window.localStorage.getItem('taboo_player_id');
          const playerStillInGame = newState.players.some(p => p.id === currentPlayerId);

          if (!playerStillInGame && currentPlayerId) {
            console.log('Player was kicked from the game');
            alert('You have been removed from the game by the host.');
            window.localStorage.removeItem('taboo_player_id');
            setPlayerId('');
            setPlayerName('');
            setScreen('home');
            setGameId('');
            setGameState(null);
            return;
          }

          setGameState(newState);

          // Auto-switch to game screen when status changes to 'playing'
          if (newState.status === 'playing' && screen === 'lobby') {
            console.log('Game started! Switching to game screen');
            setScreen('game');
          }
        }
      });

      return () => {
        console.log('Cleaning up Firebase listener');
        unsubscribe();
      };
    }
  }, [gameId, screen]);

  // Heartbeat to track player presence
  useEffect(() => {
    if (!gameId || !playerId || (screen !== 'game' && screen !== 'lobby')) return;

    const HEARTBEAT_INTERVAL = 5000; // Send heartbeat every 5 seconds
    const DISCONNECT_THRESHOLD = 16000; // Consider disconnected after 16 seconds

    const sendHeartbeat = async () => {
      try {
        const result = await window.storage.get(`game:${gameId}`, true);
        if (!result) return;

        const game = JSON.parse(result.value);
        const now = Date.now();

        // Update all players' connection status
        const updatedPlayers = game.players.map(p => {
          if (p.id === playerId) {
            // Current player: update lastSeen and mark as connected
            return { ...p, lastSeen: now, connected: true };
          }
          // Other players: check if they've sent a heartbeat recently
          const isConnected = p.lastSeen && (now - p.lastSeen) < DISCONNECT_THRESHOLD;
          return { ...p, connected: isConnected };
        });

        // Auto-transfer host if current host has been disconnected for 60 seconds
        const HOST_DISCONNECT_THRESHOLD = 60000;
        let newHost = game.host;
        const currentHost = updatedPlayers.find(p => p.id === game.host);
        if (currentHost && currentHost.lastSeen && (now - currentHost.lastSeen) > HOST_DISCONNECT_THRESHOLD) {
          const newHostPlayer = updatedPlayers.find(p => p.connected === true);
          if (newHostPlayer && newHostPlayer.id !== game.host) {
            newHost = newHostPlayer.id;
            console.log('Host disconnected for 60s, auto-transferring to:', newHostPlayer.name);
          }
        }

        await window.storage.set(`game:${gameId}`, JSON.stringify({ ...game, players: updatedPlayers, host: newHost }), true);
      } catch (err) {
        console.error('Heartbeat error:', err);
      }
    };

    // Send initial heartbeat
    sendHeartbeat();

    // Set up interval
    const interval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

    return () => clearInterval(interval);
  }, [gameId, playerId, screen]);

  const generateId = () => Math.random().toString(36).substring(2, 8).toUpperCase();

  const createGame = async (settings) => {
    const newGameId = generateId();
    const newPlayerId = generateId();

    const game = {
      id: newGameId,
      host: newPlayerId,
      settings,
      players: [{ id: newPlayerId, name: playerName, emoji: playerEmoji, score: 0, team: settings.teamMode ? 1 : null }],
      status: 'lobby',
      currentRound: 0,
      currentDescriber: newPlayerId,
      currentPlayingTeam: settings.teamMode ? 1 : null, // Track which team is currently playing
      teamDescriberIndex: { 1: 0, 2: 0 }, // Track describer rotation within each team
      words: [],
      roundStartTime: null,
      roundEndTime: null,
      breakEndTime: null,
      guesses: [],
      submissions: [], // Track all submissions (correct and incorrect)
      createdAt: Date.now()
    };

    try {
      await window.storage.set(`game:${newGameId}`, JSON.stringify(game), true);
      setGameId(newGameId);
      setPlayerId(newPlayerId);
      window.localStorage.setItem('taboo_player_id', newPlayerId);
      setGameState(game);
      setScreen('lobby');

      // Update URL to include game ID so refresh works (delayed for Safari compatibility)
      setTimeout(() => {
        try {
          const newUrl = `${window.location.origin}${window.location.pathname}?game=${newGameId}`;
          window.history.replaceState({ gameId: newGameId }, '', newUrl);
        } catch (e) {
          console.warn('Could not update URL:', e);
        }
      }, 100);

      // Run cleanup in background (don't await)
      firebaseStorage.cleanupOldGames();
    } catch (err) {
      console.error('Create game error:', err);
      alert('Failed to create game: ' + err.message);
    }
  };

  const joinGame = async () => {
    if (!gameId || !playerName) {
      alert('Please enter your name and game code');
      return;
    }

    try {
      console.log('Attempting to join game:', gameId);

      const result = await window.storage.get(`game:${gameId}`, true);
      if (!result) {
        alert('Game not found! Please check the game code.');
        return;
      }

      const game = JSON.parse(result.value);

      let existingPlayer = game.players.find(p => p.id === playerId);

      if (existingPlayer) {
        // Player is reconnecting - keep their score and info
        existingPlayer.name = playerName;
        existingPlayer.emoji = playerEmoji;
        console.log('Player reconnecting:', playerName, 'Score:', existingPlayer.score);
      } else {
        const newPlayerId = generateId();
        const teamAssignment = game.settings.teamMode
          ? (game.players.filter(p => p.team === 1).length <= game.players.filter(p => p.team === 2).length ? 1 : 2)
          : null;

        game.players.push({
          id: newPlayerId,
          name: playerName,
          emoji: playerEmoji,
          score: 0,
          team: teamAssignment
        });
        setPlayerId(newPlayerId);
        window.localStorage.setItem('taboo_player_id', newPlayerId);
      }

      console.log('Saving updated game with', game.players.length, 'players:', game.players.map(p => p.name));
      await window.storage.set(`game:${gameId}`, JSON.stringify(game), true);

      setGameState(game);

      // Update URL to include game ID so refresh works (delayed for Safari compatibility)
      setTimeout(() => {
        try {
          const newUrl = `${window.location.origin}${window.location.pathname}?game=${gameId}`;
          window.history.replaceState({ gameId }, '', newUrl);
        } catch (e) {
          console.warn('Could not update URL:', e);
        }
      }, 100);

      // Auto-switch to the correct screen based on game status
      if (game.status === 'playing') {
        console.log('Rejoining active game - switching to game screen');
        setScreen('game');
      } else if (game.status === 'finished') {
        console.log('Game has finished - showing results');
        setScreen('game'); // GameScreen component handles showing results
      } else {
        setScreen('lobby');
      }
    } catch (err) {
      console.error('Join game error:', err);
      alert('Failed to join game: ' + err.message);
    }
  };

  const updateGame = async (updates) => {
    try {
      const result = await window.storage.get(`game:${gameId}`, true);
      if (!result) return;
      
      const game = JSON.parse(result.value);
      const updatedGame = { ...game, ...updates };
      await window.storage.set(`game:${gameId}`, JSON.stringify(updatedGame), true);
      setGameState(updatedGame);
    } catch (err) {
      console.error('Error updating game:', err);
    }
  };

  const startGame = async () => {
    if (!gameState) return;

    // Generate random words for the first round (20 words per round)
    const wordPool = getWordsForDifficulty(gameState.settings.difficulty, 300);
    const shuffled = [...wordPool].sort(() => Math.random() - 0.5);
    const words = shuffled.slice(0, 20);

    // For team mode, set up the first describer from team 1
    let firstDescriber = gameState.currentDescriber;
    let currentPlayingTeam = gameState.currentPlayingTeam;
    let teamDescriberIndex = gameState.teamDescriberIndex || { 1: 0, 2: 0 };

    if (gameState.settings.teamMode) {
      const team1Players = gameState.players.filter(p => p.team === 1);
      if (team1Players.length > 0) {
        firstDescriber = team1Players[0].id;
        currentPlayingTeam = 1;
        teamDescriberIndex = { 1: 0, 2: 0 };
      }
    }

    await updateGame({
      status: 'playing',
      currentRound: 1,
      words,
      roundStartTime: Date.now(),
      roundEndTime: null,
      breakEndTime: null,
      guesses: [],
      submissions: [],
      currentDescriber: firstDescriber,
      currentPlayingTeam,
      teamDescriberIndex
    });
    setScreen('game');
  };

  const submitGuess = async () => {
    if (!guessInput.trim() || !gameState) return;

    const guessedWord = guessInput.trim().toLowerCase();
    const player = gameState.players.find(p => p.id === playerId);

    // In team mode, only allow guessing if you're on the active team and not the describer
    if (gameState.settings.teamMode) {
      if (player.team !== gameState.currentPlayingTeam) {
        // Player is on the idle team, can't guess
        setGuessInput('');
        return;
      }
      if (playerId === gameState.currentDescriber) {
        // Describer can't guess
        setGuessInput('');
        return;
      }
    }

    // Find if this word exists in the word list
    const matchedWord = gameState.words.find(w =>
      w.word.toLowerCase() === guessedWord
    );

    // Check if this word has already been correctly guessed by someone
    const alreadyGuessed = gameState.guesses.some(g =>
      g.word.toLowerCase() === guessedWord
    );

    const isCorrect = matchedWord && !alreadyGuessed;

    // Record this submission (both correct and incorrect)
    const newSubmission = {
      playerId,
      playerName: player.name,
      word: guessInput.trim(), // Keep original casing for display
      isCorrect,
      points: isCorrect ? matchedWord.points : 0,
      timestamp: Date.now()
    };

    const newSubmissions = [...(gameState.submissions || []), newSubmission];

    // Only award points to the first correct guesser
    if (isCorrect) {
      const updatedPlayers = gameState.players.map(p =>
        p.id === playerId ? { ...p, score: p.score + matchedWord.points } : p
      );

      const newGuesses = [...gameState.guesses, {
        playerId,
        playerName: player.name,
        word: matchedWord.word,
        points: matchedWord.points,
        timestamp: Date.now()
      }];

      await updateGame({
        players: updatedPlayers,
        guesses: newGuesses,
        submissions: newSubmissions
      });
    } else {
      // Just record the incorrect submission
      await updateGame({
        submissions: newSubmissions
      });
    }

    setGuessInput('');
  };

  const endRound = async () => {
    if (!gameState) return;

    const isTeamMode = gameState.settings.teamMode;
    const totalRounds = gameState.settings.rounds;

    // In team mode, each "round" has two team turns (team1 then team2)
    // So actual rounds = totalRounds * 2 team turns
    let isLastRound;
    let nextDescriber;
    let nextPlayingTeam = gameState.currentPlayingTeam;
    let teamDescriberIndex = { ...gameState.teamDescriberIndex } || { 1: 0, 2: 0 };

    if (isTeamMode) {
      const team1Players = gameState.players.filter(p => p.team === 1);
      const team2Players = gameState.players.filter(p => p.team === 2);
      const currentTeam = gameState.currentPlayingTeam;

      if (currentTeam === 1) {
        // Team 1 just finished, switch to Team 2
        nextPlayingTeam = 2;
        // Move to next describer in team 1 for their next turn
        teamDescriberIndex[1] = (teamDescriberIndex[1] + 1) % team1Players.length;
        // Get the next describer from team 2
        const team2DescriberIdx = teamDescriberIndex[2];
        nextDescriber = team2Players[team2DescriberIdx % team2Players.length]?.id || team2Players[0]?.id;
        // Not last round yet (team 2 needs to play)
        isLastRound = false;
      } else {
        // Team 2 just finished, this completes one full round
        nextPlayingTeam = 1;
        // Move to next describer in team 2 for their next turn
        teamDescriberIndex[2] = (teamDescriberIndex[2] + 1) % team2Players.length;
        // Get the next describer from team 1
        const team1DescriberIdx = teamDescriberIndex[1];
        nextDescriber = team1Players[team1DescriberIdx % team1Players.length]?.id || team1Players[0]?.id;
        // Check if this was the last round
        isLastRound = gameState.currentRound >= totalRounds;
      }
    } else {
      // FFA mode - original logic
      isLastRound = gameState.currentRound >= totalRounds;
      const nextDescriberIndex = (gameState.players.findIndex(p => p.id === gameState.currentDescriber) + 1) % gameState.players.length;
      nextDescriber = gameState.players[nextDescriberIndex].id;
    }

    await updateGame({
      roundEndTime: Date.now(),
      breakEndTime: Date.now() + (isLastRound ? 20000 : 10000), // 20 seconds for final summary, 10 for normal breaks
      currentDescriber: nextDescriber,
      currentPlayingTeam: nextPlayingTeam,
      teamDescriberIndex,
      roundStartTime: null,
      isLastRoundBreak: isLastRound // Flag to indicate this is the final round break
    });
  };

  const startNextRound = async () => {
    if (!gameState) return;

    // Generate new random words for this round (20 words per round)
    const wordPool = getWordsForDifficulty(gameState.settings.difficulty, 300);
    const shuffled = [...wordPool].sort(() => Math.random() - 0.5);
    const words = shuffled.slice(0, 20);

    const isTeamMode = gameState.settings.teamMode;

    // In team mode, only increment round when team 1 starts (after team 2 finishes)
    let newRound = gameState.currentRound;
    if (isTeamMode) {
      // Increment round only when team 1 is starting (team 2 just finished)
      if (gameState.currentPlayingTeam === 1) {
        newRound = gameState.currentRound + 1;
      }
    } else {
      newRound = gameState.currentRound + 1;
    }

    await updateGame({
      currentRound: newRound,
      words,
      roundStartTime: Date.now(),
      roundEndTime: null,
      breakEndTime: null,
      guesses: [],
      submissions: []
    });
  };

  const skipTurn = async () => {
    if (!gameState || gameState.currentDescriber !== playerId) return;

    const isTeamMode = gameState.settings.teamMode;

    if (isTeamMode) {
      // In team mode, skip to next describer in the same team
      const currentTeam = gameState.currentPlayingTeam;
      const teamPlayers = gameState.players.filter(p => p.team === currentTeam);
      const teamDescriberIndex = { ...gameState.teamDescriberIndex } || { 1: 0, 2: 0 };

      // Move to next describer in the team
      teamDescriberIndex[currentTeam] = (teamDescriberIndex[currentTeam] + 1) % teamPlayers.length;
      const nextDescriber = teamPlayers[teamDescriberIndex[currentTeam]]?.id;

      await updateGame({
        currentDescriber: nextDescriber,
        teamDescriberIndex,
        breakEndTime: Date.now() + 10000
      });
    } else {
      // FFA mode - original logic
      const currentIndex = gameState.players.findIndex(p => p.id === playerId);
      const nextIndex = (currentIndex + 1) % gameState.players.length;
      const nextDescriber = gameState.players[nextIndex].id;

      await updateGame({
        currentDescriber: nextDescriber,
        breakEndTime: Date.now() + 10000
      });
    }
  };

  const leaveGame = async () => {
    // Remove player from the game if we have game state
    if (gameState && playerId) {
      // Clear localStorage first to prevent the Firebase listener from
      // showing "removed by host" alert when we remove ourselves
      window.localStorage.removeItem('taboo_player_id');

      try {
        const updatedPlayers = gameState.players.filter(p => p.id !== playerId);

        // If this was the host and there are other players, assign new host
        let newHostId = gameState.host;
        if (gameState.host === playerId && updatedPlayers.length > 0) {
          newHostId = updatedPlayers[0].id;
        }

        // If this was the current describer, assign next describer
        let newDescriber = gameState.currentDescriber;
        if (gameState.currentDescriber === playerId && updatedPlayers.length > 0) {
          const currentIndex = gameState.players.findIndex(p => p.id === playerId);
          const nextIndex = currentIndex % updatedPlayers.length;
          newDescriber = updatedPlayers[nextIndex]?.id || updatedPlayers[0]?.id;
        }

        await updateGame({
          players: updatedPlayers,
          host: newHostId,
          currentDescriber: newDescriber
        });
      } catch (err) {
        console.error('Error removing player from game:', err);
      }
    }

    setScreen('home');
    setGameId('');
    setGameState(null);
  };

  const logoutPlayer = async () => {
    if (!gameState || !playerId) return;

    try {
      // Remove player from the game
      const updatedPlayers = gameState.players.filter(p => p.id !== playerId);

      // If this was the host and there are other players, assign new host
      let newHostId = gameState.host;
      if (gameState.host === playerId && updatedPlayers.length > 0) {
        newHostId = updatedPlayers[0].id;
      }

      // If this was the current describer, assign next describer
      let newDescriber = gameState.currentDescriber;
      if (gameState.currentDescriber === playerId && updatedPlayers.length > 0) {
        const currentIndex = gameState.players.findIndex(p => p.id === playerId);
        const nextIndex = currentIndex % updatedPlayers.length;
        newDescriber = updatedPlayers[nextIndex]?.id || updatedPlayers[0]?.id;
      }

      // Update the game state
      await updateGame({
        players: updatedPlayers,
        host: newHostId,
        currentDescriber: newDescriber
      });

      // Clear local storage
      window.localStorage.removeItem('taboo_player_id');

      // Reset local state
      setPlayerId('');
      setPlayerName('');
      setScreen('home');
      setGameId('');
      setGameState(null);

      console.log('Player logged out successfully');
    } catch (err) {
      console.error('Logout error:', err);
      alert('Failed to logout: ' + err.message);
    }
  };

  const restartGame = async (newSettings) => {
    if (!gameState || !isHost) return;

    // Check if there are at least 2 connected players
    const connectedPlayers = gameState.players.filter(p => p.connected !== false);
    if (connectedPlayers.length < 2) {
      alert('Cannot restart game! You need at least 2 connected players to play. Please wait for more players to join.');
      return;
    }

    try {
      // Reset all player scores
      const resetPlayers = gameState.players.map(p => ({ ...p, score: 0 }));

      // Select new words for the first round (20 words per round)
      const wordPool = getWordsForDifficulty(newSettings.difficulty, 300);
      const shuffled = [...wordPool].sort(() => Math.random() - 0.5);
      const words = shuffled.slice(0, 20);

      // For team mode, set up the first describer from team 1
      let firstDescriber = connectedPlayers[0]?.id;
      let currentPlayingTeam = null;
      let teamDescriberIndex = { 1: 0, 2: 0 };

      if (newSettings.teamMode) {
        const team1Players = resetPlayers.filter(p => p.team === 1);
        if (team1Players.length > 0) {
          firstDescriber = team1Players[0].id;
          currentPlayingTeam = 1;
        }
      }

      // Set up countdown before game starts (5 seconds)
      await updateGame({
        players: resetPlayers,
        settings: newSettings,
        status: 'playing',
        currentRound: 1,
        currentDescriber: firstDescriber,
        currentPlayingTeam,
        teamDescriberIndex,
        words,
        roundStartTime: null, // Don't start timer yet
        roundEndTime: null,
        breakEndTime: null,
        restartCountdownEnd: Date.now() + 5000, // 5 second countdown
        guesses: [],
        submissions: [],
        isLastRoundBreak: false
      });

      console.log('Game restart countdown started');
      setScreen('game');
    } catch (err) {
      console.error('Restart game error:', err);
      alert('Failed to restart game: ' + err.message);
    }
  };

  const copyGameLink = () => {
    const link = `${window.location.origin}${window.location.pathname}?game=${gameId}`;
    navigator.clipboard.writeText(link);
    alert('Game link copied!');
  };

  const kickPlayer = async (playerIdToKick) => {
    if (!gameState || !isHost) return;

    if (!window.confirm('Are you sure you want to kick this player?')) return;

    try {
      const updatedPlayers = gameState.players.filter(p => p.id !== playerIdToKick);

      // If the kicked player was the current describer, move to next player
      let newDescriber = gameState.currentDescriber;
      if (gameState.currentDescriber === playerIdToKick && updatedPlayers.length > 0) {
        const currentIndex = gameState.players.findIndex(p => p.id === playerIdToKick);
        const nextIndex = currentIndex % updatedPlayers.length;
        newDescriber = updatedPlayers[nextIndex]?.id || updatedPlayers[0]?.id;
      }

      await updateGame({
        players: updatedPlayers,
        currentDescriber: newDescriber
      });

      console.log('Player kicked successfully');
    } catch (err) {
      console.error('Kick player error:', err);
      alert('Failed to kick player: ' + err.message);
    }
  };

  const promoteDescriber = async (newDescriberId) => {
    if (!gameState || !isHost) return;

    // Only allow during break periods (not mid-round)
    if (gameState.roundStartTime && !gameState.breakEndTime) {
      alert('Cannot change describer during an active round. Wait for the round to end.');
      return;
    }

    try {
      await updateGame({
        currentDescriber: newDescriberId,
        breakEndTime: Date.now() + 10000 // Reset break timer for the new describer
      });
      console.log('Describer changed successfully');
    } catch (err) {
      console.error('Promote describer error:', err);
      alert('Failed to change describer: ' + err.message);
    }
  };

  const transferHost = async (newHostId) => {
    if (!gameState || !isHost) return;

    if (!window.confirm('Are you sure you want to transfer host to this player?')) return;

    try {
      await updateGame({
        host: newHostId
      });
      console.log('Host transferred successfully');
    } catch (err) {
      console.error('Transfer host error:', err);
      alert('Failed to transfer host: ' + err.message);
    }
  };

  const isHost = gameState?.host === playerId;
  const isDescriber = gameState?.currentDescriber === playerId;

  const timeRemaining = gameState?.roundStartTime
    ? Math.max(0, gameState.settings.roundTime - Math.floor((currentTime - gameState.roundStartTime) / 1000))
    : 0;

  const breakTimeRemaining = gameState?.breakEndTime
    ? Math.max(0, Math.floor((gameState.breakEndTime - currentTime) / 1000))
    : 0;

  const restartCountdownRemaining = gameState?.restartCountdownEnd
    ? Math.max(0, Math.floor((gameState.restartCountdownEnd - currentTime) / 1000))
    : 0;

  useEffect(() => {
    if (gameState?.status === 'playing' && gameState.roundStartTime && timeRemaining === 0 && isHost) {
      endRound();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRemaining, gameState?.status, gameState?.roundStartTime, isHost]);

  // Handle transition from last round break to finished state
  useEffect(() => {
    if (gameState?.isLastRoundBreak && breakTimeRemaining === 0 && isHost) {
      updateGame({ status: 'finished', isLastRoundBreak: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [breakTimeRemaining, gameState?.isLastRoundBreak, isHost]);

  // Handle restart countdown completion - start the actual game
  useEffect(() => {
    if (gameState?.restartCountdownEnd && restartCountdownRemaining === 0 && isHost && !gameState.roundStartTime) {
      updateGame({
        roundStartTime: Date.now(),
        restartCountdownEnd: null
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restartCountdownRemaining, gameState?.restartCountdownEnd, isHost, gameState?.roundStartTime]);

  if (screen === 'home') {
    return <HomeScreen
      playerName={playerName}
      setPlayerName={setPlayerName}
      playerEmoji={playerEmoji}
      setPlayerEmoji={setPlayerEmoji}
      setScreen={setScreen}
      createGame={createGame}
    />;
  }

  if (screen === 'join') {
    return <JoinScreen
      gameId={gameId}
      setGameId={setGameId}
      playerName={playerName}
      setPlayerName={setPlayerName}
      playerEmoji={playerEmoji}
      setPlayerEmoji={setPlayerEmoji}
      joinGame={joinGame}
      setScreen={setScreen}
    />;
  }

  if (screen === 'lobby') {
    return <LobbyScreen
      gameState={gameState}
      gameId={gameId}
      isHost={isHost}
      copyGameLink={copyGameLink}
      startGame={startGame}
      leaveGame={leaveGame}
    />;
  }

  if (screen === 'game') {
    return <GameScreen
      gameState={gameState}
      playerId={playerId}
      isDescriber={isDescriber}
      timeRemaining={timeRemaining}
      breakTimeRemaining={breakTimeRemaining}
      restartCountdownRemaining={restartCountdownRemaining}
      guessInput={guessInput}
      setGuessInput={setGuessInput}
      submitGuess={submitGuess}
      isHost={isHost}
      startNextRound={startNextRound}
      skipTurn={skipTurn}
      leaveGame={leaveGame}
      logoutPlayer={logoutPlayer}
      restartGame={restartGame}
      copyGameLink={copyGameLink}
      kickPlayer={kickPlayer}
      promoteDescriber={promoteDescriber}
      transferHost={transferHost}
    />;
  }

  return null;
}

export { App };
export default App;
        