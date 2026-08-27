import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, X } from 'lucide-react';
import { navigationLinks } from './navigationConfig';
import roleTheme from '../../config/roleTheme';
import { useAuth } from '../../context/useAuth';

export default function Sidebar({ role = 'student', mobileOpen = false, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const theme = roleTheme[role] || roleTheme.student;
  const links = navigationLinks[role] || [];

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
    return undefined;
  }, [mobileOpen]);

  const handleLogout = () => {
    logout();
    navigate(role === 'admin' ? '/login/admin' : '/login/student');
  };

  const NavContent = (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex items-center justify-between px-5 py-5">
        <div className="flex items-center gap-3">
          <img src="/favicon.svg" alt="Student Connect" className="h-9 w-9 rounded-xl shadow-sm" />
          <div>
            <p className="text-sm font-extrabold tracking-tight text-white">Student Connect</p>
            <p className={`text-[11px] font-semibold ${theme.icon}`}>{theme.portal}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close menu"
          className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="mt-2 flex-1 space-y-1 overflow-y-auto px-3">
        {links.map((item, idx) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;
          const firstOfSection = item.section && idx > 0;

          return (
            <div key={item.href}>
              {firstOfSection && (
                <p className="mb-1 mt-4 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  {item.section}
                </p>
              )}
              <button
                onClick={() => {
                  navigate(item.href);
                  onClose?.();
                }}
                aria-current={isActive ? 'page' : undefined}
                className={`relative flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                  isActive
                    ? `${theme.navActive} border bg-white shadow-soft`
                    : `border border-transparent text-slate-400 ${theme.navHover} hover:text-slate-200`
                }`}
              >
                {Icon && <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? theme.icon : ''}`} />}
                <span className="truncate">{item.name}</span>
                {isActive && (
                  <span className={`absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full ${theme.navDot}`} />
                )}
              </button>
            </div>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="border-t border-white/10 p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-400 transition-colors hover:bg-rose-500/10 hover:text-rose-300"
        >
          <LogOut className="h-4.5 w-4.5" />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden w-64 shrink-0 bg-slate-950 lg:block">
        <div className="fixed inset-y-0 left-0 z-30 w-64 bg-slate-950">{NavContent}</div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 animate-fade-in bg-slate-950/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
          <aside className="absolute inset-y-0 left-0 w-72 animate-slide-in-left bg-slate-950 shadow-pop">
            {NavContent}
          </aside>
        </div>
      )}
    </>
  );
}