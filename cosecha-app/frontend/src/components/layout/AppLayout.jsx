import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { alertasAPI } from '../../services/api';
import {
  LayoutDashboard, MapPin, Layers, Sprout, Bell, LogOut,
  Menu, X, User, ChevronDown
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Inicio' },
  { to: '/fincas', icon: MapPin, label: 'Fincas' },
  { to: '/cosechas', icon: Sprout, label: 'Cosechas' },
  { to: '/alertas', icon: Bell, label: 'Alertas', hasBadge: true },
];

function DesktopSidebar({ alertCount = 0 }) {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-tierra-100 min-h-screen fixed left-0 top-0 z-30">
      {/* Logo */}
      <div className="p-6 border-b border-tierra-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-campo-600 rounded-xl flex items-center justify-center">
            <Sprout className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg text-tierra-900 leading-tight">CosechaApp</h1>
            <p className="text-[10px] text-tierra-400 uppercase tracking-widest">Gestion agricola</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label, hasBadge }) => (
          <NavLink
            key={to} to={to} end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-campo-50 text-campo-700 font-semibold'
                  : 'text-tierra-600 hover:bg-tierra-50 hover:text-tierra-800'
              }`
            }
          >
            <Icon className="w-5 h-5" />
            <span className="flex-1">{label}</span>
            {hasBadge && alertCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold min-w-[20px] h-5 rounded-full flex items-center justify-center px-1.5">
                {alertCount > 99 ? '99+' : alertCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-tierra-100">
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="w-9 h-9 bg-campo-100 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-campo-700" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-tierra-800 truncate">{usuario?.nombre}</p>
            <p className="text-[11px] text-tierra-400 truncate">{usuario?.email}</p>
          </div>
        </div>
        <button onClick={handleLogout}
          className="flex items-center gap-2 w-full px-4 py-2 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-colors">
          <LogOut className="w-4 h-4" /> Cerrar sesión
        </button>
      </div>
    </aside>
  );
}

function MobileHeader() {
  const { usuario, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-lg border-b border-tierra-100"
      style={{ paddingTop: 'env(safe-area-inset-top, 0)' }}>
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-campo-600 rounded-lg flex items-center justify-center">
            <Sprout className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-tierra-900">CosechaApp</span>
        </div>
        <button onClick={() => setMenuOpen(!menuOpen)} className="p-2">
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>
      {menuOpen && (
        <div className="absolute top-14 right-3 bg-white rounded-2xl shadow-xl border border-tierra-100 p-3 w-56 animate-fade-in">
          <div className="px-3 py-2 mb-2">
            <p className="text-sm font-semibold">{usuario?.nombre}</p>
            <p className="text-xs text-tierra-400">{usuario?.email}</p>
          </div>
          <button onClick={() => { logout(); navigate('/login'); setMenuOpen(false); }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl">
            <LogOut className="w-4 h-4" /> Cerrar sesión
          </button>
        </div>
      )}
    </header>
  );
}

function MobileBottomNav({ alertCount = 0 }) {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-lg border-t border-tierra-100"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0)' }}>
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map(({ to, icon: Icon, label, hasBadge }) => (
          <NavLink
            key={to} to={to} end={to === '/'}
            className={({ isActive }) =>
              `relative flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all ${
                isActive ? 'text-campo-600' : 'text-tierra-400'
              }`
            }
          >
            <div className="relative">
              <Icon className="w-5 h-5" />
              {hasBadge && alertCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 bg-red-500 text-white text-[8px] font-bold min-w-[16px] h-4 rounded-full flex items-center justify-center px-1">
                  {alertCount > 99 ? '99+' : alertCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export default function AppLayout() {
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    alertasAPI.contarPendientes()
      .then((data) => setAlertCount(data?.total || 0))
      .catch(() => {});
    // Refrescar cada 5 minutos
    const interval = setInterval(() => {
      alertasAPI.contarPendientes()
        .then((data) => setAlertCount(data?.total || 0))
        .catch(() => {});
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-tierra-50">
      <DesktopSidebar alertCount={alertCount} />
      <MobileHeader />
      <main className="lg:ml-64 pt-[calc(3.5rem+env(safe-area-inset-top,0px)+1rem)] lg:pt-8 pb-[calc(4rem+env(safe-area-inset-bottom,0px)+1rem)] lg:pb-8 px-4 sm:px-6 lg:px-8 min-h-screen">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
      <MobileBottomNav alertCount={alertCount} />
    </div>
  );
}
