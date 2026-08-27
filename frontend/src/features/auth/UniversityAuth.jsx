import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail } from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import AuthShell, { FormHeader, DemoHint } from './AuthShell';
import { useAuth } from '../../context/useAuth';

export default function UniversityAuth() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    facultyName: '',
    staffId: '',
    department: 'Computer Science',
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
          name: formData.facultyName,
          email: formData.email,
          password: formData.password,
          role: 'university'
        });
      } else {
        await login(formData.email, formData.password, 'university');
      }
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
        <p className="text-center text-xs text-slate-500">
          A student or firm?{' '}
          <a href="/login/student" className="font-semibold text-cyan-700 hover:text-cyan-800">
            Student sign in
          </a>{' '}
          ·{' '}
          <a href="/login/firm" className="font-semibold text-cyan-700 hover:text-cyan-800">
            Firm sign in
          </a>
        </p>
      }
    >
      <FormHeader
        title={isRegistering ? 'Create a staff account' : 'Welcome back'}
        subtitle={
          isRegistering
            ? 'Request clearances for your faculty or department.'
            : 'Sign in to manage attachments and audits.'
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
            label="Full name / title"
            name="facultyName"
            placeholder="e.g. Prof. Evans Kiprop"
            value={formData.facultyName}
            onChange={handleInputChange}
            required
          />
        )}

        {isRegistering && (
          <Input
            label="Staff ID"
            name="staffId"
            placeholder="e.g. ST-XXXX"
            value={formData.staffId}
            onChange={handleInputChange}
            required
          />
        )}

        {isRegistering && (
          <Select
            label="Department"
            name="department"
            value={formData.department}
            onChange={handleInputChange}
          >
            <option value="Computer Science">Faculty of IT (FIT)</option>
            <option value="Business">Strathmore Business School (SBS)</option>
            <option value="Engineering">School of Engineering</option>
          </Select>
        )}

        <Input
          label="Institutional email"
          name="email"
          type="email"
          icon={Mail}
          autoComplete="email"
          placeholder="username@strathmore.edu"
          value={formData.email}
          onChange={handleInputChange}
          required
        />

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-semibold text-slate-700">
              Password
            </label>
            {!isRegistering && (
              <a href="#" className="text-xs font-semibold text-slate-400 hover:text-cyan-600">
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
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 px-10 text-sm text-slate-900 placeholder:text-slate-400 shadow-soft transition-colors focus:border-cyan-500 focus:outline-none focus:ring-4 focus:ring-cyan-500/10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => setIsRegistering((v) => !v)}
            className="text-sm font-semibold text-cyan-700 hover:text-cyan-800"
          >
            {isRegistering ? 'Already have an account? Sign in' : 'Need staff access? Request it'}
          </button>
          <Button type="submit" disabled={loading}>
            {loading ? (isRegistering ? 'Creating account…' : 'Signing in…') : isRegistering ? 'Create account' : 'Sign in'}
          </Button>
        </div>
      </form>

      <DemoHint email="registrar@jkuat.ac.ke" password="password123" />
    </AuthShell>
  );
}