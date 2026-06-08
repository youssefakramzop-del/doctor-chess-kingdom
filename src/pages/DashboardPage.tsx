import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { supabase, type Game } from '../lib/supabase';
import { getEloTitle } from '../lib/elo';
import { BarChart3, Swords, Trophy, Target, TrendingUp, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [recentGames, setRecentGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchRecentGames();
  }, [user]);

  const fetchRecentGames = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('games')
      .select('*')
      .or(`white_player_id.eq.${user.id},black_player_id.eq.${user.id}`)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(10);
    if (data) setRecentGames(data);
    setLoading(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center">
          <p style={{ color: 'var(--text-secondary)' }}>Please log in to view your dashboard</p>
          <Link to="/login" className="btn-primary inline-block mt-4 no-underline">Log In</Link>
        </div>
      </div>
    );
  }

  const title = getEloTitle(user.elo_rapid);
  const winRate = user.games_played > 0 ? Math.round((user.games_won / user.games_played) * 100) : 0;

  const stats = [
    { icon: Swords, label: 'Games Played', value: user.games_played, color: 'var(--accent-blue)' },
    { icon: Trophy, label: 'Wins', value: user.games_won, color: 'var(--accent-green)' },
    { icon: Target, label: 'Losses', value: user.games_lost, color: 'var(--accent-red)' },
    { icon: TrendingUp, label: 'Win Rate', value: `${winRate}%`, color: 'var(--accent-orange)' },
  ];

  const eloStats = [
    { mode: 'Rapid', elo: user.elo_rapid },
    { mode: 'Blitz', elo: user.elo_blitz },
    { mode: 'Bullet', elo: user.elo_bullet },
  ];

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-4xl mx-auto">
        {/* Profile header */}
        <div className="card p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white" style={{ background: title.color }}>
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{user.username}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ background: `${title.color}20`, color: title.color }}>{title.title}</span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Member since {new Date(user.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {stats.map((stat) => (
            <div key={stat.label} className="card p-4">
              <stat.icon className="w-5 h-5 mb-2" style={{ color: stat.color }} />
              <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{stat.value}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* ELO ratings */}
        <div className="card p-5 mb-6">
          <h3 className="text-sm font-semibold uppercase mb-4" style={{ color: 'var(--text-muted)' }}>ELO Ratings</h3>
          <div className="grid grid-cols-3 gap-4">
            {eloStats.map((stat) => {
              const t = getEloTitle(stat.elo);
              return (
                <div key={stat.mode} className="text-center">
                  <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{stat.mode}</div>
                  <div className="text-2xl font-bold font-mono" style={{ color: 'var(--accent-orange)' }}>{stat.elo}</div>
                  <div className="text-[10px]" style={{ color: t.color }}>{t.title}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent games */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold uppercase mb-4" style={{ color: 'var(--text-muted)' }}>Recent Games</h3>
          {loading ? (
            <div className="py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Loading...</div>
          ) : recentGames.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>No games played yet</p>
              <Link to="/play" className="btn-primary inline-flex items-center gap-2 no-underline text-sm">
                <Swords className="w-4 h-4" /> Play Your First Game
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentGames.map((game) => {
                const isWhite = game.white_player_id === user.id;
                const won = (isWhite && game.result === 'white_wins') || (!isWhite && game.result === 'black_wins');
                const drew = game.result === 'draw';
                return (
                  <div key={game.id} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${won ? 'text-white' : drew ? 'text-white' : 'text-white'}`}
                        style={{ background: won ? 'var(--accent-green)' : drew ? 'var(--accent-yellow)' : 'var(--accent-red)' }}>
                        {won ? 'W' : drew ? 'D' : 'L'}
                      </span>
                      <div>
                        <div className="text-xs font-medium capitalize" style={{ color: 'var(--text-primary)' }}>{game.game_mode}</div>
                        <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{game.result_reason?.replace(/_/g, ' ')}</div>
                      </div>
                    </div>
                    <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      {new Date(game.created_at).toLocaleDateString()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
