import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Eye, EyeOff } from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import AuthShell, { DemoHint } from '../auth/AuthShell';
import { useAuth } from '../../context/useAuth';

export default function AdminAuth() {
  const navigate = useNavigate();
  const { adminLogin } = useAuth();
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
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
      await adminLogin(credentials.username.trim(), credentials.password);
      navigate('/admin');
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        'Sign in failed. Please verify your credentials and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      role="admin"
      headline="Manage every account on the platform."
      tagline="Create accounts, reset passwords, and monitor all student, firm, and university users."
      quote="A single control room for the whole placement ecosystem."
      quoteSource="Privileged access · Audited"
      footer={
        <p className="text-center text-xs text-ink-4">
          Not an administrator?{' '}
          <a href="/login/student" className="font-semibold text-rose-700 hover:text-rose-800">
            Return to portal sign in
          </a>
        </p>
      }
    >
      <div className="mb-8 space-y-2">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lifted">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight text-ink">Administrator sign in</h2>
        <p className="text-sm text-ink-4">Restricted area — authorized platform operators only.</p>
      </div>

      {error && (
        <div className="mb-5 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          <Lock className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Username"
          name="username"
          autoComplete="username"
          placeholder="sysadmin"
          value={credentials.username}
          onChange={handleInputChange}
          required
        />

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-ink-2">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              placeholder="••••••••"
              value={credentials.password}
              onChange={handleInputChange}
              className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-5 shadow-soft transition-colors focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-ink-5 hover:text-ink-3"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button type="submit" disabled={loading} className="mt-2 w-full">
          {loading ? 'Signing in…' : 'Sign in to admin center'}
        </Button>
      </form>

      <DemoHint username="sysadmin" password="theadmin" />
    </AuthShell>
  );
}