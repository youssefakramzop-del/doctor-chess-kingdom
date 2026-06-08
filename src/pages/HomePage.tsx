import { Link } from 'react-router-dom';
import { Swords, Bot, Crown, BarChart3, Zap, Clock, Users, Shield } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export default function HomePage() {
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Hero */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="absolute inset-0 opacity-10" style={{
          background: 'radial-gradient(ellipse at 50% 0%, var(--accent-green) 0%, transparent 70%)',
        }} />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6" style={{ background: 'rgba(76, 175, 80, 0.15)', color: 'var(--accent-green)' }}>
            <span className="w-2 h-2 rounded-full pulse-dot" style={{ background: 'var(--accent-green)' }} />
            {user ? `${user.games_played} players online` : 'Free online chess'}
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
            Play Chess.<br />
            <span style={{ color: 'var(--accent-green)' }}>Get Better.</span>
          </h1>
          <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            Challenge players worldwide, battle AI opponents, track your ELO rating, and analyze your games with Stockfish.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/play" className="btn-primary text-base px-8 py-3 no-underline flex items-center gap-2">
              <Swords className="w-5 h-5" /> Play Now
            </Link>
            {!user && (
              <Link to="/register" className="btn-secondary text-base px-8 py-3 no-underline">
                Create Free Account
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12" style={{ color: 'var(--text-primary)' }}>
            Everything You Need
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Swords, title: 'Play Online', desc: 'Real-time multiplayer chess with players worldwide', color: 'var(--accent-green)' },
              { icon: Bot, title: 'AI Opponent', desc: '4 difficulty levels powered by Stockfish engine', color: 'var(--accent-blue)' },
              { icon: Crown, title: 'ELO Ratings', desc: 'Track your progress with accurate ELO calculations', color: 'var(--accent-orange)' },
              { icon: BarChart3, title: 'Game Analysis', desc: 'Post-game analysis with Stockfish evaluation', color: 'var(--accent-teal)' },
              { icon: Zap, title: 'Bullet & Blitz', desc: 'Multiple time controls for every play style', color: 'var(--accent-red)' },
              { icon: Clock, title: 'Live Timers', desc: 'Precise chess clocks with increment support', color: 'var(--accent-yellow)' },
              { icon: Users, title: 'Leaderboard', desc: 'Global rankings across all game modes', color: 'var(--accent-blue)' },
              { icon: Shield, title: 'Fair Play', desc: 'Anti-cheat detection for competitive integrity', color: 'var(--accent-green)' },
            ].map((feature) => (
              <div key={feature.title} className="card p-5 transition-all hover:scale-[1.02] cursor-default">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: `${feature.color}20` }}>
                  <feature.icon className="w-5 h-5" style={{ color: feature.color }} />
                </div>
                <h3 className="font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>{feature.title}</h3>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto text-center card p-10" style={{ borderColor: 'var(--accent-green)' }}>
          <h2 className="text-2xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Ready to Play?</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
            Join thousands of players and start improving your chess today.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/play" className="btn-primary flex items-center gap-2 no-underline">
              <Swords className="w-4 h-4" /> Start Playing
            </Link>
            <Link to="/leaderboard" className="btn-secondary flex items-center gap-2 no-underline">
              <Crown className="w-4 h-4" /> View Rankings
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: 'var(--accent-green)' }}>
              <Swords className="w-3 h-3 text-white" />
            </div>
            <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>ChessMaster</span>
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Built with chess.js & Stockfish. All games are fair play.
          </div>
        </div>
      </footer>
    </div>
  );
}
