import { useEffect, useState } from 'react';
import { supabase, type Game } from '../lib/supabase';
import { Eye, Clock, Swords, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function WatchPage() {
  const [activeGames, setActiveGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveGames();

    const channel = supabase
      .channel('active-games')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'games',
        filter: 'status=eq.active',
      }, () => {
        fetchActiveGames();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchActiveGames = async () => {
    const { data } = await supabase
      .from('games')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setActiveGames(data);
    setLoading(false);
  };

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Eye className="w-7 h-7" style={{ color: 'var(--accent-blue)' }} />
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Watch Games</h1>
        </div>

        {loading ? (
          <div className="py-12 text-center" style={{ color: 'var(--text-muted)' }}>Loading active games...</div>
        ) : activeGames.length === 0 ? (
          <div className="card p-8 text-center">
            <Swords className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
            <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>No Active Games</h2>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>There are no games in progress right now.</p>
            <Link to="/play" className="btn-primary inline-block no-underline">Start a Game</Link>
          </div>
        ) : (
          <div className="grid gap-3">
            {activeGames.map((game) => (
              <div key={game.id} className="card p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: 'var(--bg-tertiary)' }}>
                        W
                      </div>
                      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>White</span>
                    </div>
                    <span className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>vs</span>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: 'var(--bg-tertiary)' }}>
                        B
                      </div>
                      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Black</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs px-2 py-0.5 rounded capitalize font-medium" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                      {game.game_mode}
                    </span>
                    <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <Clock className="w-3 h-3" />
                      {Math.floor(game.time_control_white / 60)}+{game.increment}
                    </div>
                    <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <Users className="w-3 h-3" />
                      {game.move_count} moves
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
