import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  Building2,
  GraduationCap,
  Landmark,
  LogOut,
  MousePointerClick,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import Button from '../components/common/Button';
import ThemeToggle from '../components/common/ThemeToggle';
import roleTheme from '../config/roleTheme';
import { useAuth } from '../context/useAuth';

const PORTAL_HOMES = {
  student: '/student',
  firm: '/firm',
  university: '/university',
  admin: '/admin',
};

// Single source of truth for the four portal entry cards.
const PORTALS = [
  {
    role: 'student',
    icon: GraduationCap,
    title: 'Student Hub',
    description:
      'Browse placement vacancies, submit weekly logbook entries, and track every application.',
    demo: 'alex.kamau@students.strathmore.edu',
    password: 'password123',
    loginPath: '/login/student',
  },
  {
    role: 'firm',
    icon: Building2,
    title: 'Corporate Gate',
    description:
      'Post openings, review the candidate roster, and move applicants from review to hired.',
    demo: 'careers@nexuslabs.io',
    password: 'password123',
    loginPath: '/login/firm',
  },
  {
    role: 'university',
    icon: Landmark,
    title: 'Faculty Console',
    description:
      'Verify submitted logbooks, run pending audits, and issue faculty sign-off online.',
    demo: 'registrar@jkuat.ac.ke',
    password: 'password123',
    loginPath: '/login/university',
  },
  {
    role: 'admin',
    icon: ShieldCheck,
    title: 'Admin Center',
    description:
      'Manage every account across the platform, reset passwords, and keep the system healthy.',
    demo: 'sysadmin',
    password: 'theadmin',
    loginPath: '/login/admin',
  },
];

const FEATURES = [
  {
    icon: Briefcase,
    title: 'Placement marketplace',
    description: 'Browse and apply to open industrial attachment vacancies posted by partner firms.',
  },
  {
    icon: BookOpen,
    title: 'Weekly logbook',
    description: 'Record your attachment week by week and collect firm sign-off as you go.',
  },
  {
    icon: Users,
    title: 'Applicant tracking',
    description: 'Firms review the candidate roster and move applicants from review to hired.',
  },
  {
    icon: ShieldCheck,
    title: 'Faculty audits',
    description: 'Universities verify submitted logbooks and issue sign-off with a full audit trail.',
  },
];

const STEPS = [
  {
    title: 'Discover & apply',
    description: 'Students browse the marketplace and apply to placements that match their course.',
  },
  {
    title: 'Review & place',
    description: 'Firms shortlist, interview, and place candidates straight from the roster.',
  },
  {
    title: 'Track & sign off',
    description: 'Supervisors and faculty review weekly logbooks and sign them off online.',
  },
];

function scrollToId(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();

  const signedInRole = isAuthenticated && user?.role ? user.role : null;
  const activeTheme = roleTheme[signedInRole] || roleTheme.student;

  const handleSignOut = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-surface-2 text-ink">
      {/* ------------------------------------------------------------------ */}
      {/* Header                                                             */}
      {/* ------------------------------------------------------------------ */}
      <header className="sticky top-0 z-40 border-b border-line/70 bg-surface/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <img src="/favicon.svg" alt="Student Connect logo" className="h-9 w-9 rounded-xl shadow-soft" />
            <span className="text-base font-extrabold tracking-tight text-ink">
              Student Connect
            </span>
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            <button
              type="button"
              onClick={() => scrollToId('portals')}
              className="text-sm font-semibold text-ink-3 transition-colors hover:text-ink"
            >
              Portals
            </button>
            <button
              type="button"
              onClick={() => scrollToId('features')}
              className="text-sm font-semibold text-ink-3 transition-colors hover:text-ink"
            >
              Features
            </button>
            <button
              type="button"
              onClick={() => scrollToId('how')}
              className="text-sm font-semibold text-ink-3 transition-colors hover:text-ink"
            >
              How it works
            </button>
            <button
              type="button"
              onClick={() => scrollToId('demo')}
              className="text-sm font-semibold text-ink-3 transition-colors hover:text-ink"
            >
              Demo access
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle compact />

            {signedInRole ? (
              <>
                <p className="hidden text-xs font-semibold uppercase tracking-wider text-ink-5 sm:block">
                  Signed in as <span className={activeTheme.text}>{activeTheme.label}</span>
                </p>
                <Button size="sm" onClick={() => navigate(PORTAL_HOMES[signedInRole])}>
                  Back to {activeTheme.portal}
                </Button>
                <button
                  type="button"
                  onClick={handleSignOut}
                  aria-label="Sign out"
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-xl px-3.5 text-sm font-semibold text-ink-4 transition-colors hover:bg-surface-3 hover:text-ink-2"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <Button variant="secondary" size="sm" onClick={() => navigate('/login/student')}>
                  Sign in
                </Button>
                <Button size="sm" className="hidden sm:inline-flex" onClick={() => scrollToId('portals')}>
                  Explore portals
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* Hero (dark brand panel, mirrors the auth shell treatment)          */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative overflow-hidden bg-slate-950">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(#8b5cf6_1px,transparent_1px)] opacity-[0.07] [background-size:22px_22px]"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -right-40 -top-40 h-[30rem] w-[30rem] rounded-full bg-gradient-to-br from-brand-600 to-indigo-600 opacity-25 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-48 -left-40 h-[28rem] w-[28rem] rounded-full bg-brand-500 opacity-10 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative z-10 mx-auto max-w-7xl px-6 py-20 sm:py-28 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/60 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-widest text-brand-300">
              <Sparkles className="h-3.5 w-3.5" />
              Industrial Attachment Platform
            </span>
            <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              Industrial attachment,{' '}
              <span className="bg-gradient-to-r from-brand-400 to-indigo-400 bg-clip-text text-transparent">
                minus the paperwork.
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base text-ink-5 sm:text-lg">
              Student Connect brings students, firms, and universities onto one platform — from
              marketplace applications to weekly logbook sign-off.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" onClick={() => scrollToId('portals')}>
                Enter a portal
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="secondary"
                className="border-slate-700 bg-slate-900/60 text-white hover:bg-slate-800 hover:text-white"
                onClick={() => scrollToId('how')}
              >
                How it works
              </Button>
            </div>
          </div>

          {/* Portal cards */}
          <div id="portals" className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 scroll-mt-24">
            {PORTALS.map((p) => {
              const theme = roleTheme[p.role];
              const Icon = p.icon;
              return (
                <Link
                  key={p.role}
                  to={p.loginPath}
                  className="group relative rounded-2xl border border-slate-700/60 bg-slate-900/40 p-6 transition-all duration-150 hover:-translate-y-1 hover:border-slate-500 hover:bg-slate-900/70 hover:shadow-pop"
                >
                  <div
                    className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl ${theme.softBg} ${theme.text}`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-base font-extrabold tracking-tight text-white">{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-5">{p.description}</p>
                  <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-800 pt-4">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-ink-4">
                        Demo
                      </p>
                      <p className="truncate font-mono text-[11px] text-ink-5">{p.demo}</p>
                    </div>
                    <span
                      className={`inline-flex shrink-0 items-center gap-1 text-sm font-semibold ${theme.text}`}
                    >
                      Sign in
                      <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Features                                                            */}
      {/* ------------------------------------------------------------------ */}
      <section id="features" className="scroll-mt-24 bg-surface-2 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-600">What you get</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              Everything an attachment needs, in one place
            </h2>
            <p className="mt-4 text-sm text-ink-4">
              From the first application to the final faculty sign-off, every step of the attachment
              lifecycle lives here.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="rounded-2xl border border-line/80 bg-surface p-6 shadow-soft transition-all duration-150 hover:-translate-y-1 hover:shadow-lifted"
                >
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-extrabold tracking-tight text-ink">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-4">{f.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* How it works                                                        */}
      {/* ------------------------------------------------------------------ */}
      <section id="how" className="scroll-mt-24 border-y border-line/70 bg-surface py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-600">
              How it works
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              Three roles, one smooth workflow
            </h2>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <div key={step.title} className="relative text-center">
                {i < STEPS.length - 1 && (
                  <span
                    className="pointer-events-none absolute left-[calc(50%+2.5rem)] top-7 hidden h-px w-[calc(100%-5rem)] bg-gradient-to-r from-brand-200 to-slate-200 md:block"
                    aria-hidden="true"
                  />
                )}
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-600 text-white shadow-pop">
                  <span className="text-lg font-extrabold">{i + 1}</span>
                </div>
                <div className="mt-5 inline-flex items-center justify-center gap-1.5 text-brand-600">
                  <MousePointerClick className="h-4 w-4" />
                </div>
                <h3 className="mt-2 text-base font-extrabold tracking-tight text-ink">
                  {step.title}
                </h3>
                <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-ink-4">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Demo access                                                         */}
      {/* ------------------------------------------------------------------ */}
      <section id="demo" className="scroll-mt-24 bg-surface-2 py-20 sm:py-24">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-600">Try it now</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              Jump in with a demo account
            </h2>
            <p className="mt-4 text-sm text-ink-4">
              Every role has a pre-seeded account, so you can explore any portal straight away.
            </p>
          </div>

          <div className="mt-10 overflow-hidden rounded-2xl border border-line/80 bg-surface shadow-soft">
            {PORTALS.map((p, i) => {
              const theme = roleTheme[p.role];
              return (
                <div
                  key={p.role}
                  className={`flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between ${
                    i > 0 ? 'border-t border-line-2' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span
                      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${theme.softBg} ${theme.text}`}
                    >
                      <p.icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className={`text-xs font-bold uppercase tracking-widest ${theme.text}`}>
                        {theme.label}
                      </p>
                      <p className="truncate font-mono text-xs text-ink-2">
                        {p.demo}
                        <span className="mx-1.5 text-slate-300">·</span>
                        {p.password}
                      </p>
                    </div>
                  </div>
                  <Link
                    to={p.loginPath}
                    className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-brand-700 transition-colors hover:text-brand-800"
                  >
                    Open sign in
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Footer                                                              */}
      {/* ------------------------------------------------------------------ */}
      <footer className="bg-slate-950">
        <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <img src="/favicon.svg" alt="Student Connect logo" className="h-9 w-9 rounded-xl" />
                <span className="text-base font-extrabold tracking-tight text-white">
                  Student Connect
                </span>
              </div>
              <p className="max-w-xs text-sm leading-relaxed text-ink-5">
                The industrial attachment platform connecting students, firms, and universities —
                one workflow, no paperwork.
              </p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-ink-4">Portals</p>
              <ul className="mt-4 space-y-2.5">
                {PORTALS.map((p) => (
                  <li key={p.role}>
                    <Link
                      to={p.loginPath}
                      className="text-sm font-semibold text-ink-5 transition-colors hover:text-white"
                    >
                      {p.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-ink-4">Explore</p>
              <ul className="mt-4 space-y-2.5">
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToId('features')}
                    className="text-sm font-semibold text-ink-5 transition-colors hover:text-white"
                  >
                    Features
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToId('how')}
                    className="text-sm font-semibold text-ink-5 transition-colors hover:text-white"
                  >
                    How it works
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToId('demo')}
                    className="text-sm font-semibold text-ink-5 transition-colors hover:text-white"
                  >
                    Demo access
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 border-t border-slate-800 pt-6 text-xs text-ink-4">
            © 2026 Student Connect · Industrial Attachment Platform
          </div>
        </div>
      </footer>
    </div>
  );
}