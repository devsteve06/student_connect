import { useEffect, useState } from 'react';
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
import { authService } from '../../service/authService';
import roleTheme from '../../config/roleTheme';
import registrationRoles, { isRegistrableRole } from '../../config/registration';
import {
  institutionDomainFromEmail,
  isValidDomain,
  previewAccountEmail,
} from '../../config/identity';
import { previewRegNumber } from '../../config/regNumber';

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

// One flat state object; each role renders the slice it needs. Keeping every
// field in a single object means switching roles never leaves stale values
// behind in the payload.
const EMPTY_FORM = {
  fullName: '',
  course: COURSES[0],
  universityId: '',
  companyName: '',
  contactPerson: '',
  industrySector: INDUSTRIES[0],
  firmUniversityId: '',
  // Universities only: the institution's own name. One account per
  // institution, so no staff identity or department is collected.
  universityName: '',
  // Universities only: the address typed into the "Institutional email" field.
  // The API derives the final registrar address from it, so we send the bare
  // domain, never the email itself.
  email: '',
  password: '',
  confirmPassword: '',
};

function buildPayload(role, form) {
  if (role === 'student') {
    const universityId = Number.parseInt(form.universityId, 10);
    return {
      name: form.fullName.trim(),
      password: form.password,
      role,
      course: form.course,
      universityId: Number.isInteger(universityId) ? universityId : undefined,
    };
  }
  if (role === 'firm') {
    const universityId = Number.parseInt(form.firmUniversityId, 10);
    return {
      name: form.companyName.trim(),
      companyName: form.companyName.trim(),
      contactPerson: form.contactPerson.trim(),
      industrySector: form.industrySector,
      password: form.password,
      role,
      universityId: Number.isInteger(universityId) ? universityId : undefined,
    };
  }
  // Universities only: the institution's name + the typed registrar address.
  // The API derives the registrar address itself (e.g.
  // university.of.eldoret@registrar.uoe.ac.ke) and enforces one account per
  // institution domain, so we send the bare domain, never the email.
  return {
    name: form.universityName.trim(),
    password: form.password,
    role,
    domain: institutionDomainFromEmail(form.email),
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
  const [universities, setUniversities] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!role) return;
    authService
      .listUniversities()
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setUniversities(list);
        if (role === 'student' && !form.universityId && list[0]?.id) {
          setForm((prev) => ({ ...prev, universityId: String(list[0].id) }));
        }
        if (role === 'firm' && !form.firmUniversityId && list[0]?.id) {
          setForm((prev) => ({ ...prev, firmUniversityId: String(list[0].id) }));
        }
      })
      .catch((err) => {
        setError(
          err.response?.data?.message ||
            err.message ||
            'Could not load universities. Please reload the page.'
        );
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

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
    // Students and firms pick a university (pre-selected to the first in the
    // list); their email is derived from it server-side.
    if (role === 'student' && !Number.isInteger(Number.parseInt(form.universityId, 10))) {
      setError('Choose the university you are enrolled at.');
      return;
    }
    if (role === 'firm' && !Number.isInteger(Number.parseInt(form.firmUniversityId, 10))) {
      setError('Choose the university your company partners with.');
      return;
    }
    // University signups send the institution domain, recovered from the typed
    // address. Catch an unusable address here for a friendlier message than the
    // API's 400.
    if (role === 'university' && !isValidDomain(institutionDomainFromEmail(form.email))) {
      setError(
        'Enter a valid institutional email so we can derive your university domain (e.g. registrar@uoe.ac.ke).'
      );
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
  // Students: the API assigns the admission number and derives the address from
  // the chosen university, so both are previews, not inputs.
  const selectedUniversity = universities.find(
    (u) => String(u.id) === String(form.universityId)
  );
  // Firms: the API derives the recruitment address from the company name plus
  // the affiliated university's domain, so it is a preview, not an input.
  const selectedFirmUniversity = universities.find(
    (u) => String(u.id) === String(form.firmUniversityId)
  );
  const derivedFirmEmail =
    role === 'firm'
      ? previewAccountEmail({
          role,
          name: form.companyName,
          domain: selectedFirmUniversity?.domain,
        })
      : '';
  const derivedStudentEmail =
    role === 'student'
      ? previewAccountEmail({
          role,
          name: form.fullName,
          domain: selectedUniversity?.domain,
        })
      : '';
  const regNumberPreview = role === 'student' ? previewRegNumber(form.course) : '';
  // Universities: show the read-only address the API will derive once both the
  // institution name and a registrar email have been typed.
  const derivedUniversityEmail =
    role === 'university'
      ? previewAccountEmail({
          role,
          name: form.universityName,
          domain: institutionDomainFromEmail(form.email),
        })
      : '';

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
            <Select
              label="University"
              name="universityId"
              value={form.universityId}
              onChange={handleInputChange}
              required
            >
              {universities.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </Select>
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
            <Select
              label="Partner university"
              name="firmUniversityId"
              value={form.firmUniversityId}
              onChange={handleInputChange}
              required
            >
              {universities.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </Select>
          </>
        )}

        {role === 'university' && (
          <Input
            label="University"
            name="universityName"
            icon={Landmark}
            autoComplete="organization"
            placeholder="e.g. University of Eldoret"
            value={form.universityName}
            onChange={handleInputChange}
            required
          />
        )}

        {role === 'university' && (
          <Input
            label="Institutional email"
            name="email"
            type="email"
            icon={Mail}
            autoComplete="email"
            placeholder="registrar@strathmore.edu"
            value={form.email}
            onChange={handleInputChange}
            required
          />
        )}

        {role === 'student' && (derivedStudentEmail || regNumberPreview) && (
          <div className="space-y-1 rounded-xl border border-line bg-surface px-4 py-3 text-xs text-ink-4">
            <p>
              Student email{' '}
              {derivedStudentEmail ? (
                <span className="font-semibold text-ink-2">{derivedStudentEmail}</span>
              ) : (
                '— pick your university to preview it'
              )}
            </p>
            <p>
              Admission number is assigned at signup, e.g.{' '}
              <span className="font-semibold text-ink-2">{regNumberPreview}</span>
            </p>
          </div>
        )}

        {role === 'firm' && (
          <p className="rounded-xl border border-line bg-surface px-4 py-3 text-xs text-ink-4">
            Your recruitment email will be the read-only address{' '}
            {derivedFirmEmail ? (
              <span className="font-semibold text-ink-2">{derivedFirmEmail}</span>
            ) : (
              '— enter your company name to preview it'
            )}
          </p>
        )}

        {role === 'university' && derivedUniversityEmail && (
          <p className="rounded-xl border border-line bg-surface px-4 py-3 text-xs text-ink-4">
            Your account will be created with the read-only address{' '}
            <span className="font-semibold text-ink-2">{derivedUniversityEmail}</span>
          </p>
        )}

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
