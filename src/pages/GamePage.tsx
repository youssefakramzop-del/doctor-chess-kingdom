import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ChessBoard from '../components/ChessBoard';
import { useGameStore } from '../store/useGameStore';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { Clock, Flag, Handshake, RotateCcw, Send, MessageCircle, ChevronDown, ChevronUp, Swords, Bot, Volume2, VolumeX, Palette } from 'lucide-react';
import { BOARD_THEMES, PIECE_THEMES } from '../lib/themes';

const QUICK_MESSAGES = [
  'Good game!', 'Well played!', 'Thanks!', 'Good luck!',
  'Wow!', 'Interesting move', "Let's play again", 'gg',
];

const BAD_WORDS = ['damn', 'hell', 'stupid', 'idiot', 'noob', 'trash'];
function filterMessage(msg: string): string {
  let filtered = msg;
  BAD_WORDS.forEach(word => {
    filtered = filtered.replace(new RegExp(word, 'gi'), '*'.repeat(word.length));
  });
  return filtered;
}

function formatTime(seconds: number): string {
  if (seconds <= 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const rm = mins % 60;
    return `${hrs}:${rm.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function GamePage() {
  const {
    chess, playerColor, isAIGame, status, result, resultReason,
    whiteTime, blackTime, increment, moveHistory, gameMode, aiDifficulty,
    resign, tickTimer, resetGame, offerDraw, soundEnabled, toggleSound,
  } = useGameStore();
  const { user } = useAuthStore();
  const { boardTheme, pieceTheme, setBoardTheme, setPieceTheme } = useThemeStore();
  const navigate = useNavigate();
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ text: string; sender: string; time: number }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [movesPanelOpen, setMovesPanelOpen] = useState(true);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (status === 'idle') navigate('/play');
  }, [status, navigate]);

  useEffect(() => {
    if (status === 'active') {
      timerRef.current = setInterval(() => { tickTimer(); }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [status, tickTimer]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  const sendChat = (msg: string) => {
    if (!msg.trim()) return;
    setChatMessages(prev => [...prev, { text: filterMessage(msg), sender: 'you', time: Date.now() }]);
    setChatInput('');
  };

  const isWhiteTurn = chess.turn() === 'w';
  const playerTime = playerColor === 'white' ? whiteTime : blackTime;
  const opponentTime = playerColor === 'white' ? blackTime : whiteTime;

  const movePairs = [];
  for (let i = 0; i < moveHistory.length; i += 2) {
    movePairs.push({ number: Math.floor(i / 2) + 1, white: moveHistory[i]?.san || '', black: moveHistory[i + 1]?.san || '' });
  }

  const getResultMessage = () => {
    if (!result) return '';
    if (result === 'white_wins') return 'White wins';
    if (result === 'black_wins') return 'Black wins';
    if (result === 'draw') return 'Draw';
    return '';
  };

  const getResultColor = () => {
    if (!result) return 'var(--text-primary)';
    if (result === 'draw') return 'var(--accent-yellow)';
    const playerWon = (result === 'white_wins' && playerColor === 'white') || (result === 'black_wins' && playerColor === 'black');
    return playerWon ? 'var(--accent-green)' : 'var(--accent-red)';
  };

  const topColor = playerColor === 'white' ? 'black' : 'white';
  const topTime = topColor === 'white' ? whiteTime : blackTime;
  const topIsTurn = (topColor === 'white' && isWhiteTurn) || (topColor === 'black' && !isWhiteTurn);

  return (
    <div className="min-h-screen py-4 px-2 md:px-4" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-4">
          {/* Board section */}
          <div className="flex flex-col gap-2 w-full max-w-[560px]">
            {/* Opponent timer bar */}
            <div className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: isAIGame ? 'var(--accent-blue)' : 'var(--bg-tertiary)' }}>
                  {isAIGame ? <Bot className="w-4 h-4" /> : <Swords className="w-4 h-4" />}
                </div>
                <div>
                  <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {isAIGame ? `Stockfish (${aiDifficulty})` : 'Opponent'}
                  </div>
                </div>
                {topIsTurn && <span className="w-2 h-2 rounded-full pulse-dot" style={{ background: 'var(--accent-green)' }} />}
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-lg font-bold" style={{
                background: topIsTurn ? 'rgba(76, 175, 80, 0.12)' : 'var(--bg-tertiary)',
                color: topTime <= 30 ? 'var(--accent-red)' : 'var(--text-primary)',
              }}>
                <Clock className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                {formatTime(topTime)}
              </div>
            </div>

            {/* Chess board */}
            <ChessBoard />

            {/* Player timer bar */}
            <div className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: 'var(--accent-green)' }}>
                  {user?.username?.charAt(0).toUpperCase() || 'P'}
                </div>
                <div>
                  <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {user?.username || 'You'}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--accent-orange)' }}>
                    {user?.elo_rapid || 1200} ELO
                  </div>
                </div>
                {!topIsTurn && <span className="w-2 h-2 rounded-full pulse-dot" style={{ background: 'var(--accent-green)' }} />}
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-lg font-bold" style={{
                background: !topIsTurn ? 'rgba(76, 175, 80, 0.12)' : 'var(--bg-tertiary)',
                color: playerTime <= 30 ? 'var(--accent-red)' : 'var(--text-primary)',
              }}>
                <Clock className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                {formatTime(playerTime)}
              </div>
            </div>

            {/* Action buttons */}
            {status === 'active' && (
              <div className="flex gap-2 mt-1">
                <button onClick={resign} className="btn-secondary flex-1 flex items-center justify-center gap-2 text-xs py-2">
                  <Flag className="w-3 h-3" /> Resign
                </button>
                <button onClick={offerDraw} className="btn-secondary flex-1 flex items-center justify-center gap-2 text-xs py-2">
                  <Handshake className="w-3 h-3" /> Draw
                </button>
                <button onClick={toggleSound} className="btn-secondary px-3 flex items-center justify-center text-xs py-2">
                  {soundEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
                </button>
              </div>
            )}

            {/* Game over */}
            {status === 'completed' && (
              <div className="card p-5 text-center fade-in mt-1" style={{ borderColor: getResultColor() }}>
                <div className="text-2xl font-bold mb-1" style={{ color: getResultColor() }}>
                  {getResultMessage()}
                </div>
                <div className="text-sm mb-4 capitalize" style={{ color: 'var(--text-secondary)' }}>
                  {resultReason?.replace(/_/g, ' ')}
                </div>
                <div className="flex gap-3 justify-center">
                  <button onClick={() => { resetGame(); navigate('/play'); }} className="btn-primary flex items-center gap-2">
                    <RotateCcw className="w-4 h-4" /> New Game
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Side panel */}
          <div className="w-full lg:w-72 flex flex-col gap-3">
            {/* Game info */}
            <div className="card p-3">
              <div className="text-xs font-semibold uppercase mb-2" style={{ color: 'var(--text-muted)' }}>Game Info</div>
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: 'var(--text-secondary)' }}>Mode</span>
                <span className="font-semibold capitalize" style={{ color: 'var(--text-primary)' }}>{gameMode === 'ai' ? 'vs AI' : gameMode}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span style={{ color: 'var(--text-secondary)' }}>Time</span>
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>+{increment}s</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span style={{ color: 'var(--text-secondary)' }}>Moves</span>
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{moveHistory.length}</span>
              </div>
            </div>

            {/* Theme picker (compact) */}
            <div className="card p-3">
              <button
                onClick={() => setShowThemePicker(!showThemePicker)}
                className="flex items-center justify-between w-full text-xs font-semibold uppercase"
                style={{ color: 'var(--text-muted)' }}
              >
                <span className="flex items-center gap-1"><Palette className="w-3 h-3" /> Theme</span>
                <span className="normal-case">{boardTheme.name}</span>
              </button>
              {showThemePicker && (
                <div className="mt-3 space-y-3">
                  <div className="grid grid-cols-8 gap-1">
                    {BOARD_THEMES.map((t) => (
                      <button key={t.id} onClick={() => setBoardTheme(t)}
                        className="rounded overflow-hidden"
                        style={{ border: `2px solid ${boardTheme.id === t.id ? 'var(--accent-green)' : 'transparent'}` }}>
                        <div className="grid grid-cols-2 h-4">
                          <div style={{ background: t.lightSquare }} />
                          <div style={{ background: t.darkSquare }} />
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-8 gap-1">
                    {PIECE_THEMES.map((t) => (
                      <button key={t.id} onClick={() => setPieceTheme(t)}
                        className="p-1 rounded flex items-center justify-center"
                        style={{
                          background: pieceTheme.id === t.id ? 'rgba(76,175,80,0.15)' : 'var(--bg-tertiary)',
                          border: `2px solid ${pieceTheme.id === t.id ? 'var(--accent-green)' : 'transparent'}`,
                        }}>
                        <div className="w-5 h-5" style={{
                          backgroundImage: `url(https://lichess1.org/assets/piece/${t.prefix}/wK.svg)`,
                          backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center',
                        }} />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Move history */}
            <div className="card p-3">
              <button
                onClick={() => setMovesPanelOpen(!movesPanelOpen)}
                className="flex items-center justify-between w-full text-xs font-semibold uppercase mb-2"
                style={{ color: 'var(--text-muted)' }}
              >
                <span>Moves ({moveHistory.length})</span>
                {movesPanelOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              {movesPanelOpen && (
                <div className="max-h-64 overflow-y-auto space-y-0.5 move-notation text-xs">
                  {movePairs.length === 0 && (
                    <div className="text-center py-4" style={{ color: 'var(--text-muted)' }}>No moves yet</div>
                  )}
                  {movePairs.map((pair) => (
                    <div key={pair.number} className="flex items-center gap-2 py-0.5 px-1 rounded" style={{ color: 'var(--text-secondary)' }}>
                      <span className="w-6 text-right font-mono" style={{ color: 'var(--text-muted)' }}>{pair.number}.</span>
                      <span className="w-16 font-mono" style={{ color: 'var(--text-primary)' }}>{pair.white}</span>
                      <span className="w-16 font-mono" style={{ color: 'var(--text-primary)' }}>{pair.black}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Chat */}
            <div className="card p-3">
              <button
                onClick={() => setChatOpen(!chatOpen)}
                className="flex items-center justify-between w-full text-xs font-semibold uppercase"
                style={{ color: 'var(--text-muted)' }}
              >
                <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> Chat</span>
                {chatOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              {chatOpen && (
                <div className="mt-2">
                  <div className="max-h-32 overflow-y-auto space-y-1 mb-2">
                    {chatMessages.map((msg, i) => (
                      <div key={i} className={`text-xs px-2 py-1 rounded ${msg.sender === 'you' ? 'ml-4' : 'mr-4'}`}
                        style={{
                          background: msg.sender === 'you' ? 'rgba(76, 175, 80, 0.15)' : 'var(--bg-tertiary)',
                          color: 'var(--text-primary)',
                        }}>
                        {msg.text}
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {QUICK_MESSAGES.map((msg) => (
                      <button key={msg} onClick={() => sendChat(msg)}
                        className="px-2 py-0.5 rounded text-[10px] font-medium"
                        style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                        {msg}
                      </button>
                    ))}
                  </div>
                  <form onSubmit={(e) => { e.preventDefault(); sendChat(chatInput); }} className="flex gap-1">
                    <input value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                      className="input-field text-xs py-1.5" placeholder="Type a message..." />
                    <button type="submit" className="p-1.5 rounded-lg" style={{ background: 'var(--accent-green)', color: 'white' }}>
                      <Send className="w-3 h-3" />
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
