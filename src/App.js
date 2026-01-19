import React, { useState, useEffect } from 'react';
import { Timer, Users, Trophy, Play, Copy, Crown, Zap, Star, Settings, LogOut } from 'lucide-react';
import { firebaseStorage } from './firebase';

// Use Firebase storage
window.storage = firebaseStorage;

const WORD_LISTS = {
  easy: [
    { word: "DOG", points: 1 }, { word: "CAR", points: 1 }, { word: "BOOK", points: 1 },
    { word: "PHONE", points: 1 }, { word: "TREE", points: 1 }, { word: "CHAIR", points: 1 },
    { word: "WATER", points: 1 }, { word: "HOUSE", points: 1 }, { word: "DOOR", points: 1 },
    { word: "SHOE", points: 1 }, { word: "APPLE", points: 1 }, { word: "CLOCK", points: 1 }
  ],
  medium: [
    { word: "MICROSCOPE", points: 3 }, { word: "ORCHESTRA", points: 3 }, { word: "ARCHITECTURE", points: 3 },
    { word: "PHOTOSYNTHESIS", points: 3 }, { word: "CONSTELLATION", points: 3 }, { word: "DEMOCRACY", points: 3 },
    { word: "VELOCITY", points: 3 }, { word: "ECOSYSTEM", points: 3 }, { word: "METAPHOR", points: 3 },
    { word: "GRAVITY", points: 3 }, { word: "RENEWABLE", points: 3 }, { word: "TELESCOPE", points: 3 }
  ],
  hard: [
    { word: "CRYPTOCURRENCY", points: 5 }, { word: "PROCRASTINATION", points: 5 }, { word: "ENTREPRENEUR", points: 5 },
    { word: "ALGORITHM", points: 5 }, { word: "SYNCHRONICITY", points: 5 }, { word: "METAMORPHOSIS", points: 5 },
    { word: "JUXTAPOSITION", points: 5 }, { word: "SERENDIPITY", points: 5 }, { word: "ONOMATOPOEIA", points: 5 },
    { word: "AMBIGUOUS", points: 5 }, { word: "QUINTESSENTIAL", points: 5 }, { word: "PARADIGM", points: 5 }
  ]
};

function HomeScreen({ playerName, setPlayerName, setScreen, createGame }) {
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    rounds: 3,
    roundTime: 60,
    difficulty: 'mixed',
    teamMode: false
  });

  const handleCreate = () => {
    if (!playerName.trim()) {
      alert('Please enter your name');
      return;
    }
    createGame(settings);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Zap className="w-12 h-12" />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
            Taboo Online
          </h1>
          <p className="text-purple-200">Multiplayer word guessing game</p>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 space-y-4">
          <input
            type="text"
            placeholder="Enter your name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-pink-500"
          />

          {showSettings && (
            <div className="space-y-4 pt-4 border-t border-white/20">
              <div>
                <label className="block text-sm text-purple-200 mb-2">Rounds</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={settings.rounds}
                  onChange={(e) => setSettings({...settings, rounds: parseInt(e.target.value)})}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-purple-200 mb-2">Round Time (seconds)</label>
                <input
                  type="number"
                  min="30"
                  max="180"
                  value={settings.roundTime}
                  onChange={(e) => setSettings({...settings, roundTime: parseInt(e.target.value)})}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-purple-200 mb-2">Difficulty</label>
                <select
                  value={settings.difficulty}
                  onChange={(e) => setSettings({...settings, difficulty: e.target.value})}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white"
                >
                  <option value="easy">Easy (1 pt)</option>
                  <option value="medium">Medium (3 pts)</option>
                  <option value="hard">Hard (5 pts)</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="teamMode"
                  checked={settings.teamMode}
                  onChange={(e) => setSettings({...settings, teamMode: e.target.checked})}
                  className="w-5 h-5"
                />
                <label htmlFor="teamMode" className="text-purple-200">Team Mode</label>
              </div>
            </div>
          )}

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/20 px-4 py-2 rounded-xl transition-colors"
          >
            <Settings className="w-4 h-4" />
            {showSettings ? 'Hide' : 'Show'} Settings
          </button>

          <button
            onClick={handleCreate}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 px-6 py-3 rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg"
          >
            Create Game
          </button>

          <button
            onClick={() => setScreen('join')}
            className="w-full bg-white/10 hover:bg-white/20 border border-white/20 px-6 py-3 rounded-xl font-bold transition-all"
          >
            Join Game
          </button>
        </div>
      </div>
    </div>
  );
}

function JoinScreen({ gameId, setGameId, playerName, setPlayerName, joinGame, setScreen }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <h2 className="text-4xl font-bold mb-2">Join Game</h2>
          <p className="text-purple-200">Enter game code to join</p>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 space-y-4">
          <input
            type="text"
            placeholder="Your name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-pink-500"
          />

          <input
            type="text"
            placeholder="Game Code"
            value={gameId}
            onChange={(e) => setGameId(e.target.value.toUpperCase())}
            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-pink-500 uppercase"
          />

          <button
            onClick={joinGame}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 px-6 py-3 rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg"
          >
            Join Game
          </button>

          <button
            onClick={() => setScreen('home')}
            className="w-full bg-white/10 hover:bg-white/20 border border-white/20 px-6 py-3 rounded-xl font-bold transition-all"
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white p-4">
      <div className="max-w-4xl mx-auto space-y-6 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-4xl font-bold">Game Lobby</h2>
            <p className="text-purple-200 mt-1">Waiting for players...</p>
          </div>
          <button
            onClick={leaveGame}
            className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 px-4 py-2 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Leave
          </button>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xl font-bold">Game Code: {gameId}</span>
            <button
              onClick={copyGameLink}
              className="flex items-center gap-2 bg-pink-500 hover:bg-pink-600 px-4 py-2 rounded-xl transition-colors"
            >
              <Copy className="w-4 h-4" />
              Copy Link
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <h3 className="text-sm text-purple-200 mb-2">Settings</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-white/5 px-3 py-2 rounded-lg">Rounds: {gameState.settings.rounds}</div>
                <div className="bg-white/5 px-3 py-2 rounded-lg">Time: {gameState.settings.roundTime}s</div>
                <div className="bg-white/5 px-3 py-2 rounded-lg">Difficulty: {gameState.settings.difficulty}</div>
                <div className="bg-white/5 px-3 py-2 rounded-lg">Mode: {gameState.settings.teamMode ? 'Teams' : 'FFA'}</div>
              </div>
            </div>
          </div>
        </div>

        {gameState.settings.teamMode ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-500/20 backdrop-blur-md rounded-2xl p-6 border border-blue-500/30">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Team 1
              </h3>
              <div className="space-y-2">
                {team1.map(player => (
                  <div key={player.id} className="bg-white/10 px-4 py-2 rounded-lg flex items-center gap-2">
                    {player.id === gameState.host && <Crown className="w-4 h-4 text-yellow-400" />}
                    {player.name}
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-red-500/20 backdrop-blur-md rounded-2xl p-6 border border-red-500/30">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Team 2
              </h3>
              <div className="space-y-2">
                {team2.map(player => (
                  <div key={player.id} className="bg-white/10 px-4 py-2 rounded-lg flex items-center gap-2">
                    {player.id === gameState.host && <Crown className="w-4 h-4 text-yellow-400" />}
                    {player.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Players ({gameState.players.length})
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {gameState.players.map(player => (
                <div key={player.id} className="bg-white/10 px-4 py-2 rounded-lg flex items-center gap-2">
                  {player.id === gameState.host && <Crown className="w-4 h-4 text-yellow-400" />}
                  {player.name}
                </div>
              ))}
            </div>
          </div>
        )}

        {isHost && gameState.players.length >= 2 && (
          <button
            onClick={startGame}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 px-6 py-4 rounded-xl font-bold text-xl transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
          >
            <Play className="w-6 h-6" />
            Start Game
          </button>
        )}

        {isHost && gameState.players.length < 2 && (
          <div className="text-center text-purple-200">
            Waiting for at least 2 players to start...
          </div>
        )}

        {!isHost && (
          <div className="text-center text-purple-200">
            Waiting for host to start the game...
          </div>
        )}
      </div>
    </div>
  );
}

function GameScreen({ gameState, playerId, isDescriber, timeRemaining, breakTimeRemaining, guessInput, setGuessInput, submitGuess, isHost, startNextRound, leaveGame, logoutPlayer, restartGame }) {
  if (!gameState || gameState.status === 'finished') {
    return <ResultsScreen gameState={gameState} isHost={isHost} leaveGame={leaveGame} restartGame={restartGame} />;
  }

  const player = gameState.players.find(p => p.id === playerId);
  const describer = gameState.players.find(p => p.id === gameState.currentDescriber);

  // Check if we're in break period
  const isBreak = gameState.breakEndTime && !gameState.roundStartTime;

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
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white flex items-center justify-center p-4">
        <div className="max-w-4xl w-full space-y-6">
          <div className="text-center space-y-6">
            <div className="w-24 h-24 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto">
              <Timer className="w-12 h-12 animate-pulse" />
            </div>
            <h1 className="text-5xl font-bold">Round Complete!</h1>

            {/* Scoreboard */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <h2 className="text-2xl font-bold mb-4 flex items-center justify-center gap-2">
                <Trophy className="w-6 h-6 text-yellow-400" />
                Current Standings
              </h2>
              <div className="space-y-2">
                {[...gameState.players].sort((a, b) => b.score - a.score).map((p, idx) => (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between px-4 py-3 rounded-lg ${
                      idx === 0 ? 'bg-yellow-500/20 border border-yellow-500/50' :
                      idx === 1 ? 'bg-gray-400/20 border border-gray-400/50' :
                      idx === 2 ? 'bg-orange-700/20 border border-orange-700/50' :
                      'bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-purple-300">#{idx + 1}</span>
                      <span className="font-semibold">{p.name}</span>
                    </div>
                    <span className="text-xl font-bold text-yellow-400">{p.score}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Round Summary - All Submissions */}
            {(gameState.submissions || []).length > 0 && (
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <h2 className="text-2xl font-bold mb-4">Round Summary</h2>
                <div className="space-y-4">
                  {Object.values(submissionsByPlayer).map((playerData, idx) => (
                    <div key={idx} className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <h3 className="text-lg font-bold mb-3 text-purple-200">{playerData.playerName}</h3>
                      <div className="flex flex-wrap gap-2">
                        {playerData.submissions.map((sub, subIdx) => (
                          <div
                            key={subIdx}
                            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                              sub.isCorrect
                                ? 'bg-green-500/30 border-2 border-green-400 text-green-200'
                                : 'bg-red-500/20 border border-red-400/40 text-red-300/70'
                            }`}
                          >
                            {sub.word}
                            {sub.isCorrect && (
                              <span className="ml-1 text-yellow-300">+{sub.points}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 space-y-4">
              <p className="text-2xl text-purple-200">Next Round Starts In</p>
              <div className="text-6xl font-bold text-yellow-400">{breakTimeRemaining}s</div>
              <div className="pt-4 border-t border-white/20">
                <p className="text-xl text-purple-200 mb-2">Next Describer:</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-pink-300 to-purple-300 bg-clip-text text-transparent">
                  {describer?.name}
                </p>
              </div>
              {isDescriber && breakTimeRemaining <= 0 && (
                <button
                  onClick={startNextRound}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 px-6 py-4 rounded-xl font-bold text-xl transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                >
                  <Play className="w-6 h-6" />
                  Start Round {gameState.currentRound + 1}
                </button>
              )}
              {(!isDescriber || breakTimeRemaining > 0) && (
                <div className="text-purple-200">
                  {isDescriber ? 'Get ready to describe!' : `Waiting for ${describer?.name} to start...`}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white p-4">
      <div className="max-w-6xl mx-auto space-y-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl ${timeRemaining <= 10 ? 'bg-red-500/20 border border-red-500/50' : ''}`}>
              <Timer className={`w-5 h-5 ${timeRemaining <= 10 ? 'animate-pulse' : ''}`} />
              <span className="text-2xl font-bold">{timeRemaining}s</span>
            </div>
            <div className="bg-white/10 px-4 py-2 rounded-xl">
              Round {gameState.currentRound}/{gameState.settings.rounds}
            </div>
          </div>
          <button
            onClick={logoutPlayer}
            className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 px-4 py-2 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-4">
            <div className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/30">
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-2 text-purple-200">
                  <Crown className="w-5 h-5" />
                  <span>Describer: {describer?.name}</span>
                </div>
                
                {isDescriber ? (
                  <div className="space-y-4">
                    <p className="text-lg text-purple-200">Describe any word to your team!</p>
                    <div className="grid grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                      {gameState.words.map((wordObj, idx) => {
                        const isGuessed = gameState.guesses.some(g => g.word === wordObj.word);
                        return (
                          <div
                            key={idx}
                            className={`p-4 rounded-xl border-2 transition-all ${
                              isGuessed
                                ? 'bg-green-500/20 border-green-500/50 opacity-50'
                                : 'bg-white/10 border-white/20 hover:border-pink-500/50'
                            }`}
                          >
                            <div className="text-center">
                              <h3 className="text-xl font-bold bg-gradient-to-r from-pink-300 to-purple-300 bg-clip-text text-transparent">
                                {wordObj.word}
                              </h3>
                              <div className="flex items-center justify-center gap-1 mt-2">
                                <Star className="w-4 h-4 text-yellow-400" />
                                <span className="text-sm font-bold text-yellow-400">{wordObj.points}pt</span>
                              </div>
                              {isGuessed && (
                                <div className="text-xs text-green-300 mt-1">✓ Guessed</div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-lg text-purple-200">Listen and guess any word!</p>
                    <div className="text-center">
                      <div className="text-sm text-purple-300 mb-2">Words Remaining</div>
                      <div className="text-3xl font-bold text-yellow-400">
                        {gameState.words.length - gameState.guesses.length}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {!isDescriber && (
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <form onSubmit={(e) => { e.preventDefault(); submitGuess(); }} className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Type your guess..."
                    value={guessInput}
                    onChange={(e) => setGuessInput(e.target.value)}
                    className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 px-6 py-3 rounded-xl font-bold transition-all"
                  >
                    Submit
                  </button>
                </form>
              </div>
            )}

            {(gameState.submissions || []).length > 0 && (
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  Submitted Words This Round
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {(gameState.submissions || []).slice().reverse().map((submission, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center justify-between px-4 py-2 rounded-lg border ${
                        submission.isCorrect
                          ? 'bg-green-500/20 border-green-500/30'
                          : 'bg-red-500/10 border-red-500/20'
                      }`}
                    >
                      <span className="font-semibold">{submission.playerName}</span>
                      <div className="flex items-center gap-2">
                        <span className={submission.isCorrect ? 'text-green-300' : 'text-red-300/60'}>
                          {submission.word}
                        </span>
                        {submission.isCorrect && (
                          <span className="text-yellow-400 text-sm">+{submission.points}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
              <div className="text-center">
                <div className="text-sm text-purple-200 mb-1">Your Score</div>
                <div className="text-3xl font-bold text-yellow-400">{player?.score || 0}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultsScreen({ gameState, isHost, leaveGame, restartGame }) {
  const [showSettings, setShowSettings] = useState(false);
  const [newSettings, setNewSettings] = useState(gameState?.settings || { rounds: 3, roundTime: 60, difficulty: 'mixed', teamMode: false });

  if (!gameState) return null;

  const sortedPlayers = [...gameState.players].sort((a, b) => b.score - a.score);
  const winner = sortedPlayers[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center space-y-4">
          <Trophy className="w-24 h-24 text-yellow-400 mx-auto" />
          <h1 className="text-6xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
            Game Over!
          </h1>
          <p className="text-3xl text-purple-200">{winner.name} wins!</p>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
          <h2 className="text-2xl font-bold mb-6 text-center">Final Scores</h2>
          <div className="space-y-3">
            {sortedPlayers.map((player, idx) => (
              <div 
                key={player.id}
                className={`flex items-center justify-between px-6 py-4 rounded-xl ${
                  idx === 0 ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500/50' :
                  idx === 1 ? 'bg-gray-400/20 border border-gray-400/50' :
                  idx === 2 ? 'bg-orange-700/20 border border-orange-700/50' :
                  'bg-white/5 border border-white/10'
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-3xl font-bold">#{idx + 1}</span>
                  <span className="text-xl font-semibold">{player.name}</span>
                </div>
                <span className="text-3xl font-bold text-yellow-400">{player.score}</span>
              </div>
            ))}
          </div>
        </div>

        {isHost ? (
          <div className="space-y-4">
            {showSettings && (
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 space-y-4">
                <h3 className="text-xl font-bold mb-2">Game Settings</h3>
                <div>
                  <label className="block text-sm text-purple-200 mb-2">Rounds</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newSettings.rounds}
                    onChange={(e) => setNewSettings({...newSettings, rounds: parseInt(e.target.value)})}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-purple-200 mb-2">Round Time (seconds)</label>
                  <input
                    type="number"
                    min="30"
                    max="180"
                    value={newSettings.roundTime}
                    onChange={(e) => setNewSettings({...newSettings, roundTime: parseInt(e.target.value)})}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-purple-200 mb-2">Difficulty</label>
                  <select
                    value={newSettings.difficulty}
                    onChange={(e) => setNewSettings({...newSettings, difficulty: e.target.value})}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white"
                  >
                    <option value="easy">Easy (1 pt)</option>
                    <option value="medium">Medium (3 pts)</option>
                    <option value="hard">Hard (5 pts)</option>
                    <option value="mixed">Mixed</option>
                  </select>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowSettings(!showSettings)}
              className="w-full bg-white/10 hover:bg-white/20 border border-white/20 px-6 py-3 rounded-xl font-bold transition-all"
            >
              <Settings className="w-5 h-5 inline mr-2" />
              {showSettings ? 'Hide Settings' : 'Change Settings'}
            </button>

            <button
              onClick={() => restartGame(newSettings)}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 px-6 py-4 rounded-xl font-bold text-xl transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
            >
              <Play className="w-6 h-6" />
              Restart Game
            </button>

            <button
              onClick={leaveGame}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 px-6 py-4 rounded-xl font-bold text-xl transition-all transform hover:scale-105"
            >
              Back to Home
            </button>
          </div>
        ) : (
          <button
            onClick={leaveGame}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 px-6 py-4 rounded-xl font-bold text-xl transition-all transform hover:scale-105"
          >
            Back to Home
          </button>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState('home');
  const [gameId, setGameId] = useState('');
  const [playerName, setPlayerName] = useState('');
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
      setScreen('join');
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

  const generateId = () => Math.random().toString(36).substring(2, 8).toUpperCase();

  const createGame = async (settings) => {
    const newGameId = generateId();
    const newPlayerId = generateId();
    
    const game = {
      id: newGameId,
      host: newPlayerId,
      settings,
      players: [{ id: newPlayerId, name: playerName, score: 0, team: settings.teamMode ? 1 : null }],
      status: 'lobby',
      currentRound: 0,
      currentDescriber: newPlayerId,
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
        console.log('Player reconnecting:', playerName, 'Score:', existingPlayer.score);
      } else {
        const newPlayerId = generateId();
        const teamAssignment = game.settings.teamMode
          ? (game.players.filter(p => p.team === 1).length <= game.players.filter(p => p.team === 2).length ? 1 : 2)
          : null;

        game.players.push({
          id: newPlayerId,
          name: playerName,
          score: 0,
          team: teamAssignment
        });
        setPlayerId(newPlayerId);
        window.localStorage.setItem('taboo_player_id', newPlayerId);
      }

      console.log('Saving updated game with', game.players.length, 'players:', game.players.map(p => p.name));
      await window.storage.set(`game:${gameId}`, JSON.stringify(game), true);

      setGameState(game);

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
    
    const wordPool = [];
    const difficulty = gameState.settings.difficulty;
    
    if (difficulty === 'easy' || difficulty === 'mixed') {
      wordPool.push(...WORD_LISTS.easy);
    }
    if (difficulty === 'medium' || difficulty === 'mixed') {
      wordPool.push(...WORD_LISTS.medium);
    }
    if (difficulty === 'hard' || difficulty === 'mixed') {
      wordPool.push(...WORD_LISTS.hard);
    }

    const shuffled = [...wordPool].sort(() => Math.random() - 0.5);
    const words = shuffled.slice(0, gameState.settings.rounds * 5);

    await updateGame({
      status: 'playing',
      currentRound: 1,
      words,
      roundStartTime: Date.now(),
      roundEndTime: null,
      breakEndTime: null,
      guesses: [],
      submissions: []
    });
    setScreen('game');
  };

  const submitGuess = async () => {
    if (!guessInput.trim() || !gameState) return;

    const guessedWord = guessInput.trim().toLowerCase();
    const player = gameState.players.find(p => p.id === playerId);

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

    if (gameState.currentRound >= gameState.settings.rounds) {
      await updateGame({ status: 'finished' });
      return;
    }

    // Start 10-second break
    const nextDescriberIndex = (gameState.players.findIndex(p => p.id === gameState.currentDescriber) + 1) % gameState.players.length;
    const nextDescriber = gameState.players[nextDescriberIndex].id;

    await updateGame({
      roundEndTime: Date.now(),
      breakEndTime: Date.now() + 10000, // 10 second break
      currentDescriber: nextDescriber,
      roundStartTime: null
    });
  };

  const startNextRound = async () => {
    if (!gameState) return;

    await updateGame({
      currentRound: gameState.currentRound + 1,
      roundStartTime: Date.now(),
      roundEndTime: null,
      breakEndTime: null,
      guesses: [],
      submissions: []
    });
  };

  const leaveGame = () => {
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

      // Update the game state
      await updateGame({
        players: updatedPlayers,
        host: newHostId
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

    // Check if there are at least 2 players
    if (gameState.players.length < 2) {
      alert('Cannot restart game! You need at least 2 players to play. Please wait for more players to join.');
      return;
    }

    try {
      // Reset all player scores
      const resetPlayers = gameState.players.map(p => ({ ...p, score: 0 }));

      // Select new words based on settings
      const wordPool = [];
      const difficulty = newSettings.difficulty;

      if (difficulty === 'easy' || difficulty === 'mixed') {
        wordPool.push(...WORD_LISTS.easy);
      }
      if (difficulty === 'medium' || difficulty === 'mixed') {
        wordPool.push(...WORD_LISTS.medium);
      }
      if (difficulty === 'hard' || difficulty === 'mixed') {
        wordPool.push(...WORD_LISTS.hard);
      }

      const shuffled = [...wordPool].sort(() => Math.random() - 0.5);
      const words = shuffled.slice(0, newSettings.rounds * 5);

      await updateGame({
        players: resetPlayers,
        settings: newSettings,
        status: 'playing',
        currentRound: 1,
        words,
        roundStartTime: Date.now(),
        roundEndTime: null,
        breakEndTime: null,
        guesses: [],
        submissions: []
      });

      console.log('Game restarted with new settings');
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

  const isHost = gameState?.host === playerId;
  const isDescriber = gameState?.currentDescriber === playerId;

  const timeRemaining = gameState?.roundStartTime
    ? Math.max(0, gameState.settings.roundTime - Math.floor((currentTime - gameState.roundStartTime) / 1000))
    : 0;

  const breakTimeRemaining = gameState?.breakEndTime
    ? Math.max(0, Math.floor((gameState.breakEndTime - currentTime) / 1000))
    : 0;

  useEffect(() => {
    if (gameState?.status === 'playing' && gameState.roundStartTime && timeRemaining === 0 && isHost) {
      endRound();
    }
  }, [timeRemaining, gameState?.status, gameState?.roundStartTime, isHost, endRound]);

  if (screen === 'home') {
    return <HomeScreen 
      playerName={playerName}
      setPlayerName={setPlayerName}
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
      guessInput={guessInput}
      setGuessInput={setGuessInput}
      submitGuess={submitGuess}
      isHost={isHost}
      startNextRound={startNextRound}
      leaveGame={leaveGame}
      logoutPlayer={logoutPlayer}
      restartGame={restartGame}
    />;
  }

  return null;
}
        