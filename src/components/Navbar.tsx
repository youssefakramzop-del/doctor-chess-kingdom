import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { useGameStore } from '../store/useGameStore';
import { Sun, Moon, LogOut, Menu, X, Crown, Swords, User, BarChart3, Home } from 'lucide-react';

export default function Navbar() {
  const { user, signOut } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const navLinks = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/play', icon: Swords, label: 'Play' },
    { to: '/leaderboard', icon: Crown, label: 'Leaderboard' },
    ...(user ? [
      { to: '/dashboard', icon: BarChart3, label: 'Dashboard' },
      { to: '/profile', icon: User, label: 'Profile' },
    ] : []),
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 border-b" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 no-underline">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-green)' }}>
              <Swords className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>ChessMaster</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium no-underline transition-all"
                style={{
                  color: isActive(link.to) ? 'var(--accent-green)' : 'var(--text-secondary)',
                  background: isActive(link.to) ? 'rgba(76, 175, 80, 0.1)' : 'transparent',
                }}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg transition-colors"
              style={{ color: 'var(--text-secondary)' }}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {user ? (
              <div className="hidden md:flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: 'var(--accent-green)' }}>
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{user.username}</span>
                  <span className="text-xs font-mono" style={{ color: 'var(--accent-orange)' }}>{user.elo_rapid}</span>
                </div>
                <button onClick={() => { signOut(); navigate('/'); }} className="p-2 rounded-lg transition-colors" style={{ color: 'var(--text-secondary)' }}>
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link to="/login" className="btn-secondary text-xs no-underline">Log In</Link>
                <Link to="/register" className="btn-primary text-xs no-underline">Sign Up</Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 rounded-lg" style={{ color: 'var(--text-secondary)' }}>
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t fade-in" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium no-underline transition-all"
                style={{
                  color: isActive(link.to) ? 'var(--accent-green)' : 'var(--text-secondary)',
                  background: isActive(link.to) ? 'rgba(76, 175, 80, 0.1)' : 'transparent',
                }}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            ))}
            {user ? (
              <button
                onClick={() => { signOut(); setMobileOpen(false); navigate('/'); }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium w-full text-left"
                style={{ color: 'var(--text-secondary)' }}
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            ) : (
              <div className="flex gap-2 pt-2">
                <Link to="/login" onClick={() => setMobileOpen(false)} className="btn-secondary text-xs no-underline">Log In</Link>
                <Link to="/register" onClick={() => setMobileOpen(false)} className="btn-primary text-xs no-underline">Sign Up</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
