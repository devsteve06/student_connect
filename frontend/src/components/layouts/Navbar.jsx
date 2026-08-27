import { useLocation } from 'react-router-dom';
import { Bell, Menu, User } from 'lucide-react';
import { navigationLinks } from './navigationConfig';
import roleTheme from '../../config/roleTheme';
import { useAuth } from '../../context/useAuth';

export default function Navbar({ role = 'student', onOpenSidebar }) {
  const location = useLocation();
  const { user } = useAuth();
  const theme = roleTheme[role] || roleTheme.student;

  const currentPage =
    (navigationLinks[role] || []).find((l) => l.href === location.pathname)?.name ||
    theme.portal;

  const displayName = user?.name || (role === 'student' ? 'Alex Kamau' : role === 'firm' ? 'Apex HR' : 'Dr. Evans Kiprop');

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-slate-200/80 bg-white/85 px-4 backdrop-blur sm:px-6">
      {/* Left: menu + breadcrumb */}
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={onOpenSidebar}
          aria-label="Open navigation menu"
          className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <nav aria-label="Breadcrumb" className="hidden truncate sm:flex sm:items-center sm:gap-2">
          <span className="text-sm text-slate-400">Student Connect</span>
          <span className="text-slate-300">/</span>
          <span className="truncate text-sm font-semibold text-slate-700">{currentPage}</span>
        </nav>
        <span className="truncate text-sm font-semibold text-slate-700 sm:hidden">
          {theme.portal}
        </span>
      </div>

      {/* Right: notifications + user */}
      <div className="flex shrink-0 items-center gap-3">
        <button
          aria-label="Notifications"
          className="relative rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-rose-500" />
        </button>

        <div className="hidden h-5 w-px bg-slate-200 sm:block" />

        <div className="flex items-center gap-2.5">
          <span className="hidden text-right sm:block">
            <span className="block text-sm font-bold leading-tight text-slate-900">{displayName}</span>
            <span className={`block text-xs font-semibold ${theme.text}`}>{theme.portal}</span>
          </span>
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-xl border ${theme.border} ${theme.softBg} ${theme.text}`}
          >
            <User className="h-4.5 w-4.5" />
          </span>
        </div>
      </div>
    </header>
  );
}