import { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function DashboardLayout({ children, role = 'student' }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role={role} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar role={role} onOpenSidebar={() => setMobileOpen(true)} />

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>

        <footer className="mx-auto w-full max-w-7xl px-6 pb-6 text-xs text-slate-400">
          © 2026 Student Connect · Industrial Attachment Platform
        </footer>
      </div>
    </div>
  );
}