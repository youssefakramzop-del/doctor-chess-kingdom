import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase, type Profile } from '../lib/supabase';
import { getEloTitle } from '../lib/elo';
import { User, Swords, Trophy, Edit2, Save, X } from 'lucide-react';

export default function ProfilePage() {
  const { user, fetchProfile } = useAuthStore();
  const navigate = useNavigate();
  const { id } = useParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(true);

  const profileId = id || user?.id;

  useEffect(() => {
    if (!profileId && !user) {
      navigate('/login');
      return;
    }
    fetchProfileData();
  }, [profileId, user]);

  const fetchProfileData = async () => {
    const pid = profileId || user?.id;
    if (!pid) return;
    const { data } = await supabase.from('profiles').select('*').eq('id', pid).single();
    if (data) {
      setProfile(data);
      setDisplayName(data.display_name || '');
    }
    setLoading(false);
  };

  const saveProfile = async () => {
    if (!user) return;
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: displayName, updated_at: new Date().toISOString() })
      .eq('id', user.id);
    if (!error) {
      await fetchProfile(user.id);
      setEditing(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>Loading...</div>;
  if (!profile) return <div className="min-h-screen flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>Profile not found</div>;

  const title = getEloTitle(profile.elo_rapid);
  const isOwnProfile = user?.id === profile.id;
  const winRate = profile.games_played > 0 ? Math.round((profile.games_won / profile.games_played) * 100) : 0;

  const eloModes = [
    { mode: 'Rapid', elo: profile.elo_rapid },
    { mode: 'Blitz', elo: profile.elo_blitz },
    { mode: 'Bullet', elo: profile.elo_bullet },
  ];

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-3xl mx-auto">
        {/* Profile card */}
        <div className="card p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold text-white" style={{ background: title.color }}>
                {profile.username.charAt(0).toUpperCase()}
              </div>
              <div>
                {editing ? (
                  <div className="flex items-center gap-2">
                    <input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="input-field py-1 text-sm"
                      placeholder="Display name"
                    />
                    <button onClick={saveProfile} className="p-1 rounded" style={{ color: 'var(--accent-green)' }}><Save className="w-4 h-4" /></button>
                    <button onClick={() => setEditing(false)} className="p-1 rounded" style={{ color: 'var(--accent-red)' }}><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      {profile.display_name || profile.username}
                    </h1>
                    <div className="text-sm" style={{ color: 'var(--text-muted)' }}>@{profile.username}</div>
                  </div>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ background: `${title.color}20`, color: title.color }}>{title.title}</span>
                  <span className="text-xs font-mono font-bold" style={{ color: 'var(--accent-orange)' }}>ELO {profile.elo_rapid}</span>
                </div>
              </div>
            </div>
            {isOwnProfile && !editing && (
              <button onClick={() => setEditing(true)} className="p-2 rounded-lg" style={{ color: 'var(--text-muted)' }}>
                <Edit2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="card p-4 text-center">
            <Swords className="w-5 h-5 mx-auto mb-1" style={{ color: 'var(--accent-blue)' }} />
            <div className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{profile.games_played}</div>
            <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Played</div>
          </div>
          <div className="card p-4 text-center">
            <Trophy className="w-5 h-5 mx-auto mb-1" style={{ color: 'var(--accent-green)' }} />
            <div className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{profile.games_won}</div>
            <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Won</div>
          </div>
          <div className="card p-4 text-center">
            <User className="w-5 h-5 mx-auto mb-1" style={{ color: 'var(--accent-red)' }} />
            <div className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{profile.games_lost}</div>
            <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Lost</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-xl font-bold" style={{ color: winRate >= 50 ? 'var(--accent-green)' : 'var(--accent-orange)' }}>{winRate}%</div>
            <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Win Rate</div>
          </div>
        </div>

        {/* ELO by mode */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold uppercase mb-4" style={{ color: 'var(--text-muted)' }}>Ratings</h3>
          <div className="space-y-3">
            {eloModes.map((m) => {
              const t = getEloTitle(m.elo);
              return (
                <div key={m.mode} className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{m.mode}</span>
                    <span className="text-xs ml-2" style={{ color: t.color }}>{t.title}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
                      <div className="h-full rounded-full" style={{ width: `${Math.min(100, (m.elo / 3000) * 100)}%`, background: t.color }} />
                    </div>
                    <span className="font-mono font-bold text-sm w-12 text-right" style={{ color: 'var(--accent-orange)' }}>{m.elo}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
