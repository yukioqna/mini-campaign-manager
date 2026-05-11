import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export function NavHeader() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-40" role="banner">
      <div className="max-w-6xl mx-auto h-full px-6 flex items-center justify-between">
        <Link to="/campaigns" className="text-lg font-semibold text-slate-900" aria-label="Campaigns home">
          Campaigns
        </Link>
        <nav role="navigation" aria-label="Account navigation">
          {user && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium" aria-hidden="true">
                {initials}
              </div>
              <span className="text-sm text-slate-600 hidden sm:block">{user.name}</span>
              <button onClick={handleLogout} className="text-sm text-slate-500 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">
                Log out
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
