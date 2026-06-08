import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Swords, Bot, Clock, Zap, Timer, Coffee, ChevronRight, Play, Palette, Music } from 'lucide-react';
import { useGameStore, type TimeControlConfig } from '../store/useGameStore';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { BOARD_THEMES, PIECE_THEMES } from '../lib/themes';

type PlayMode = 'online' | 'ai' | 'friend';

const TIME_CONTROLS: { mode: 'bullet' | 'blitz' | 'rapid'; config: TimeControlConfig; icon: typeof Zap; label: string }[] = [
  { mode: 'bullet', config: { time: 60, increment: 1 }, icon: Zap, label: '1+1' },
  { mode: 'bullet', config: { time: 120, increment: 1 }, icon: Zap, label: '2+1' },
  { mode: 'blitz', config: { time: 180, increment: 2 }, icon: Timer, label: '3+2' },
  { mode: 'blitz', config: { time: 300, increment: 3 }, icon: Clock, label: '5+3' },
  { mode: 'rapid', config: { time: 600, increment: 5 }, icon: Coffee, label: '10+5' },
  { mode: 'rapid', config: { time: 900, increment: 10 }, icon: Coffee, label: '15+10' },
  { mode: 'rapid', config: { time: 1800, increment: 0 }, icon: Coffee, label: '30+0' },
];

type AIDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'master';
const AI_LEVELS: { level: AIDifficulty; label: string; elo: string; desc: string }[] = [
  { level: 'beginner', label: 'Beginner', elo: '800-1000', desc: 'Learning the basics' },
  { level: 'intermediate', label: 'Intermediate', elo: '1200-1500', desc: 'Knows the fundamentals' },
  { level: 'advanced', label: 'Advanced', elo: '1600-1900', desc: 'Strong tactical player' },
  { level: 'master', label: 'Master', elo: '2000+', desc: 'Near-perfect play' },
];

export default function PlayPage() {
  const [mode, setMode] = useState<PlayMode>('ai');
  const [selectedTime, setSelectedTime] = useState<number>(4); // default 10+5 rapid
  const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty>('intermediate');
  const [playerColor, setPlayerColor] = useState<'white' | 'black' | 'random'>('white');
  const [showThemes, setShowThemes] = useState(false);
  const { newGame } = useGameStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { boardTheme, pieceTheme, setBoardTheme, setPieceTheme } = useThemeStore();

  const startGame = async () => {
    const tc = TIME_CONTROLS[selectedTime];
    if (mode === 'ai') {
      const color = playerColor === 'random' ? (Math.random() > 0.5 ? 'white' : 'black') : playerColor;
      await newGame('ai', tc.config, aiDifficulty, color);
    } else {
      await newGame(tc.mode, tc.config);
    }
    navigate('/game');
  };

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Play Chess</h1>
        <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>Choose your game mode and start playing</p>

        {/* Mode selection */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { key: 'online' as PlayMode, icon: Swords, label: 'Play Online', desc: 'vs Players', available: !!user },
            { key: 'ai' as PlayMode, icon: Bot, label: 'Play AI', desc: 'vs Computer', available: true },
            { key: 'friend' as PlayMode, icon: Swords, label: 'With Friend', desc: 'Share Link', available: !!user },
          ].map((m) => (
            <button
              key={m.key}
              onClick={() => m.available && setMode(m.key)}
              className="card p-4 text-center transition-all"
              style={{
                borderColor: mode === m.key ? 'var(--accent-green)' : 'var(--border-color)',
                borderWidth: '2px',
                opacity: m.available ? 1 : 0.5,
              }}
            >
              <m.icon className="w-6 h-6 mx-auto mb-2" style={{ color: mode === m.key ? 'var(--accent-green)' : 'var(--text-muted)' }} />
              <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{m.label}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{m.desc}</div>
              {!m.available && <div className="text-[10px] mt-1" style={{ color: 'var(--accent-orange)' }}>Login required</div>}
            </button>
          ))}
        </div>

        {/* Time control */}
        <div className="card p-5 mb-6">
          <h3 className="text-sm font-semibold uppercase mb-3" style={{ color: 'var(--text-muted)' }}>Time Control</h3>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {TIME_CONTROLS.map((tc, i) => (
              <button
                key={i}
                onClick={() => setSelectedTime(i)}
                className="p-3 rounded-lg text-center transition-all"
                style={{
                  background: selectedTime === i ? 'rgba(76, 175, 80, 0.15)' : 'var(--bg-tertiary)',
                  border: `2px solid ${selectedTime === i ? 'var(--accent-green)' : 'transparent'}`,
                }}
              >
                <tc.icon className="w-4 h-4 mx-auto mb-1" style={{ color: selectedTime === i ? 'var(--accent-green)' : 'var(--text-muted)' }} />
                <div className="text-sm font-bold" style={{ color: selectedTime === i ? 'var(--accent-green)' : 'var(--text-primary)' }}>{tc.label}</div>
                <div className="text-[10px] capitalize" style={{ color: 'var(--text-muted)' }}>{tc.mode}</div>
              </button>
            ))}
          </div>
        </div>

        {/* AI Settings */}
        {mode === 'ai' && (
          <div className="card p-5 mb-6">
            <h3 className="text-sm font-semibold uppercase mb-3" style={{ color: 'var(--text-muted)' }}>AI Difficulty</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {AI_LEVELS.map((level) => (
                <button
                  key={level.level}
                  onClick={() => setAiDifficulty(level.level)}
                  className="p-3 rounded-lg text-center transition-all"
                  style={{
                    background: aiDifficulty === level.level ? 'rgba(76, 175, 80, 0.15)' : 'var(--bg-tertiary)',
                    border: `2px solid ${aiDifficulty === level.level ? 'var(--accent-green)' : 'transparent'}`,
                  }}
                >
                  <div className="text-sm font-bold mb-0.5" style={{ color: aiDifficulty === level.level ? 'var(--accent-green)' : 'var(--text-primary)' }}>
                    {level.label}
                  </div>
                  <div className="text-[10px]" style={{ color: 'var(--accent-orange)' }}>{level.elo}</div>
                  <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{level.desc}</div>
                </button>
              ))}
            </div>

            {/* Color selection */}
            <h3 className="text-sm font-semibold uppercase mt-5 mb-3" style={{ color: 'var(--text-muted)' }}>Play As</h3>
            <div className="flex gap-2">
              {(['white', 'black', 'random'] as const).map((color) => (
                <button
                  key={color}
                  onClick={() => setPlayerColor(color)}
                  className="flex-1 p-2.5 rounded-lg text-center text-sm font-medium transition-all"
                  style={{
                    background: playerColor === color ? 'rgba(76, 175, 80, 0.15)' : 'var(--bg-tertiary)',
                    border: `2px solid ${playerColor === color ? 'var(--accent-green)' : 'transparent'}`,
                    color: playerColor === color ? 'var(--accent-green)' : 'var(--text-secondary)',
                  }}
                >
                  {color === 'white' ? 'White' : color === 'black' ? 'Black' : 'Random'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Theme customization */}
        <div className="card p-5 mb-6">
          <button
            onClick={() => setShowThemes(!showThemes)}
            className="flex items-center justify-between w-full"
          >
            <span className="flex items-center gap-2 text-sm font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>
              <Palette className="w-4 h-4" /> Board & Pieces Theme
            </span>
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {boardTheme.name} / {pieceTheme.name}
            </span>
          </button>

          {showThemes && (
            <div className="mt-4 space-y-5">
              {/* Board themes */}
              <div>
                <h4 className="text-xs font-semibold uppercase mb-2" style={{ color: 'var(--text-muted)' }}>Board Theme</h4>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {BOARD_THEMES.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => setBoardTheme(theme)}
                      className="rounded-lg overflow-hidden transition-all"
                      style={{
                        border: `2px solid ${boardTheme.id === theme.id ? 'var(--accent-green)' : 'transparent'}`,
                      }}
                    >
                      <div className="grid grid-cols-2 h-8">
                        <div style={{ background: theme.lightSquare }} />
                        <div style={{ background: theme.darkSquare }} />
                      </div>
                      <div className="text-[8px] py-0.5 px-1 truncate text-center" style={{ color: 'var(--text-muted)', background: 'var(--bg-tertiary)' }}>
                        {theme.name}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Piece themes */}
              <div>
                <h4 className="text-xs font-semibold uppercase mb-2" style={{ color: 'var(--text-muted)' }}>Piece Style</h4>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {PIECE_THEMES.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => setPieceTheme(theme)}
                      className="p-2 rounded-lg text-center transition-all"
                      style={{
                        background: pieceTheme.id === theme.id ? 'rgba(76, 175, 80, 0.15)' : 'var(--bg-tertiary)',
                        border: `2px solid ${pieceTheme.id === theme.id ? 'var(--accent-green)' : 'transparent'}`,
                      }}
                    >
                      <div className="w-6 h-6 mx-auto mb-1" style={{
                        backgroundImage: `url(https://lichess1.org/assets/piece/${theme.prefix}/wK.svg)`,
                        backgroundSize: 'contain',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'center',
                      }} />
                      <div className="text-[8px] truncate" style={{ color: pieceTheme.id === theme.id ? 'var(--accent-green)' : 'var(--text-muted)' }}>
                        {theme.name}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Start button */}
        <button onClick={startGame} className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2">
          <Play className="w-5 h-5" />
          Start Game
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
