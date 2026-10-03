import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Building2,
  Eye,
  EyeOff,
  GraduationCap,
  Landmark,
  Mail,
} from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import AuthShell, { FormHeader } from './AuthShell';
import { useAuth } from '../../context/useAuth';
import roleTheme from '../../config/roleTheme';
import registrationRoles, { isRegistrableRole } from '../../config/registration';

const ROLE_ICONS = { student: GraduationCap, firm: Building2, university: Landmark };

const INDUSTRIES = [
  'Technology & software',
  'Telecommunications',
  'Banking & financial services',
  'Healthcare & pharmaceuticals',
  'Manufacturing & engineering',
  'Media & creative',
];

const COURSES = [
  'B. in Business Information Technology',
  'BSc. in Computer Science',
  'BSc. in Informatics and Computer Systems',
  'BSc. in Software Engineering',
];

const DEPARTMENTS = [
  'Faculty of IT (FIT)',
  'Strathmore Business School (SBS)',
  'School of Engineering',
  'Faculty of Education',
];

// One flat state object; each role renders the slice it needs. Keeping every
// field in a single object means switching roles never leaves stale values
// behind in the payload.
const EMPTY_FORM = {
  fullName: '',
  regNumber: '',
  course: COURSES[0],
  companyName: '',
  contactPerson: '',
  industrySector: INDUSTRIES[0],
  facultyName: '',
  staffId: '',
  department: DEPARTMENTS[0],
  email: '',
  password: '',
  confirmPassword: '',
};

// Maps the form onto exactly what the API persists for each role. Anything the
// form collects MUST appear here — the previous in-page toggle silently dropped
// industrySector / contactPerson / staffId / department.
function buildPayload(role, form) {
  if (role === 'student') {
    return {
      name: form.fullName.trim(),
      email: form.email,
      password: form.password,
      role,
      regNumber: form.regNumber.trim(),
      course: form.course,
    };
  }
  if (role === 'firm') {
    return {
      name: form.companyName.trim(),
      companyName: form.companyName.trim(),
      contactPerson: form.contactPerson.trim(),
      industrySector: form.industrySector,
      email: form.email,
      password: form.password,
      role,
    };
  }
  return {
    name: form.facultyName.trim(),
    email: form.email,
    password: form.password,
    role,
    staffId: form.staffId.trim(),
    department: form.department,
  };
}

export default function Register() {
  const { role: routeRole } = useParams();
  const navigate = useNavigate();
  const { register } = useAuth();

  // /register/:role locks the form to a portal; /register offers the picker.
  // Anything else (e.g. /register/admin) falls back to the picker, which is how
  // admin self-signup stays impossible.
  const role = isRegistrableRole(routeRole) ? routeRole : null;

  const [form, setForm] = useState(EMPTY_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('The two passwords do not match.');
      return;
    }
    if (form.password.length < 8) {
      setError('Use a password of at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      await register(buildPayload(role, form));
      navigate(registrationRoles[role].homePath);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'We could not create that account. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // --- Role picker (/register with no role segment) ------------------------
  if (!role) {
    return (
      <AuthShell
        role="student"
        headline="Pick the portal you're joining."
        tagline="One platform for students, corporate partners, and academic institutions."
        quote="Sign up once and every placement, application, and logbook sign-off follows you."
        quoteSource="Why teams pick Student Connect"
        footer={
          <p className="text-center text-xs text-ink-4">
            Already registered?{' '}
            <Link to="/" className="font-semibold text-brand-700 hover:text-brand-800">
              Back to sign in
            </Link>
          </p>
        }
      >
        <FormHeader
          title="Create an account"
          subtitle="Choose your portal to see the right signup form."
        />

        <div className="space-y-3">
          {Object.values(registrationRoles).map((option) => {
            const Icon = ROLE_ICONS[option.role];
            const theme = roleTheme[option.role];
            return (
              <Link
                key={option.role}
                to={`/register/${option.role}`}
                className="flex items-center gap-4 rounded-2xl border border-line bg-surface px-5 py-4 shadow-soft transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lifted"
              >
                <span
                  className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${theme.softBg} ${theme.text}`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-extrabold tracking-tight text-ink">
                    {option.portal}
                  </span>
                  <span className="block text-xs text-ink-4">{option.subtitle}</span>
                </span>
                <span className={`shrink-0 text-sm font-semibold ${theme.text}`}>Register</span>
              </Link>
            );
          })}
        </div>

        <p className="mt-6 rounded-xl border border-line bg-surface px-4 py-3 text-xs text-ink-4">
          Administrator accounts are created by an existing admin from the Admin Center, so
          there is no self-service signup for that portal.
        </p>
      </AuthShell>
    );
  }

  const config = registrationRoles[role];

  return (
    <AuthShell
      role={role}
      headline={config.headline}
      tagline={config.tagline}
      quote={config.quote}
      quoteSource={config.quoteSource}
      footer={
        <p className="text-center text-xs text-ink-4">
          Already have an account?{' '}
          <Link to={config.loginPath} className={`font-semibold ${config.accent.link}`}>
            Sign in instead
          </Link>
          {' · '}
          <Link to="/register" className="font-semibold text-ink-3 hover:text-ink-2">
            Change portal
          </Link>
        </p>
      }
    >
      <FormHeader title={config.title} subtitle={config.subtitle} />

      {error && (
        <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {role === 'student' && (
          <>
            <Input
              label="Full name"
              name="fullName"
              autoComplete="name"
              placeholder="e.g. Alex Kamau"
              value={form.fullName}
              onChange={handleInputChange}
              required
            />
            <Input
              label="Admission / registration number"
              name="regNumber"
              placeholder="e.g. BBIT/4901/2023"
              value={form.regNumber}
              onChange={handleInputChange}
              required
            />
            <Select
              label="Course"
              name="course"
              value={form.course}
              onChange={handleInputChange}
            >
              {COURSES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </>
        )}

        {role === 'firm' && (
          <>
            <Input
              label="Company name"
              name="companyName"
              icon={Building2}
              placeholder="e.g. TechCorp Solutions Ltd"
              value={form.companyName}
              onChange={handleInputChange}
              required
            />
            <Input
              label="Contact person"
              name="contactPerson"
              placeholder="e.g. Jane Mercer"
              value={form.contactPerson}
              onChange={handleInputChange}
              required
            />
            <Select
              label="Industry"
              name="industrySector"
              value={form.industrySector}
              onChange={handleInputChange}
            >
              {INDUSTRIES.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </Select>
          </>
        )}

        {role === 'university' && (
          <>
            <Input
              label="Full name / title"
              name="facultyName"
              autoComplete="name"
              placeholder="e.g. Prof. Evans Kiprop"
              value={form.facultyName}
              onChange={handleInputChange}
              required
            />
            <Input
              label="Staff ID"
              name="staffId"
              placeholder="e.g. ST-1042"
              value={form.staffId}
              onChange={handleInputChange}
              required
            />
            <Select
              label="Department"
              name="department"
              value={form.department}
              onChange={handleInputChange}
            >
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>
          </>
        )}

        <Input
          label={role === 'student' ? 'Student email' : role === 'firm' ? 'Work email' : 'Institutional email'}
          name="email"
          type="email"
          icon={Mail}
          autoComplete="email"
          placeholder={
            role === 'student'
              ? 'alex.kamau@students.strathmore.edu'
              : role === 'firm'
                ? 'recruitment@company.com'
                : 'registrar@strathmore.edu'
          }
          value={form.email}
          onChange={handleInputChange}
          required
        />

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="register-password" className="text-sm font-semibold text-ink-2">
              Password
            </label>
            <span className="text-xs text-ink-5">At least 8 characters</span>
          </div>
          <div className="relative">
            <input
              id="register-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              minLength={8}
              placeholder="••••••••"
              value={form.password}
              onChange={handleInputChange}
              className={`w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 px-10 text-sm text-ink placeholder:text-ink-5 shadow-soft transition-colors focus:outline-none focus:ring-4 ${config.accent.focus}`}
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

        <Input
          label="Confirm password"
          name="confirmPassword"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          required
          placeholder="••••••••"
          value={form.confirmPassword}
          onChange={handleInputChange}
        />

        <div className="flex items-center justify-between gap-3 pt-2">
          <Link
            to={config.loginPath}
            className={`text-sm font-semibold ${config.accent.link}`}
          >
            Already have an account? Sign in
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating account…' : config.cta}
          </Button>
        </div>
      </form>
    </AuthShell>
  );
}
