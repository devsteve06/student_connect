import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, X } from 'lucide-react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useAuth } from '../../context/useAuth';
import roleTheme from '../../config/roleTheme';

export default function DashboardLayout({ children, role = 'student' }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const { user, preview, stopPreview } = useAuth();

  // True when an admin is looking at this portal "as" one of its accounts
  // (admin overview → Jump into any portal). The API keeps that view read-only.
  const previewing = user?.role === 'admin' && preview?.role === role && Boolean(preview?.id);
  const theme = roleTheme[role] || roleTheme.student;

  const exitPreview = () => {
    stopPreview();
    navigate('/admin', { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-surface-2">
      <Sidebar role={role} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar role={role} onOpenSidebar={() => setMobileOpen(true)} />

        {previewing && (
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 sm:px-6">
            <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-amber-800">
              <Eye className="h-4 w-4 shrink-0" />
              <span>
                Admin preview — read-only. Viewing the {theme.portal} as{' '}
                <span className="font-extrabold">{preview.name}</span>.
              </span>
              <button
                type="button"
                onClick={exitPreview}
                className="ml-auto inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-white px-2.5 py-1 font-bold text-amber-900 transition-colors hover:bg-amber-100"
              >
                <X className="h-3.5 w-3.5" />
                Exit preview
              </button>
            </div>
          </div>
        )}

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>

        <footer className="mx-auto w-full max-w-7xl px-6 pb-6 text-xs text-ink-5">
          © 2026 Student Connect · Industrial Attachment Platform
        </footer>
      </div>
    </div>
  );
}
