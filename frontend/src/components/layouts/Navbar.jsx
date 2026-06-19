import React from 'react';
import { Bell, User, Menu } from 'lucide-react';

export default function Navbar({ role = 'student' }) {
  // Map roles to distinct branding colors
  const roleBadges = {
    student: { text: 'Trainee', class: 'bg-blue-50 text-blue-700 border-blue-200' },
    firm: { text: 'Partner', class: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    university: { text: 'Coordinator', class: 'bg-indigo-50 text-indigo-700 border-indigo-200' }
  };

  const badge = roleBadges[role] || roleBadges.student;

  return (
    <header className="sticky top-0 z-20 h-16 w-full bg-white border-b border-[#E2DDD8] px-6 flex items-center justify-between shadow-[0_2px_12px_0_rgba(13,27,42,0.02)]">
      {/* Left side: Hamburger (Mobile) & Navigation Context */}
      <div className="flex items-center gap-4">
        <button className="md:hidden p-2 -ml-2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none">
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider font-['ui-sans-serif',_system-ui,_sans-serif]">
          <span>Portal Gateway</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-500 font-bold">{role} panel</span>
        </div>
      </div>

      {/* Right side: Alerts & User profile */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-full hover:bg-[#F7F6F3]">
          <Bell className="w-4.5 h-4.5" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full border border-white" />
        </button>

        {/* Vertical Divider */}
        <div className="h-5 w-px bg-[#E2DDD8]" />

        {/* Profile Info */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden xs:block">
            <span className="block text-xs font-bold text-[#0D1B2A] font-['ui-sans-serif',_system-ui,_sans-serif]">
              {role === 'student' ? 'Alex Kamau' : role === 'firm' ? 'Apex HR Dept' : 'Dr. Evans Kiprop'}
            </span>
            <span className={`inline-flex items-center px-2 py-0.5 mt-0.5 rounded-full text-[9px] font-bold uppercase tracking-[0.1em] border ${badge.class} font-['ui-sans-serif',_system-ui,_sans-serif]`}>
              {badge.text}
            </span>
          </div>

          <div className="w-8 h-8 rounded-lg bg-[#F7F6F3] border border-[#E2DDD8] flex items-center justify-center text-slate-500 hover:border-[#1E4D8C] hover:text-[#1E4D8C] transition-all cursor-pointer">
            <User className="w-4 h-4" />
          </div>
        </div>
      </div>
    </header>
  );
}
