import React, { useState, useEffect, useRef } from 'react';
import { Timer, Users, Trophy, Play, Copy, Crown, Zap, Star, Settings, LogOut, SkipForward, Menu, UserX, X, Link, BookOpen, ChevronRight, ChevronDown, Mic, MicVocal, MessageCircle, Target, Clock, Sparkles, AlertCircle, Check, Send, ArrowRightLeft, Pencil } from 'lucide-react';
import { firebaseStorage } from './firebase';
import { getWordsForDifficulty, DIFFICULTY_CONFIG } from './words';

// Use Firebase storage
window.storage = firebaseStorage;

// Player name validation
const PLAYER_NAME_MAX_LENGTH = 20;
const PLAYER_NAME_MIN_LENGTH = 2;

// Player limits
const MAX_PLAYERS_FFA = 12;
const MAX_PLAYERS_TEAM = 12; // 6 per team
const MAX_PLAYERS_PER_TEAM = 6;

// Player emoji options - popular/fun ones first
const PLAYER_EMOJIS = [
  // Popular picks
  '🎮', '🔥', '😎', '🦄', '🚀', '⭐',
  // More options
  '🦊', '🐱', '🐶', '🤓', '🎯', '😀', '👻', '🌈', '💎', '🎪'
];

// Custom Dropdown Component
function CustomDropdown({ value, onChange, options, label }) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="relative">
      {label && <label className="block text-sm text-slate-300 mb-2">{label}</label>}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-slate-800/80 border border-slate-600 rounded-xl px-4 py-3 text-white flex items-center justify-between hover:border-cyan-500/50 transition-colors"
      >
        <span>{selectedOption?.label || 'Select...'}</span>
        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute z-50 w-full mt-2 bg-slate-800 border border-slate-600 rounded-xl shadow-xl overflow-hidden">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-3 text-left flex items-center justify-between hover:bg-slate-700/80 transition-colors ${
                  value === option.value ? 'bg-cyan-500/20 text-cyan-300' : 'text-white'
                }`}
              >
                <span>{option.label}</span>
                {value === option.value && <Check className="w-4 h-4 text-cyan-400" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Toggle Switch Component
function ToggleSwitch({ checked, onChange, label, badge, helperText }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-slate-300">{label}</span>
          {badge && (
            <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
              {badge}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => onChange(!checked)}
          className={`relative w-14 h-8 rounded-full transition-all duration-300 ${
            checked
              ? 'bg-cyan-500 shadow-[0_0_12px_rgba(34,211,238,0.5)] ring-2 ring-cyan-400/30'
              : 'bg-slate-600'
          }`}
        >
          <div
            className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 ease-[cubic-bezier(0.68,-0.55,0.265,1.55)] ${
              checked ? 'translate-x-7' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
      {checked && helperText && (
        <p className="text-xs text-cyan-400/80 pl-0.5 animate-pulse">{helperText}</p>
      )}
    </div>
  );
}

// Custom Number Input with styled +/- buttons
function NumberInput({ value, onChange, min, max, label, hint }) {
  const handleDecrement = () => {
    const newVal = Math.max(min, (parseInt(value) || min) - 1);
    onChange(newVal);
  };

  const handleIncrement = () => {
    const newVal = Math.min(max, (parseInt(value) || min) + 1);
    onChange(newVal);
  };

  const handleChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    if (val === '') {
      onChange('');
      return;
    }
    onChange(parseInt(val));
  };

  const handleBlur = () => {
    const num = parseInt(value) || min;
    onChange(Math.min(max, Math.max(min, num)));
  };

  return (
    <div>
      {label && <label className="block text-sm text-slate-400 mb-2">{label}</label>}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleDecrement}
          className="w-10 h-10 flex items-center justify-center bg-transparent hover:bg-slate-700 border border-slate-600 hover:border-slate-500 rounded-lg text-slate-500 hover:text-white active:bg-slate-600 active:scale-90 transition-all text-xl font-bold"
        >
          −
        </button>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          className="flex-1 bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-2 text-white text-center font-semibold text-lg"
        />
        <button
          type="button"
          onClick={handleIncrement}
          className="w-10 h-10 flex items-center justify-center bg-transparent hover:bg-slate-700 border border-slate-600 hover:border-slate-500 rounded-lg text-slate-500 hover:text-white active:bg-slate-600 active:scale-90 transition-all text-xl font-bold"
        >
          +
        </button>
      </div>
      {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
    </div>
  );
}

// Feedback Modal Component
function FeedbackModal({ isOpen, onClose }) {
  const [feedback, setFeedback] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, sending, success, error

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!feedback.trim()) return;

    setStatus('sending');
    try {
      const response = await fetch('https://formspree.io/f/xgoaozqp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          message: feedback,
          contact: email || 'Not provided',
          page: window.location.href
        })
      });

      if (response.ok) {
        setStatus('success');
        setFeedback('');
        setEmail('');
        setTimeout(() => {
          onClose();
          setStatus('idle');
        }, 2000);
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-800 border border-slate-600 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-cyan-400" />
          Send Feedback
        </h2>
        <p className="text-slate-400 text-sm mb-4">
          Help us improve! Share your thoughts, report bugs, or suggest features.
        </p>

        {status === 'success' ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-emerald-400" />
            </div>
            <p className="text-emerald-400 font-semibold">Thank you for your feedback!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-300 mb-2">Your Message *</label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value.slice(0, 500))}
                placeholder="What's on your mind?"
                rows={4}
                minLength={10}
                maxLength={500}
                className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none resize-none"
                required
              />
              <p className="text-xs text-slate-500 mt-1 text-right">{feedback.length}/500</p>
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-2">Email (optional)</label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              />
              <p className="text-xs text-slate-500 mt-1">Only if you'd like us to respond</p>
            </div>

            {status === 'error' && (
              <p className="text-red-400 text-sm">Something went wrong. Please try again.</p>
            )}

            <button
              type="submit"
              disabled={status === 'sending' || !feedback.trim()}
              className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                status === 'sending' || !feedback.trim()
                  ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700 text-white'
              }`}
            >
              {status === 'sending' ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Feedback
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

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

        @keyframes bubble-slide-left {
          0% { transform: translateX(-100%) translateY(50%); opacity: 0; }
          60% { transform: translateX(10%) translateY(-5%); opacity: 1; }
          80% { transform: translateX(-5%) translateY(2%); opacity: 1; }
          100% { transform: translateX(0) translateY(0); opacity: 1; }
        }
        @keyframes bubble-slide-right {
          0% { transform: translateX(100%) translateY(50%); opacity: 0; }
          60% { transform: translateX(-10%) translateY(-5%); opacity: 1; }
          80% { transform: translateX(5%) translateY(2%); opacity: 1; }
          100% { transform: translateX(0) translateY(0); opacity: 1; }
        }
        @keyframes bubble-content-pop {
          0% { transform: scale(0) rotate(0deg); opacity: 0; }
          50% { transform: scale(1.15) rotate(0deg); opacity: 1; }
          75% { transform: scale(0.95) rotate(0deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes emoji-spin {
          0%, 70%, 100% { transform: rotateY(0deg); }
          85% { transform: rotateY(360deg); }
        }
        @keyframes bubble-text-fade {
          0% { transform: translateY(10px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes bubble-gentle-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .animate-bubble-left {
          animation: bubble-slide-left 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards,
                     bubble-gentle-float 4s ease-in-out 1.2s infinite;
        }
        .animate-bubble-right {
          animation: bubble-slide-right 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s forwards,
                     bubble-gentle-float 4s ease-in-out 1.4s infinite;
        }
        .animate-content-pop {
          opacity: 0;
          display: inline-block;
          animation: bubble-content-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.6s forwards,
                     emoji-spin 3s ease-in-out 1.5s infinite;
        }
        .animate-content-pop-delayed {
          opacity: 0;
          display: inline-block;
          animation: bubble-content-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.8s forwards,
                     emoji-spin 3s ease-in-out 1.7s infinite;
        }
        .animate-text-fade {
          opacity: 0;
          animation: bubble-text-fade 0.4s ease-out 0.9s forwards;
        }
        .animate-text-fade-delayed {
          opacity: 0;
          animation: bubble-text-fade 0.4s ease-out 1.1s forwards;
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
  const [showFeedback, setShowFeedback] = useState(false);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-zinc-900 text-white flex items-center justify-center p-4 relative overflow-hidden">
      <FloatingParticles />

      {/* Speech Bubble - Bottom Left */}
      <div className="absolute bottom-12 left-2 md:bottom-6 md:left-6 pointer-events-none z-0 animate-bubble-left" style={{ opacity: 0 }}>
        <div className="relative">
          <svg width="180" height="140" viewBox="0 0 180 140" className="w-32 h-28 md:w-52 md:h-40">
            <defs>
              <linearGradient id="bubbleGradientLeft" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgb(6 182 212 / 0.3)" />
                <stop offset="100%" stopColor="rgb(20 184 166 / 0.3)" />
              </linearGradient>
            </defs>
            <path
              d="M15,5 L165,5 Q175,5 175,15 L175,100 Q175,110 165,110 L40,110 L12,135 L22,110 L15,110 Q5,110 5,100 L5,15 Q5,5 15,5 Z"
              fill="url(#bubbleGradientLeft)"
              stroke="rgb(6 182 212 / 0.5)"
              strokeWidth="1.5"
            />
          </svg>
          <div className="absolute top-0 left-0 w-32 h-24 md:w-52 md:h-36 flex flex-col items-center justify-center px-2">
            <span className="text-2xl md:text-3xl mb-1 animate-content-pop">⚡</span>
            <span className="text-[10px] md:text-sm font-bold text-cyan-200 tracking-tight text-center leading-snug animate-text-fade">Fast-paced<br/>word fun!</span>
          </div>
        </div>
      </div>

      {/* Speech Bubble - Bottom Right */}
      <div className="absolute bottom-12 right-2 md:bottom-6 md:right-6 pointer-events-none z-0 animate-bubble-right" style={{ opacity: 0 }}>
        <div className="relative">
          <svg width="170" height="140" viewBox="0 0 170 140" className="w-28 h-28 md:w-48 md:h-40">
            <defs>
              <linearGradient id="bubbleGradientRight" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgb(20 184 166 / 0.3)" />
                <stop offset="100%" stopColor="rgb(6 182 212 / 0.3)" />
              </linearGradient>
            </defs>
            <path
              d="M15,5 L155,5 Q165,5 165,15 L165,100 Q165,110 155,110 L150,110 L158,135 L125,110 L15,110 Q5,110 5,100 L5,15 Q5,5 15,5 Z"
              fill="url(#bubbleGradientRight)"
              stroke="rgb(20 184 166 / 0.5)"
              strokeWidth="1.5"
            />
          </svg>
          <div className="absolute top-0 left-0 w-28 h-24 md:w-48 md:h-36 flex flex-col items-center justify-center px-2">
            <span className="text-2xl md:text-3xl mb-1 animate-content-pop-delayed">🎮</span>
            <span className="text-[10px] md:text-sm font-bold text-teal-200 tracking-tight text-center leading-snug animate-text-fade-delayed">Play together,<br/>win together!</span>
          </div>
        </div>
      </div>

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
            <div className="relative bg-slate-800 border border-slate-600 rounded-2xl p-6 shadow-2xl min-w-[280px]">
              <h3 className="text-lg font-semibold text-center mb-4 text-slate-200">Choose your avatar</h3>

              {/* Popular picks */}
              <div className="mb-3">
                <p className="text-xs text-cyan-400 font-medium mb-2 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Popular
                </p>
                <div className="grid grid-cols-6 gap-2">
                  {PLAYER_EMOJIS.slice(0, 6).map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => { setPlayerEmoji(emoji); setShowEmojiPicker(false); }}
                      className={`w-11 h-11 text-2xl rounded-xl transition-all hover:bg-slate-700 hover:scale-110 flex items-center justify-center ${
                        playerEmoji === emoji ? 'bg-cyan-500/30 border-2 border-cyan-400 scale-110' : 'bg-slate-700/50'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* More options */}
              <div>
                <p className="text-xs text-slate-400 font-medium mb-2">More</p>
                <div className="grid grid-cols-5 gap-2">
                  {PLAYER_EMOJIS.slice(6).map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => { setPlayerEmoji(emoji); setShowEmojiPicker(false); }}
                      className={`w-11 h-11 text-2xl rounded-xl transition-all hover:bg-slate-700 hover:scale-110 flex items-center justify-center ${
                        playerEmoji === emoji ? 'bg-cyan-500/30 border-2 border-cyan-400 scale-110' : 'bg-slate-700/50'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Card */}
        <div className="card-rich backdrop-blur-md rounded-2xl p-6 border border-slate-700 space-y-4">
          <div>
            <div className="flex gap-2">
              {/* Emoji Picker Button */}
              <button
                onClick={() => setShowEmojiPicker(true)}
                className="relative w-12 h-12 text-2xl bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-cyan-500/50 rounded-xl hover:border-cyan-400 hover:scale-110 hover:shadow-lg hover:shadow-cyan-500/20 transition-all flex items-center justify-center group"
                title="Click to choose avatar"
              >
                {playerEmoji}
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-cyan-500 rounded-full flex items-center justify-center shadow-md group-hover:bg-cyan-400 transition-colors">
                  <Pencil className="w-3 h-3 text-slate-900" />
                </div>
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
              <NumberInput
                label="Rounds"
                value={settings.rounds}
                onChange={(val) => setSettings({...settings, rounds: val})}
                min={1}
                max={10}
              />
              <NumberInput
                label="Round Time (seconds)"
                value={settings.roundTime}
                onChange={(val) => setSettings({...settings, roundTime: val})}
                min={30}
                max={180}
                hint="Min: 30s, Max: 180s (3 min)"
              />
              <CustomDropdown
                label="Difficulty"
                value={settings.difficulty}
                onChange={(value) => setSettings({...settings, difficulty: value})}
                options={Object.entries(DIFFICULTY_CONFIG).map(([key, config]) => ({
                  value: key,
                  label: `${config.label} ${config.points ? `(${config.points} pts)` : '(All)'}`
                }))}
              />
              <ToggleSwitch
                label="Team Mode"
                badge="Beta"
                checked={settings.teamMode}
                onChange={(checked) => setSettings({...settings, teamMode: checked})}
                helperText="Players will be split into teams"
              />
            </div>
          )}

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="w-full flex items-center justify-center gap-2 bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600 px-4 py-2 rounded-xl transition-all active:scale-[0.98]"
          >
            <Settings className="w-4 h-4" />
            {showSettings ? 'Hide' : 'Show'} Settings
          </button>

          <button
            onClick={handleCreate}
            className="w-full bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700 px-6 py-3 rounded-xl font-bold transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-cyan-500/20"
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
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            <span>© 2026 S.S.G</span>
            <span className="text-slate-600">|</span>
            <button
              onClick={() => setShowFeedback(true)}
              className="text-slate-400 hover:text-cyan-400 transition-colors"
            >
              Feedback
            </button>
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

      {/* Feedback Modal */}
      <FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} />

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
            <div className="relative bg-slate-800 border border-slate-600 rounded-2xl p-6 shadow-2xl min-w-[280px]">
              <h3 className="text-lg font-semibold text-center mb-4 text-slate-200">Choose your avatar</h3>

              {/* Popular picks */}
              <div className="mb-3">
                <p className="text-xs text-cyan-400 font-medium mb-2 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Popular
                </p>
                <div className="grid grid-cols-6 gap-2">
                  {PLAYER_EMOJIS.slice(0, 6).map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => { setPlayerEmoji(emoji); setShowEmojiPicker(false); }}
                      className={`w-11 h-11 text-2xl rounded-xl transition-all hover:bg-slate-700 hover:scale-110 flex items-center justify-center ${
                        playerEmoji === emoji ? 'bg-cyan-500/30 border-2 border-cyan-400 scale-110' : 'bg-slate-700/50'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* More options */}
              <div>
                <p className="text-xs text-slate-400 font-medium mb-2">More</p>
                <div className="grid grid-cols-5 gap-2">
                  {PLAYER_EMOJIS.slice(6).map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => { setPlayerEmoji(emoji); setShowEmojiPicker(false); }}
                      className={`w-11 h-11 text-2xl rounded-xl transition-all hover:bg-slate-700 hover:scale-110 flex items-center justify-center ${
                        playerEmoji === emoji ? 'bg-cyan-500/30 border-2 border-cyan-400 scale-110' : 'bg-slate-700/50'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="card-rich backdrop-blur-md rounded-2xl p-6 border border-slate-700 space-y-4">
          <div>
            <div className="flex gap-2">
              {/* Emoji Picker Button */}
              <button
                onClick={() => setShowEmojiPicker(true)}
                className="relative w-12 h-12 text-2xl bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-cyan-500/50 rounded-xl hover:border-cyan-400 hover:scale-110 hover:shadow-lg hover:shadow-cyan-500/20 transition-all flex items-center justify-center group"
                title="Click to choose avatar"
              >
                {playerEmoji}
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-cyan-500 rounded-full flex items-center justify-center shadow-md group-hover:bg-cyan-400 transition-colors">
                  <Pencil className="w-3 h-3 text-slate-900" />
                </div>
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
                <div className={`bg-slate-800/50 rounded-lg px-3 py-2 flex items-center gap-2 ${
                    (gamePreview.players?.length || 0) >= (gamePreview.settings?.teamMode ? MAX_PLAYERS_TEAM : MAX_PLAYERS_FFA) ? 'border border-red-500/50' : ''
                  }`}>
                  <Users className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-400">Players:</span>
                  <span className={`font-medium ${
                    (gamePreview.players?.length || 0) >= (gamePreview.settings?.teamMode ? MAX_PLAYERS_TEAM : MAX_PLAYERS_FFA) ? 'text-red-400' : 'text-white'
                  }`}>
                    {gamePreview.players?.length || 0}/{gamePreview.settings?.teamMode ? MAX_PLAYERS_TEAM : MAX_PLAYERS_FFA}
                  </span>
                  {(gamePreview.players?.length || 0) >= (gamePreview.settings?.teamMode ? MAX_PLAYERS_TEAM : MAX_PLAYERS_FFA) && (
                    <span className="text-xs text-red-400">(Full)</span>
                  )}
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
            disabled={!gamePreview || !playerName.trim() || nameError || (gamePreview?.players?.length >= (gamePreview?.settings?.teamMode ? MAX_PLAYERS_TEAM : MAX_PLAYERS_FFA))}
            className={`w-full px-6 py-3 rounded-xl font-bold transition-all transform shadow-lg flex items-center justify-center gap-2 ${
              gamePreview && playerName.trim() && (gamePreview?.players?.length < (gamePreview?.settings?.teamMode ? MAX_PLAYERS_TEAM : MAX_PLAYERS_FFA))
                ? 'bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700 hover:scale-105 shadow-cyan-500/20'
                : 'bg-slate-700 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Play className="w-5 h-5" />
            {(gamePreview?.players?.length >= (gamePreview?.settings?.teamMode ? MAX_PLAYERS_TEAM : MAX_PLAYERS_FFA))
              ? 'Game Full'
              : (gamePreview?.status === 'playing' ? 'Join In Progress' : 'Join Game')}
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

function LobbyScreen({ gameState, gameId, isHost, playerId, copyGameLink, startGame, leaveGame, switchTeam, isPlayerConnected }) {
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
            className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 px-4 py-2 rounded-xl transition-all active:scale-95"
          >
            <LogOut className="w-4 h-4" />
            Leave
          </button>
        </div>

        <div className="card-rich backdrop-blur-md rounded-2xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xl font-bold text-cyan-300">Game Code: {gameId}</span>
            <button
              onClick={copyGameLink}
              className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 px-4 py-2 rounded-xl transition-all active:scale-95"
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
                Team 1 ({team1.length}/{MAX_PLAYERS_PER_TEAM})
              </h3>
              <div className="space-y-2">
                {team1.map(player => (
                  <div key={player.id} className="bg-slate-800/50 px-4 py-2 rounded-lg flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{player.emoji || '😀'}</span>
                      {player.id === gameState.host && <Crown className="w-4 h-4 text-amber-400" />}
                      <span>{player.name}</span>
                    </div>
                    {(player.id === playerId || isHost) && (
                      <button
                        onClick={() => switchTeam(player.id)}
                        className="p-1 hover:bg-rose-500/30 rounded transition-colors"
                        title="Switch to Team 2"
                      >
                        <ArrowRightLeft className="w-4 h-4 text-rose-400" />
                      </button>
                    )}
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
                Team 2 ({team2.length}/{MAX_PLAYERS_PER_TEAM})
              </h3>
              <div className="space-y-2">
                {team2.map(player => (
                  <div key={player.id} className="bg-slate-800/50 px-4 py-2 rounded-lg flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{player.emoji || '😀'}</span>
                      {player.id === gameState.host && <Crown className="w-4 h-4 text-amber-400" />}
                      <span>{player.name}</span>
                    </div>
                    {(player.id === playerId || isHost) && (
                      <button
                        onClick={() => switchTeam(player.id)}
                        className="p-1 hover:bg-cyan-500/30 rounded transition-colors"
                        title="Switch to Team 1"
                      >
                        <ArrowRightLeft className="w-4 h-4 text-cyan-400" />
                      </button>
                    )}
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
          <div className="card-rich backdrop-blur-md rounded-2xl p-6 border border-slate-700">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-cyan-300">
              <Users className="w-5 h-5" />
              Players ({gameState.players.length}/{MAX_PLAYERS_FFA})
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
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 px-6 py-4 rounded-xl font-bold text-xl transition-all transform hover:scale-105 active:scale-95 shadow-lg flex items-center justify-center gap-2"
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

function GameMenu({ gameState, playerId, isHost, logoutPlayer, copyGameLink, kickPlayer, promoteDescriber, transferHost, switchTeam, availableDescribers = [], isPlayerConnected }) {
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
        <div className="fixed sm:absolute inset-x-4 sm:inset-x-auto sm:right-0 top-16 sm:top-full sm:mt-2 w-auto sm:w-64 bg-slate-800 border border-slate-600 rounded-xl shadow-xl z-50 overflow-hidden max-h-[80vh] overflow-y-auto custom-scrollbar">
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
              <div className="bg-slate-900/50 max-h-56 overflow-y-auto overflow-x-hidden custom-scrollbar">
                {gameState?.players?.map(player => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between px-3 py-2 hover:bg-slate-700/30 gap-2"
                  >
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <span className="text-sm flex-shrink-0">{player.emoji || '😀'}</span>
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isPlayerConnected(player) ? 'bg-emerald-400' : 'bg-red-400'}`} />
                      {player.id === gameState.host && <Crown className="w-3 h-3 text-amber-400 flex-shrink-0" />}
                      {gameState.settings.teamMode && player.team && (
                        <span className={`text-[10px] font-bold px-1 py-0.5 rounded flex-shrink-0 ${player.team === 1 ? 'bg-cyan-500/30 text-cyan-300' : 'bg-rose-500/30 text-rose-300'}`}>
                          T{player.team}
                        </span>
                      )}
                      <span className={`text-sm truncate ${!isPlayerConnected(player) ? 'text-slate-500' : ''}`}>
                        {player.name}{player.id === playerId && ' (You)'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className="text-xs text-amber-400 mr-1">{player.score}</span>
                      {player.id === gameState.currentDescriber && (
                        <Mic className="w-3 h-3 text-cyan-400" title="Current describer" />
                      )}
                      {isHost && player.id !== playerId && availableDescribers.some(p => p.id === player.id) && (
                        <button
                          onClick={(e) => { e.stopPropagation(); promoteDescriber(player.id); }}
                          className="p-1 hover:bg-cyan-500/30 rounded transition-colors"
                          title="Make describer"
                        >
                          <MicVocal className="w-3.5 h-3.5 text-cyan-400" />
                        </button>
                      )}
                      {isHost && player.id !== playerId && (
                        <button
                          onClick={(e) => { e.stopPropagation(); transferHost(player.id); }}
                          className="p-1 hover:bg-amber-500/30 rounded transition-colors"
                          title="Transfer host"
                        >
                          <Crown className="w-3.5 h-3.5 text-amber-400" />
                        </button>
                      )}
                      {isHost && player.id !== playerId && (
                        <button
                          onClick={(e) => { e.stopPropagation(); kickPlayer(player.id); }}
                          className="p-1 hover:bg-red-500/30 rounded transition-colors"
                          title="Kick player"
                        >
                          <UserX className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      )}
                      {gameState.settings.teamMode && (player.id === playerId || isHost) && player.id !== gameState.currentDescriber && (
                        <button
                          onClick={(e) => { e.stopPropagation(); switchTeam(player.id); }}
                          className={`p-1 rounded transition-colors ${player.team === 1 ? 'hover:bg-rose-500/30' : 'hover:bg-cyan-500/30'}`}
                          title={`Switch to Team ${player.team === 1 ? '2' : '1'}`}
                        >
                          <ArrowRightLeft className={`w-3.5 h-3.5 ${player.team === 1 ? 'text-rose-400' : 'text-cyan-400'}`} />
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

function GameScreen({ gameState, playerId, isDescriber, timeRemaining, breakTimeRemaining, restartCountdownRemaining, guessInput, setGuessInput, submitGuess, isHost, startNextRound, startCountdown, skipTurn, leaveGame, logoutPlayer, restartGame, copyGameLink, kickPlayer, promoteDescriber, transferHost, switchTeam, bonusWordsNotification, isPlayerConnected }) {
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
      isPlayerConnected={isPlayerConnected}
    />;
  }

  const player = gameState.players.find(p => p.id === playerId);
  const describer = gameState.players.find(p => p.id === gameState.currentDescriber);
  const isDescriberOffline = describer && !isPlayerConnected(describer);
  const onlinePlayers = gameState.players.filter(p => isPlayerConnected(p));
  // In team mode, only players from the current playing team can be made describer
  const availableDescribers = onlinePlayers.filter(p =>
    p.id !== gameState.currentDescriber &&
    (!gameState.settings.teamMode || p.team === gameState.currentPlayingTeam)
  );

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

  // Show 3-2-1 countdown overlay before round starts
  if (startCountdown !== null && !gameState.roundStartTime) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-zinc-900 text-white p-4 flex items-center justify-center">
        <div className="text-center space-y-8">
          {/* Animated countdown circle */}
          <div className="relative inline-flex items-center justify-center">
            <div className="w-48 h-48 rounded-full bg-gradient-to-br from-cyan-500/20 to-teal-600/20 border-4 border-cyan-500/50 flex items-center justify-center animate-pulse">
              <span className="text-8xl font-bold text-cyan-400">
                {startCountdown === 0 ? 'GO!' : startCountdown}
              </span>
            </div>
          </div>

          {/* Message */}
          <div>
            <h1 className="text-3xl font-bold text-white">
              {isDescriber ? 'Get ready to describe!' : 'Get ready to guess!'}
            </h1>
            <p className="text-slate-400 mt-2">
              {isDescriber ? 'Your word will appear shortly...' : `${describer?.name} is about to describe`}
            </p>
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
            switchTeam={switchTeam}
            availableDescribers={availableDescribers}
            isPlayerConnected={isPlayerConnected}
          />
        </div>

        <div className="max-w-4xl mx-auto space-y-5 py-6">

          {/* Header - Round Complete */}
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-cyan-300 to-teal-300 bg-clip-text text-transparent">
              {gameState.isLastRoundBreak ? 'Final Round Complete!' :
                isTeamMode
                  ? (currentPlayingTeam === 1
                      ? `Round ${gameState.currentRound} Complete!`
                      : `Team 1's Turn Complete!`)
                  : `Round ${gameState.currentRound} Complete!`}
            </h1>
            {isTeamMode && !gameState.isLastRoundBreak && (
              <p className="text-slate-400 text-sm mt-1">
                {currentPlayingTeam === 1
                  ? `Team 1 starts round ${gameState.currentRound + 1}`
                  : `Team 2 plays to complete round ${gameState.currentRound}`}
              </p>
            )}
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
                        disabled={startCountdown !== null}
                        className={`flex-1 sm:flex-none px-5 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 ${
                          startCountdown !== null
                            ? 'bg-slate-600 cursor-not-allowed'
                            : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 transform hover:scale-105 active:scale-95'
                        }`}
                      >
                        <Play className="w-5 h-5" />
                        {startCountdown !== null ? `Starting in ${startCountdown}...` : 'Start Round'}
                      </button>
                      <button
                        onClick={skipTurn}
                        disabled={startCountdown !== null}
                        className={`px-4 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 ${
                          startCountdown !== null
                            ? 'bg-slate-600 cursor-not-allowed'
                            : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 transform hover:scale-105 active:scale-95'
                        }`}
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
                  {/* Host controls - always show during break */}
                  {isHost && availableDescribers.length > 0 && gameState.players.length >= 2 && (
                    <div className="bg-slate-700/30 border border-slate-600 rounded-xl p-3">
                      <span className="text-xs text-slate-400 block mb-2">Change describer:</span>
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
                  {isHost && availableDescribers.length === 0 && gameState.players.length >= 2 && (
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

          {/* Player Submissions - Compact chips layout matching active screen */}
          {(gameState.submissions || []).length > 0 && (
            <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-md rounded-2xl p-5 border border-slate-500/30">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Users className="w-6 h-6 text-teal-400" />
                Player Submissions
              </h2>
              <div className="space-y-3">
                {Object.values(submissionsByPlayer).map((playerData, idx) => {
                  const totalPoints = playerData.submissions.reduce((sum, s) => sum + (s.isCorrect ? s.points : 0), 0);
                  return (
                    <div key={idx} className="bg-slate-700/30 border border-slate-600/30 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-semibold text-cyan-300">{playerData.playerName}</span>
                        <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">+{totalPoints} pts</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {playerData.submissions.map((sub, subIdx) => (
                          <span
                            key={subIdx}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 ${
                              sub.isCorrect
                                ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                                : sub.isDuplicate
                                  ? 'bg-slate-500/20 text-slate-400 border border-slate-500/30 italic'
                                  : 'bg-red-500/20 text-red-300/70 border border-red-500/30 line-through'
                            }`}
                          >
                            {sub.word}
                            {sub.isCorrect && <span className="text-amber-400 text-xs">+{sub.points}</span>}
                          </span>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-zinc-900 text-white p-4 relative">
      {/* Bonus words notification */}
      {bonusWordsNotification && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none px-4 w-full max-w-md">
          <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white px-5 py-3 md:px-6 md:py-3 rounded-xl shadow-2xl animate-[bounce_0.5s_ease-in-out_3] relative">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-400 rounded-xl blur-xl opacity-60 animate-pulse"></div>

            {/* Content */}
            <div className="relative flex items-center justify-center gap-2">
              <div className="flex items-center gap-1 text-xl md:text-2xl">
                <span className="animate-[spin_1s_ease-in-out]">🔥</span>
                <span className="animate-[spin_1s_ease-in-out_0.2s]">⚡</span>
              </div>
              <div className="text-center">
                <div className="text-base md:text-xl font-black tracking-tight">+4 BONUS WORDS!</div>
              </div>
              <div className="flex items-center gap-1 text-xl md:text-2xl">
                <span className="animate-[spin_1s_ease-in-out_0.4s]">✨</span>
                <span className="animate-[spin_1s_ease-in-out_0.6s]">🔥</span>
              </div>
            </div>
          </div>
        </div>
      )}
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
            switchTeam={switchTeam}
            availableDescribers={availableDescribers}
            isPlayerConnected={isPlayerConnected}
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
            <div className="card-rich backdrop-blur-md rounded-2xl p-6 border border-slate-700">
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
                  className="bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700 px-6 py-3 rounded-xl font-bold transition-all active:scale-95"
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

          {(gameState.submissions || []).length > 0 && (() => {
            // Group submissions by player
            const submissionsByPlayer = (gameState.submissions || []).reduce((acc, sub) => {
              if (!acc[sub.playerId]) {
                acc[sub.playerId] = { playerName: sub.playerName, words: [] };
              }
              acc[sub.playerId].words.push(sub);
              return acc;
            }, {});

            const mySubmissions = submissionsByPlayer[playerId];
            const otherPlayers = Object.entries(submissionsByPlayer).filter(([id]) => id !== playerId);

            return (
              <div className="card-rich backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-slate-700">
                <h3 className="text-lg font-bold mb-3 sm:mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-400" />
                  Submitted Words This Round
                </h3>
                <div className="space-y-3 max-h-56 overflow-y-auto custom-scrollbar">
                  {/* Your guesses first */}
                  {mySubmissions && (
                    <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-3">
                      <div className="text-xs text-cyan-400 font-semibold mb-2">Your Guesses</div>
                      <div className="flex flex-wrap gap-2">
                        {mySubmissions.words.map((sub, idx) => (
                          <span
                            key={idx}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 ${
                              sub.isCorrect
                                ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                                : sub.isDuplicate
                                  ? 'bg-slate-500/20 text-slate-400 border border-slate-500/30 italic'
                                  : 'bg-red-500/20 text-red-300/70 border border-red-500/30 line-through'
                            }`}
                          >
                            {sub.word}
                            {sub.isCorrect && <span className="text-amber-400 text-xs">+{sub.points}</span>}
                            {sub.isDuplicate && <span className="text-slate-500 text-xs">✓</span>}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Other players */}
                  {otherPlayers.map(([id, data]) => (
                    <div key={id} className="bg-slate-700/30 border border-slate-600/30 rounded-xl p-3">
                      <div className="text-xs text-slate-400 font-semibold mb-2">{data.playerName}</div>
                      <div className="flex flex-wrap gap-2">
                        {data.words.map((sub, idx) => (
                          <span
                            key={idx}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 ${
                              sub.isCorrect
                                ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                                : sub.isDuplicate
                                  ? 'bg-slate-500/20 text-slate-400 border border-slate-500/30 italic'
                                  : 'bg-red-500/20 text-red-300/70 border border-red-500/30 line-through'
                            }`}
                          >
                            {sub.word}
                            {sub.isCorrect && <span className="text-amber-400 text-xs">+{sub.points}</span>}
                            {sub.isDuplicate && <span className="text-slate-500 text-xs">✓</span>}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
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

function ResultsScreen({ gameState, playerId, isHost, leaveGame, restartGame, logoutPlayer, copyGameLink, kickPlayer, transferHost, isPlayerConnected }) {
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
  const connectedPlayers = gameState.players.filter(p => isPlayerConnected(p));
  const canRestart = connectedPlayers.length >= 2;
  // Use allSubmissions for final stats (includes all rounds), fallback to submissions for compatibility
  const submissions = gameState.allSubmissions || gameState.submissions || [];

  // Calculate game statistics
  const gameDuration = gameState.createdAt ? Math.floor((Date.now() - gameState.createdAt) / 1000 / 60) : 0;
  const totalWordsGuessed = submissions.filter(s => s.isCorrect).length;

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

  const bestStreakData = calculateBestStreak();

  // Calculate accuracy per player (excludes duplicate guesses)
  const getPlayerAccuracy = (playerId) => {
    // Filter out duplicates - they don't count toward accuracy
    const playerSubs = submissions.filter(s => s.playerId === playerId && !s.isDuplicate);
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
          switchTeam={() => {}} // Not needed in results screen
          availableDescribers={[]} // Not needed in results screen
          isPlayerConnected={isPlayerConnected}
        />
      </div>

      <div className="max-w-4xl w-full space-y-6 relative z-10">
        {/* Winner Announcement - Big and Bold */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-400 bg-clip-text text-transparent">
            Game Over!
          </h1>
          {isTeamMode ? (
            <p className="text-xl md:text-2xl text-slate-300">
              {winningTeam === 0 ? "It's a tie!" : `Team ${winningTeam} wins!`}
            </p>
          ) : (
            <div className="flex items-center justify-center gap-3">
              <p className="text-xl md:text-2xl text-slate-300">
                <span className="text-amber-400 font-bold">{winner?.name}</span> wins!
              </p>
            </div>
          )}
        </div>

        {/* Compact Game Statistics - Single Row */}
        <div className="flex justify-center gap-6 text-center text-sm">
          <div>
            <span className="text-slate-400">Duration</span>
            <p className="text-lg font-bold text-white">{gameDuration} min</p>
          </div>
          <div className="border-l border-slate-700 pl-6">
            <span className="text-slate-400">Words</span>
            <p className="text-lg font-bold text-emerald-400">{totalWordsGuessed}</p>
          </div>
          <div className="border-l border-slate-700 pl-6">
            <span className="text-slate-400">Best Streak</span>
            <p className="text-lg font-bold text-purple-400">{bestStreakData.streak}</p>
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

        {/* Podium for top 3 (non-team mode) - Real podium layout */}
        {!isTeamMode && sortedPlayers.length >= 3 && (
          <div className="relative flex items-end justify-center gap-1 h-56 mt-4">
            {/* Winner spotlight glow effect */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 pointer-events-none">
              <div
                className="w-56 h-56 rounded-full blur-3xl animate-spotlight opacity-70"
                style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.5) 0%, rgba(245,158,11,0.3) 40%, transparent 70%)' }}
              />
              <div
                className="absolute top-8 left-8 w-40 h-40 rounded-full blur-2xl"
                style={{ background: 'radial-gradient(circle, rgba(252,211,77,0.4) 0%, transparent 60%)' }}
              />
            </div>

            {/* 2nd Place - Left */}
            <div className="flex flex-col items-center z-10">
              <div className="relative mb-2">
                <PlayerAvatar name={sortedPlayers[1]?.name || ''} emoji={sortedPlayers[1]?.emoji} size="md" />
              </div>
              <p className="text-xs font-semibold text-slate-300 truncate max-w-[70px] mb-1">{sortedPlayers[1]?.name}</p>
              <div className="bg-gradient-to-b from-slate-300 to-slate-500 rounded-t-lg w-20 md:w-24 h-20 flex flex-col items-center justify-center shadow-lg">
                <span className="text-2xl font-bold text-slate-800">2</span>
                <p className="text-lg font-bold text-slate-800"><AnimatedScore value={sortedPlayers[1]?.score || 0} /></p>
              </div>
            </div>

            {/* 1st Place - Center (Tallest) */}
            <div className="flex flex-col items-center z-20 -mx-2">
              <div className="relative mb-2">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-3xl animate-bounce">👑</div>
                <div className="ring-4 ring-amber-400 ring-offset-2 ring-offset-slate-900 rounded-full">
                  <PlayerAvatar name={sortedPlayers[0]?.name || ''} emoji={sortedPlayers[0]?.emoji} size="lg" highlight />
                </div>
              </div>
              <p className="text-sm font-bold text-amber-400 truncate max-w-[80px] mb-1">{sortedPlayers[0]?.name}</p>
              <div className="bg-gradient-to-b from-amber-400 to-amber-600 rounded-t-lg w-24 md:w-28 h-28 flex flex-col items-center justify-center shadow-lg shadow-amber-500/30">
                <span className="text-3xl font-bold text-amber-900">1</span>
                <p className="text-2xl font-bold text-amber-900"><AnimatedScore value={sortedPlayers[0]?.score || 0} /></p>
              </div>
            </div>

            {/* 3rd Place - Right */}
            <div className="flex flex-col items-center z-10">
              <div className="relative mb-2">
                <PlayerAvatar name={sortedPlayers[2]?.name || ''} emoji={sortedPlayers[2]?.emoji} size="md" />
              </div>
              <p className="text-xs font-semibold text-slate-300 truncate max-w-[70px] mb-1">{sortedPlayers[2]?.name}</p>
              <div className="bg-gradient-to-b from-orange-400 to-orange-700 rounded-t-lg w-20 md:w-24 h-16 flex flex-col items-center justify-center shadow-lg">
                <span className="text-xl font-bold text-orange-900">3</span>
                <p className="text-base font-bold text-orange-900"><AnimatedScore value={sortedPlayers[2]?.score || 0} /></p>
              </div>
            </div>
          </div>
        )}

        {/* Full Leaderboard - All Players */}
        <div className="card-rich backdrop-blur-md rounded-2xl p-4 border border-slate-700/50">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2 text-slate-300">
            <Users className="w-4 h-4 text-cyan-400" />
            {isTeamMode ? 'Individual Contributions' : 'Final Standings'}
          </h2>
          <div className="space-y-1.5">
            {sortedPlayers.map((player, idx) => {
              const accuracy = getPlayerAccuracy(player.id);
              const playerTitle = getPlayerTitle(player, sortedPlayers, submissions, idx === 0 && !isTeamMode);
              const isCurrentPlayer = player.id === playerId;

              return (
                <div
                  key={player.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all relative ${
                    !isTeamMode && idx === 0 ? 'bg-amber-500/15 border border-amber-500/30' :
                    !isTeamMode && idx === 1 ? 'bg-slate-400/10 border border-slate-500/20' :
                    !isTeamMode && idx === 2 ? 'bg-orange-600/15 border border-orange-600/20' :
                    isTeamMode && player.team === 1 ? 'bg-cyan-500/10 border border-cyan-500/20' :
                    isTeamMode && player.team === 2 ? 'bg-rose-500/10 border border-rose-500/20' :
                    'bg-slate-700/20 border border-slate-700/30'
                  } ${isCurrentPlayer ? 'ring-2 ring-cyan-400/60 ring-offset-1 ring-offset-slate-900 shadow-lg shadow-cyan-500/20' : ''}`}
                >
                  {/* "You" indicator */}
                  {isCurrentPlayer && (
                    <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-cyan-400 rounded-full" />
                  )}
                  {/* Rank */}
                  {!isTeamMode && (
                    <span className="text-sm font-bold w-6 text-center text-slate-400">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`}
                    </span>
                  )}

                  {/* Team Badge */}
                  {isTeamMode && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${player.team === 1 ? 'bg-cyan-500/30 text-cyan-300' : 'bg-rose-500/30 text-rose-300'}`}>
                      T{player.team}
                    </span>
                  )}

                  {/* Avatar */}
                  <PlayerAvatar name={player.name} emoji={player.emoji} size="sm" />

                  {/* Name and Title */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{player.name}</p>
                    <p className={`text-[10px] ${playerTitle.color}`}>{playerTitle.icon} {playerTitle.title}</p>
                  </div>

                  {/* Accuracy & Score */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-emerald-400">{accuracy}%</span>
                    <span className="text-lg font-bold text-amber-400 w-12 text-right">
                      <AnimatedScore value={player.score} duration={800 + idx * 100} />
                    </span>
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
              <div className="card-rich backdrop-blur-md rounded-2xl p-6 border border-slate-700 space-y-4">
                <h3 className="text-xl font-bold mb-2">Game Settings</h3>
                <NumberInput
                  label="Rounds"
                  value={newSettings.rounds}
                  onChange={(val) => setNewSettings({...newSettings, rounds: val})}
                  min={1}
                  max={10}
                />
                <NumberInput
                  label="Round Time (seconds)"
                  value={newSettings.roundTime}
                  onChange={(val) => setNewSettings({...newSettings, roundTime: val})}
                  min={30}
                  max={180}
                  hint="Min: 30s, Max: 180s (3 min)"
                />
                <CustomDropdown
                  label="Difficulty"
                  value={newSettings.difficulty}
                  onChange={(value) => setNewSettings({...newSettings, difficulty: value})}
                  options={Object.entries(DIFFICULTY_CONFIG).map(([key, config]) => ({
                    value: key,
                    label: `${config.label} ${config.points ? `(${config.points} pts)` : '(All)'}`
                  }))}
                />
              </div>
            )}

            <button
              onClick={() => setShowSettings(!showSettings)}
              className="w-full bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600 px-6 py-3 rounded-xl font-bold transition-all active:scale-[0.98]"
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
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 transform hover:scale-105 active:scale-95'
                    : 'bg-slate-600 cursor-not-allowed opacity-50'
                }`}
              >
                <Play className="w-5 h-5" />
                Play Again
              </button>

              <button
                onClick={leaveGame}
                className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 px-6 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 active:scale-95"
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
  const isLeavingGame = useRef(false);
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Compute bonus notification visibility from game state
  const bonusWordsNotification = gameState?.bonusWordsNotificationEnd && currentTime < gameState.bonusWordsNotificationEnd;

  // Helper: Compute if a player is connected based on their lastSeen timestamp
  // This avoids race conditions from storing connected status in Firebase
  const DISCONNECT_THRESHOLD = 65000; // 65 seconds
  const isPlayerConnected = (player) => {
    if (!player || !player.lastSeen) return false;
    return (currentTime - player.lastSeen) < DISCONNECT_THRESHOLD;
  };

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

          // Check if current player was kicked (but not if they left voluntarily)
          const currentPlayerId = window.localStorage.getItem('taboo_player_id');
          const playerStillInGame = newState.players.some(p => p.id === currentPlayerId);

          if (!playerStillInGame && currentPlayerId && !isLeavingGame.current) {
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
    // 65 seconds threshold to account for browser throttling background tabs
    // (browsers may throttle setInterval to once per minute in background tabs)
    const DISCONNECT_THRESHOLD = 65000;

    const sendHeartbeat = async () => {
      try {
        const result = await window.storage.get(`game:${gameId}`, true);
        if (!result) return;

        const game = JSON.parse(result.value);
        const now = Date.now();

        // Only update current player's lastSeen to avoid race conditions
        // Don't recalculate other players' status here (UI will compute from lastSeen)

        // Auto-transfer host if current host has been disconnected for 120 seconds
        const HOST_DISCONNECT_THRESHOLD = 120000;
        let newHost = game.host;
        const currentHost = game.players.find(p => p.id === game.host);

        if (currentHost && currentHost.lastSeen && (now - currentHost.lastSeen) > HOST_DISCONNECT_THRESHOLD) {
          // Find a connected player to transfer host to
          const newHostPlayer = game.players.find(p =>
            p.id !== game.host && p.lastSeen && (now - p.lastSeen) < DISCONNECT_THRESHOLD
          );
          if (newHostPlayer && newHostPlayer.id !== game.host) {
            newHost = newHostPlayer.id;
          }
        }

        // Only update if this player's data changed or host transfer needed
        const existingPlayer = game.players.find(p => p.id === playerId);
        const playerDataChanged = !existingPlayer || existingPlayer.lastSeen !== now;
        const hostChanged = newHost !== game.host;

        if (playerDataChanged || hostChanged) {
          // Re-read to minimize race condition window
          const freshResult = await window.storage.get(`game:${gameId}`, true);
          if (freshResult) {
            const freshGame = JSON.parse(freshResult.value);

            // Only update our own player's lastSeen (don't recalculate others)
            const mergedPlayers = freshGame.players.map(p => {
              if (p.id === playerId) {
                return { ...p, lastSeen: now };
              }
              return p;
            });

            // Only transfer host if still needed after re-read
            let finalHost = freshGame.host;
            if (hostChanged) {
              const freshHost = freshGame.players.find(p => p.id === freshGame.host);
              if (freshHost && freshHost.lastSeen && (now - freshHost.lastSeen) > HOST_DISCONNECT_THRESHOLD) {
                const newHostPlayer = freshGame.players.find(p =>
                  p.id !== freshGame.host && p.lastSeen && (now - p.lastSeen) < DISCONNECT_THRESHOLD
                );
                if (newHostPlayer && newHostPlayer.id !== freshGame.host) {
                  finalHost = newHostPlayer.id;
                }
              }
            }

            await window.storage.set(`game:${gameId}`, JSON.stringify({ ...freshGame, players: mergedPlayers, host: finalHost }), true);
          }
        }
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
      submissions: [], // Track current round submissions
      allSubmissions: [], // Track all submissions across rounds for accuracy
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
        // Check player limits
        const maxPlayers = game.settings.teamMode ? MAX_PLAYERS_TEAM : MAX_PLAYERS_FFA;
        if (game.players.length >= maxPlayers) {
          alert(`Game is full! Maximum ${maxPlayers} players allowed.`);
          return;
        }

        // In team mode, also check per-team limit
        if (game.settings.teamMode) {
          const team1Count = game.players.filter(p => p.team === 1).length;
          const team2Count = game.players.filter(p => p.team === 2).length;
          const assignToTeam = team1Count <= team2Count ? 1 : 2;
          const targetTeamCount = assignToTeam === 1 ? team1Count : team2Count;

          if (targetTeamCount >= MAX_PLAYERS_PER_TEAM) {
            alert(`Both teams are full! Maximum ${MAX_PLAYERS_PER_TEAM} players per team.`);
            return;
          }
        }

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

      // If updates include players, preserve their fresh lastSeen and connected status
      // to avoid race conditions with the heartbeat system
      let finalUpdates = updates;
      if (updates.players && game.players) {
        finalUpdates = {
          ...updates,
          players: updates.players.map(updatedPlayer => {
            const freshPlayer = game.players.find(p => p.id === updatedPlayer.id);
            // Preserve heartbeat data (lastSeen, connected) from database, keep everything else from update
            return {
              ...updatedPlayer,
              lastSeen: freshPlayer?.lastSeen || updatedPlayer.lastSeen
            };
          })
        };
      }

      const updatedGame = { ...game, ...finalUpdates };
      await window.storage.set(`game:${gameId}`, JSON.stringify(updatedGame), true);
      setGameState(updatedGame);
    } catch (err) {
      console.error('Error updating game:', err);
    }
  };

  const startGame = async () => {
    if (!gameState) return;

    // Generate random words for the first round (16 words initially, can grow to 32)
    const wordPool = getWordsForDifficulty(gameState.settings.difficulty, 300);
    const shuffled = [...wordPool].sort(() => Math.random() - 0.5);
    const words = shuffled.slice(0, 16);

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

    // Set up game with countdown (3 seconds) - roundStartTime will be set after countdown
    await updateGame({
      status: 'playing',
      currentRound: 1,
      words,
      roundStartTime: null, // Will be set after countdown
      roundStartCountdownEnd: Date.now() + 3000, // 3 second countdown
      roundEndTime: null,
      breakEndTime: null,
      guesses: [],
      submissions: [],
      allSubmissions: [], // Initialize for accuracy tracking
      currentDescriber: firstDescriber,
      currentPlayingTeam,
      teamDescriberIndex
    });
    setScreen('game');
  };

  // Start the actual round after initial countdown (for first round only)
  const startInitialRound = async () => {
    if (!gameState) return;
    await updateGame({
      roundStartTime: Date.now(),
      roundStartCountdownEnd: null
    });
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
      isDuplicate: alreadyGuessed, // Mark as duplicate (won't count toward accuracy)
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

      // Check if we should add bonus words (80% guessed, max 32 words)
      const guessedPercent = newGuesses.length / gameState.words.length;
      const shouldAddBonusWords = guessedPercent >= 0.8 && gameState.words.length < 32;

      if (shouldAddBonusWords) {
        // Get 4 more unique words from the same difficulty pool
        const existingWords = new Set(gameState.words.map(w => w.word.toLowerCase()));
        const wordPool = getWordsForDifficulty(gameState.settings.difficulty, 300);
        const availableWords = wordPool.filter(w => !existingWords.has(w.word.toLowerCase()));
        const shuffled = [...availableWords].sort(() => Math.random() - 0.5);
        const bonusWords = shuffled.slice(0, 4);

        if (bonusWords.length > 0) {
          const updatedWords = [...gameState.words, ...bonusWords];
          await updateGame({
            players: updatedPlayers,
            guesses: newGuesses,
            submissions: newSubmissions,
            words: updatedWords,
            bonusWordsNotificationEnd: Date.now() + 3000 // Show notification for 3 seconds to all players
          });
        } else {
          await updateGame({
            players: updatedPlayers,
            guesses: newGuesses,
            submissions: newSubmissions
          });
        }
      } else {
        await updateGame({
          players: updatedPlayers,
          guesses: newGuesses,
          submissions: newSubmissions
        });
      }
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

    // Accumulate this round's submissions into allSubmissions
    const updatedAllSubmissions = [
      ...(gameState.allSubmissions || []),
      ...(gameState.submissions || [])
    ];

    await updateGame({
      roundEndTime: Date.now(),
      breakEndTime: Date.now() + (isLastRound ? 20000 : 10000), // 20 seconds for final summary, 10 for normal breaks
      currentDescriber: nextDescriber,
      currentPlayingTeam: nextPlayingTeam,
      teamDescriberIndex,
      roundStartTime: null,
      isLastRoundBreak: isLastRound, // Flag to indicate this is the final round break
      allSubmissions: updatedAllSubmissions // Accumulate submissions at end of each round
    });
  };

  // Initiate the 3-second countdown before starting round (synced to Firebase)
  const initiateStartCountdown = async () => {
    if (!gameState) return;
    if (gameState.roundStartCountdownEnd) return; // Already counting down
    await updateGame({
      roundStartCountdownEnd: Date.now() + 3000 // 3 second countdown
    });
  };

  const startNextRound = async () => {
    if (!gameState) return;

    // Generate new random words for this round (16 words initially, can grow to 32)
    const wordPool = getWordsForDifficulty(gameState.settings.difficulty, 300);
    const shuffled = [...wordPool].sort(() => Math.random() - 0.5);
    const words = shuffled.slice(0, 16);

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
      roundStartCountdownEnd: null, // Clear the countdown
      guesses: [],
      submissions: [] // Clear for next round display (allSubmissions already accumulated in endRound)
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
    // Mark that we're leaving voluntarily to prevent "removed by host" alert
    isLeavingGame.current = true;

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

    // Mark that we're leaving voluntarily to prevent "removed by host" alert
    isLeavingGame.current = true;

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
    const connectedPlayers = gameState.players.filter(p => isPlayerConnected(p));
    if (connectedPlayers.length < 2) {
      alert('Cannot restart game! You need at least 2 connected players to play. Please wait for more players to join.');
      return;
    }

    try {
      // Reset all player scores
      const resetPlayers = gameState.players.map(p => ({ ...p, score: 0 }));

      // Select new words for the first round (16 words initially, can grow to 32)
      const wordPool = getWordsForDifficulty(newSettings.difficulty, 300);
      const shuffled = [...wordPool].sort(() => Math.random() - 0.5);
      const words = shuffled.slice(0, 16);

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
        allSubmissions: [], // Reset all submissions for new game
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

  const switchTeam = async (targetPlayerId) => {
    if (!gameState || !gameState.settings.teamMode) return;

    // Allow in lobby OR during break periods (not mid-round)
    const isInLobby = gameState.status === 'waiting';
    const isDuringBreak = gameState.breakEndTime && !gameState.roundStartTime;
    const isBeforeFirstRound = gameState.status === 'playing' && !gameState.roundStartTime;

    if (!isInLobby && !isDuringBreak && !isBeforeFirstRound) {
      alert('Cannot switch teams during an active round. Wait for the break period.');
      return;
    }

    // Cannot switch the current describer
    if (targetPlayerId === gameState.currentDescriber) {
      alert('Cannot switch the current describer\'s team.');
      return;
    }

    const targetPlayer = gameState.players.find(p => p.id === targetPlayerId);
    if (!targetPlayer) return;

    const newTeam = targetPlayer.team === 1 ? 2 : 1;
    const updatedPlayers = gameState.players.map(p =>
      p.id === targetPlayerId ? { ...p, team: newTeam } : p
    );

    try {
      await updateGame({ players: updatedPlayers });
    } catch (err) {
      console.error('Switch team error:', err);
      alert('Failed to switch team: ' + err.message);
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

  const startCountdownRemaining = gameState?.roundStartCountdownEnd
    ? Math.max(0, Math.floor((gameState.roundStartCountdownEnd - currentTime) / 1000))
    : null;

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

  // Handle round start countdown completion - describer triggers the round start
  useEffect(() => {
    if (gameState?.roundStartCountdownEnd && startCountdownRemaining === 0 && isDescriber && !gameState.roundStartTime) {
      // Check if this is the initial round start (roundEndTime is null = never ended a round before)
      // vs subsequent round (after break, roundEndTime has a value)
      if (gameState.roundEndTime === null) {
        // Initial game start - words already set by startGame, just start the timer
        startInitialRound();
      } else {
        // Subsequent round - need to generate new words
        startNextRound();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startCountdownRemaining, gameState?.roundStartCountdownEnd, isDescriber, gameState?.roundStartTime]);

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
      playerId={playerId}
      copyGameLink={copyGameLink}
      startGame={startGame}
      leaveGame={leaveGame}
      switchTeam={switchTeam}
      isPlayerConnected={isPlayerConnected}
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
      startNextRound={initiateStartCountdown}
      startCountdown={startCountdownRemaining}
      skipTurn={skipTurn}
      leaveGame={leaveGame}
      logoutPlayer={logoutPlayer}
      restartGame={restartGame}
      copyGameLink={copyGameLink}
      kickPlayer={kickPlayer}
      promoteDescriber={promoteDescriber}
      transferHost={transferHost}
      switchTeam={switchTeam}
      bonusWordsNotification={bonusWordsNotification}
      isPlayerConnected={isPlayerConnected}
    />;
  }

  return null;
}

export { App };
export default App;
        