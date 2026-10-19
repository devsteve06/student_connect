import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Menu, User } from 'lucide-react';
import { navigationLinks } from './navigationConfig';
import roleTheme from '../../config/roleTheme';
import { useAuth } from '../../context/useAuth';
import ThemeToggle from '../common/ThemeToggle';
import NotificationBell from '../common/NotificationBell';

const LOGIN_ROUTES = {
  student: '/login/students',
  firm: '/login/firms',
  university: '/login/universities',
  admin: '/login/admin'
};

export default function Navbar({ role = 'student', onOpenSidebar }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const theme = roleTheme[role] || roleTheme.student;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const currentPage =
    (navigationLinks[role] || []).find((l) => l.href === location.pathname)?.name ||
    theme.portal;

  const displayName = user?.name || (role === 'student' ? 'Alex Kamau' : role === 'firm' ? 'Apex HR' : 'Dr. Evans Kiprop');
  const displayEmail = user?.email || '';
  // The account details live behind the icon, so nothing about the profile is
  // rendered in the bar itself. A portal only offers a profile page when its nav
  // config has one (students do; firms, faculty and admins do not).
  const profileLink = (navigationLinks[role] || []).find((link) => link.name === 'Profile');
  const ProfileIcon = profileLink?.icon;

  // Close on any click outside the menu or on Escape. A route change closes it
  // too, because every link inside navigates and then closes explicitly — so no
  // effect has to set state in response to the pathname (eslint forbids that).
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onPointerDown = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  const handleSignOut = () => {
    setMenuOpen(false);
    logout();
    navigate(LOGIN_ROUTES[role] || '/login/students');
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-line/80 bg-surface/85 px-4 backdrop-blur sm:px-6">
      {/* Left: menu + breadcrumb */}
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={onOpenSidebar}
          aria-label="Open navigation menu"
          className="rounded-lg p-2 text-ink-4 transition-colors hover:bg-surface-3 hover:text-ink lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <nav aria-label="Breadcrumb" className="hidden truncate sm:flex sm:items-center sm:gap-2">
          <span className="text-sm text-ink-5">Student Connect</span>
          <span className="text-ink-5">/</span>
          <span className="truncate text-sm font-semibold text-ink-2">{currentPage}</span>
        </nav>
        <span className="truncate text-sm font-semibold text-ink-2 sm:hidden">
          {theme.portal}
        </span>
      </div>

      {/* Right: notifications + account */}
      <div className="flex shrink-0 items-center gap-3">
        {/* Live unread badge + feed (student/firm only; other roles get nothing) */}
        <NotificationBell role={role} />

        <div className="hidden h-5 w-px bg-surface-4 sm:block" />

        <ThemeToggle />

        {/* The whole profile — name, email, role, actions — is behind this
            icon; pressing it is the only way to reach it. */}
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Account menu"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-colors hover:brightness-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/10 ${theme.border} ${theme.softBg} ${theme.text}`}
          >
            <User className="h-4.5 w-4.5" />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-11 z-30 w-72 overflow-hidden rounded-xl border border-line bg-surface shadow-xl"
            >
              <div className="border-b border-line/80 px-4 py-3">
                <p className="truncate text-sm font-bold text-ink">{displayName}</p>
                {displayEmail && (
                  <p className="mt-0.5 truncate text-xs text-ink-4" title={displayEmail}>
                    {displayEmail}
                  </p>
                )}
                <span
                  className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${theme.softBg} ${theme.text}`}
                >
                  {theme.portal}
                </span>
              </div>

              {profileLink && (
                <button
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    navigate(profileLink.href);
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-semibold text-ink-2 transition-colors hover:bg-surface-2"
                >
                  <ProfileIcon className="h-4 w-4 text-ink-5" />
                  {profileLink.name}
                </button>
              )}

              <button
                role="menuitem"
                onClick={handleSignOut}
                className="flex w-full items-center gap-2.5 border-t border-line/60 px-4 py-2.5 text-left text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
