import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail } from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import AuthShell, { FormHeader, DemoHint } from './AuthShell';
import { useAuth } from '../../context/useAuth';
import registrationRoles from '../../config/registration';

export default function UniversityAuth() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(formData.email, formData.password, 'university');
      navigate('/university');
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Sign in failed. Please check your details and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      role="university"
      headline="Oversee every placement, from start to sign-off."
      tagline="Track student attachments, verify logbooks, and monitor placement progress across your institution."
      quote="The audit queue gives us a clear view of every pending logbook before the semester closes."
      quoteSource="Strathmore Administrative Registry"
      footer={
        <p className="text-center text-xs text-ink-4">
          A student or firm?{' '}
          <Link to="/login/student" className="font-semibold text-cyan-700 hover:text-cyan-800">
            Student sign in
          </Link>
          {' · '}
          <Link to="/login/firm" className="font-semibold text-cyan-700 hover:text-cyan-800">
            Firm sign in
          </Link>
        </p>
      }
    >
      <FormHeader title="Welcome back" subtitle="Sign in to manage attachments and audits." />

      {error && (
        <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Institutional email"
          name="email"
          type="email"
          icon={Mail}
          autoComplete="email"
          placeholder="registrar@strathmore.edu"
          value={formData.email}
          onChange={handleInputChange}
          required
        />

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-semibold text-ink-2">
              Password
            </label>
            {/* No self-service reset exists yet; an admin issues resets from
                POST /admin/reset-password. Point people at that instead of a
                dead href="#". */}
            <span className="text-xs text-ink-5">
              Locked out? Ask your admin to reset it.
            </span>
          </div>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              placeholder="••••••••"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 px-10 text-sm text-ink placeholder:text-ink-5 shadow-soft transition-colors focus:border-cyan-500 focus:outline-none focus:ring-4 focus:ring-cyan-500/10"
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

        <div className="flex items-center justify-between gap-3 pt-2">
          <Link
            to={registrationRoles.university.registerPath}
            className="text-sm font-semibold text-cyan-700 hover:text-cyan-800"
          >
            Need staff access? Request it
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </div>
      </form>

      <DemoHint email="registrar@jkuat.ac.ke" password="password123" />
    </AuthShell>
  );
}
