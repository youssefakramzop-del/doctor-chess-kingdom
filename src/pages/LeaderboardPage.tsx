import { useEffect, useState } from 'react';
import { supabase, type Profile } from '../lib/supabase';
import { getEloTitle } from '../lib/elo';
import { Crown, TrendingUp, Swords, Clock } from 'lucide-react';

type SortField = 'elo_rapid' | 'elo_blitz' | 'elo_bullet';

export default function LeaderboardPage() {
  const [players, setPlayers] = useState<Profile[]>([]);
  const [sortBy, setSortBy] = useState<SortField>('elo_rapid');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [sortBy]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order(sortBy, { ascending: false })
      .limit(50);
    if (data) setPlayers(data);
    setLoading(false);
  };

  const sortOptions: { field: SortField; label: string; icon: typeof Crown }[] = [
    { field: 'elo_rapid', label: 'Rapid', icon: Clock },
    { field: 'elo_blitz', label: 'Blitz', icon: Swords },
    { field: 'elo_bullet', label: 'Bullet', icon: TrendingUp },
  ];

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <span className="text-lg">🥇</span>;
    if (rank === 2) return <span className="text-lg">🥈</span>;
    if (rank === 3) return <span className="text-lg">🥉</span>;
    return <span className="text-sm font-mono" style={{ color: 'var(--text-muted)' }}>#{rank}</span>;
  };

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Crown className="w-7 h-7" style={{ color: 'var(--accent-orange)' }} />
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Leaderboard</h1>
        </div>

        {/* Sort tabs */}
        <div className="flex gap-2 mb-6">
          {sortOptions.map((opt) => (
            <button
              key={opt.field}
              onClick={() => setSortBy(opt.field)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${sortBy === opt.field ? 'ring-2' : ''}`}
              style={{
                background: sortBy === opt.field ? 'rgba(76, 175, 80, 0.15)' : 'var(--bg-tertiary)',
                color: sortBy === opt.field ? 'var(--accent-green)' : 'var(--text-secondary)',
                ringColor: sortBy === opt.field ? 'var(--accent-green)' : 'transparent',
              }}
            >
              <opt.icon className="w-4 h-4" />
              {opt.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <div className="grid grid-cols-[48px_1fr_100px_80px_80px] gap-2 px-4 py-2.5 text-xs font-semibold uppercase" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
            <div>Rank</div>
            <div>Player</div>
            <div>ELO</div>
            <div>W/L/D</div>
            <div>Win %</div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Loading...</div>
          ) : players.length === 0 ? (
            <div className="py-12 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No players yet. Be the first!</div>
          ) : (
            players.map((player, i) => {
              const title = getEloTitle(player[sortBy]);
              const winRate = player.games_played > 0
                ? Math.round((player.games_won / player.games_played) * 100)
                : 0;
              return (
                <div
                  key={player.id}
                  className="grid grid-cols-[48px_1fr_100px_80px_80px] gap-2 px-4 py-3 items-center border-t transition-colors hover:opacity-80"
                  style={{ borderColor: 'var(--border-color)' }}
                >
                  <div className="flex items-center justify-center">
                    {getRankBadge(i + 1)}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: title.color }}>
                      {player.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{player.username}</div>
                      <div className="text-[10px]" style={{ color: title.color }}>{title.title}</div>
                    </div>
                  </div>
                  <div className="font-mono font-bold text-sm" style={{ color: 'var(--accent-orange)' }}>{player[sortBy]}</div>
                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {player.games_won}/{player.games_lost}/{player.games_drawn}
                  </div>
                  <div className="text-xs font-semibold" style={{ color: winRate >= 50 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                    {winRate}%
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
