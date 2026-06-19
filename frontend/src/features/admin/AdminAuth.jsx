import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock } from 'lucide-react';
import Button from '../../components/common/Button';
import { adminService } from '../../service/adminService';

export default function AdminAuth() {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await adminService.login(credentials.username.trim(), credentials.password);
      navigate('/admin');
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Authentication failed. Verify the system is online.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans antialiased selection:bg-rose-100 selection:text-rose-900">

      {/* Branding Presentation Frame */}
      <div className="hidden lg:flex lg:w-5/12 bg-slate-950 text-white p-16 flex-col justify-between relative overflow-hidden border-r border-slate-900">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl" />

        <div className="relative z-10 space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 shadow-inner">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Root Control Plane</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-100 leading-tight">
            System Administration Console.
          </h1>
        </div>

        <div className="relative z-10 max-w-md border-l-2 border-rose-500 pl-6 my-auto">
          <blockquote className="text-xl font-medium text-slate-300 leading-relaxed tracking-wide font-serif italic">
            "Absolute governance over every trainee, corporate partner, and faculty node across the placement grid."
          </blockquote>
          <p className="text-[11px] text-rose-400 mt-4 font-bold uppercase tracking-widest">Privileged Access — Audited</p>
        </div>

        <div className="relative z-10 text-[11px] text-slate-500 font-medium tracking-wide">
          © 2026 University Placement System. Administrative Core.
        </div>
      </div>

      {/* Form Action Sheet */}
      <div className="w-full lg:w-7/12 flex items-center justify-center p-8 sm:p-16 bg-white shadow-2xl">
        <div className="w-full max-w-md space-y-10">

          <div className="space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-slate-950 text-rose-400 flex items-center justify-center shadow-inner">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Administrator Sign In</h2>
              <p className="text-sm text-slate-500 font-medium">
                Restricted endpoint. Authorized system operators only.
              </p>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700 flex items-center gap-2">
              <Lock className="h-3.5 w-3.5 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">Administrator Username</label>
              <input
                type="text"
                name="username"
                required
                autoComplete="username"
                value={credentials.username}
                onChange={handleInputChange}
                placeholder="sysadmin"
                className="w-full text-sm border border-slate-200 rounded-xl px-4 py-3 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-rose-500/5 focus:border-rose-500 transition-all duration-200 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">Password</label>
              <input
                type="password"
                name="password"
                required
                autoComplete="current-password"
                value={credentials.password}
                onChange={handleInputChange}
                placeholder="••••••••"
                className="w-full text-sm border border-slate-200 rounded-xl px-4 py-3 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-rose-500/5 focus:border-rose-500 transition-all duration-200"
              />
            </div>

            <div className="pt-4">
              <Button type="submit" disabled={loading} className="w-full h-12">
                {loading ? 'Verifying Clearance…' : 'Authorize Privileged Session'}
              </Button>
            </div>
          </form>

          <div className="border-t border-slate-100 pt-8 text-center">
            <p className="text-xs text-slate-400 font-medium">
              Not an administrator?{' '}
              <a href="/login/student" className="text-slate-900 font-bold hover:text-rose-600 transition-colors underline decoration-slate-300 underline-offset-4">
                Return to portal sign in
              </a>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
