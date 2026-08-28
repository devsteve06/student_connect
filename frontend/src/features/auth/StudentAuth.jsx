import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, KeyRound, Mail } from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import AuthShell, { FormHeader, DemoHint } from './AuthShell';
import { useAuth } from '../../context/useAuth';

export default function StudentAuth() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    regNumber: '',
    course: 'BBIT',
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
      if (isRegistering) {
        await register({
          name: formData.fullName,
          email: formData.email,
          password: formData.password,
          role: 'student',
          regNumber: formData.regNumber,
          course: formData.course
        });
      } else {
        await login(formData.email, formData.password, 'student');
      }
      navigate('/student');
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
      role="student"
      headline="Launch your industrial attachment journey."
      tagline="Find placements, submit weekly logbook entries, and track your progress in one place."
      quote="Student Connect connected me with a placement that matched exactly what I wanted to learn this year."
      quoteSource="Class of 2026 · Placement story"
      footer={
        <p className="text-center text-xs text-ink-4">
          Work at a firm or a university?{' '}
          <a href="/login/firm" className="font-semibold text-brand-700 hover:text-brand-800">
            Firm sign in
          </a>{' '}
          ·{' '}
          <a href="/login/university" className="font-semibold text-brand-700 hover:text-brand-800">
            Faculty sign in
          </a>{' '}
          ·{' '}
          <a href="/login/admin" className="font-semibold text-brand-700 hover:text-brand-800">
            Admin
          </a>
        </p>
      }
    >
      <FormHeader
        title={isRegistering ? 'Create your account' : 'Welcome back'}
        subtitle={
          isRegistering
            ? 'A few details to get you started on your placement journey.'
            : 'Sign in to continue to your student hub.'
        }
      />

      {error && (
        <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {isRegistering && (
          <Input
            label="Full name"
            name="fullName"
            autoComplete="name"
            placeholder="e.g. Alex Kamau"
            value={formData.fullName}
            onChange={handleInputChange}
            required
          />
        )}

        {isRegistering && (
          <Input
            label="Admission / registration number"
            name="regNumber"
            placeholder="e.g. BBIT/4901/2023"
            value={formData.regNumber}
            onChange={handleInputChange}
            required
          />
        )}

        {isRegistering && (
          <Select
            label="Course"
            name="course"
            value={formData.course}
            onChange={handleInputChange}
          >
            <option value="BBIT">B. in Business Information Technology</option>
            <option value="Bsc-CS">BSc. in Computer Science</option>
            <option value="Bsc-Informatics">BSc. in Informatics and Computer Systems</option>
          </Select>
        )}

        <Input
          label="Student email"
          name="email"
          type="email"
          autoComplete="email"
          icon={Mail}
          placeholder="alex.kamau@strathmore.edu"
          value={formData.email}
          onChange={handleInputChange}
          required
        />

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-semibold text-ink-2">
              Password
            </label>
            {!isRegistering && (
              <a href="#" className="text-xs font-semibold text-ink-5 hover:text-brand-600">
                Forgot password?
              </a>
            )}
          </div>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete={isRegistering ? 'new-password' : 'current-password'}
              required
              placeholder="••••••••"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 pl-10 pr-10 text-sm text-ink placeholder:text-ink-5 shadow-soft transition-colors focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
            />
            <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-5" />
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

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => setIsRegistering((v) => !v)}
            className="text-sm font-semibold text-brand-700 hover:text-brand-800"
          >
            {isRegistering ? 'Already have an account? Sign in' : 'New here? Create an account'}
          </button>
          <Button type="submit" disabled={loading}>
            {loading ? (isRegistering ? 'Creating account…' : 'Signing in…') : isRegistering ? 'Create account' : 'Sign in'}
          </Button>
        </div>
      </form>

      <DemoHint email="alex.kamau@strathmore.edu" password="password123" />
    </AuthShell>
  );
}