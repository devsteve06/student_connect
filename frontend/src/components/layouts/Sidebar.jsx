import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { navigationLinks } from './navigationConfig';
import { LogOut } from 'lucide-react';

export default function Sidebar({ role = 'student' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const links = navigationLinks[role] || [];

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate(`/login/${role}`);
  };

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-slate-900 text-slate-300 border-r border-slate-800 flex flex-col justify-between z-30">
      <div>
        {/* Platform Branding Context */}
        <div className="h-16 px-6 flex items-center border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-md bg-indigo-600 flex items-center justify-center text-white text-xs font-black">
              S
            </div>
            <div>
              <span className="text-xs font-bold tracking-tight text-white block">Attachment Hub</span>
              <span className="text-[10px] text-slate-500 font-medium block uppercase tracking-wider -mt-0.5">{role} mode</span>
            </div>
          </div>
        </div>

        {/* Dynamic Link Tracking Iteration List */}
        <nav className="p-4 space-y-1">
          {links.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;

            return (
              <button
                key={item.href}
                onClick={() => navigate(item.href)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold rounded-lg tracking-wide transition-all ${
                  isActive
                    ? 'bg-slate-800 text-white font-bold shadow-sm border-l-2 border-indigo-500 rounded-l-none pl-3'
                    : 'hover:bg-slate-800/50 hover:text-slate-200 text-slate-400'
                }`}
              >
                {Icon && <Icon className="w-4 h-4 shrink-0 opacity-80" />}
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Operational Footer Logout Target */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/20">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold text-slate-400 hover:bg-red-950/30 hover:text-red-400 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Terminate Session</span>
        </button>
      </div>
    </aside>
  );
}