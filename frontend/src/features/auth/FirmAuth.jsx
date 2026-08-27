import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Eye, EyeOff, Mail } from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import AuthShell, { FormHeader, DemoHint } from './AuthShell';
import { useAuth } from '../../context/useAuth';

export default function FirmAuth() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    companyName: '',
    industrySector: 'Technology',
    contactPerson: '',
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
          name: formData.companyName,
          companyName: formData.companyName,
          email: formData.email,
          password: formData.password,
          role: 'firm'
        });
      } else {
        await login(formData.email, formData.password, 'firm');
      }
      navigate('/firm');
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
      role="firm"
      headline="Find your next great placement talent."
      tagline="Review vetted candidates, manage applications, and keep every opening moving."
      quote="We shortlisted three interns within a week of posting and placed two by month end."
      quoteSource="Nexus Labs · Partner story"
      footer={
        <p className="text-center text-xs text-slate-500">
          A student or institution?{' '}
          <a href="/login/student" className="font-semibold text-amber-700 hover:text-amber-800">
            Student sign in
          </a>{' '}
          ·{' '}
          <a href="/login/university" className="font-semibold text-amber-700 hover:text-amber-800">
            Faculty sign in
          </a>
        </p>
      }
    >
      <FormHeader
        title={isRegistering ? 'Create a partner account' : 'Welcome back'}
        subtitle={
          isRegistering
            ? 'Join the network and start receiving student applications.'
            : 'Sign in to your corporate workspace.'
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
            label="Company name"
            name="companyName"
            icon={Building2}
            placeholder="e.g. TechCorp Solutions Ltd"
            value={formData.companyName}
            onChange={handleInputChange}
            required
          />
        )}

        {isRegistering && (
          <Select
            label="Industry"
            name="industrySector"
            value={formData.industrySector}
            onChange={handleInputChange}
          >
            <option value="Technology">Technology & software</option>
            <option value="Telecommunications">Telecommunications</option>
            <option value="Banking">Banking & financial services</option>
          </Select>
        )}

        {isRegistering && (
          <Input
            label="Contact person"
            name="contactPerson"
            placeholder="e.g. Jane Mercer"
            value={formData.contactPerson}
            onChange={handleInputChange}
            required
          />
        )}

        <Input
          label="Work email"
          name="email"
          type="email"
          icon={Mail}
          autoComplete="email"
          placeholder="recruitment@company.com"
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
              <a href="#" className="text-xs font-semibold text-slate-400 hover:text-amber-600">
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
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 px-10 text-sm text-slate-900 placeholder:text-slate-400 shadow-soft transition-colors focus:border-amber-500 focus:outline-none focus:ring-4 focus:ring-amber-500/10"
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
            className="text-sm font-semibold text-amber-700 hover:text-amber-800"
          >
            {isRegistering ? 'Already have an account? Sign in' : 'New here? Join as a partner'}
          </button>
          <Button type="submit" disabled={loading}>
            {loading ? (isRegistering ? 'Creating account…' : 'Signing in…') : isRegistering ? 'Create account' : 'Sign in'}
          </Button>
        </div>
      </form>

      <DemoHint email="careers@nexuslabs.io" password="password123" />
    </AuthShell>
  );
}