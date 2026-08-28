import roleTheme from '../../config/roleTheme';
import ThemeToggle from '../../components/common/ThemeToggle';

export default function AuthShell({
  role = 'student',
  headline,
  tagline,
  quote,
  quoteSource,
  children,
  footer,
}) {
  const theme = roleTheme[role] || roleTheme.student;

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Brand panel */}
      <aside className="relative hidden w-5/12 overflow-hidden bg-slate-950 lg:flex lg:flex-col lg:justify-between">
        {/* Decorative layers */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07] bg-[radial-gradient(#8b5cf6_1px,transparent_1px)] [background-size:22px_22px]"
          aria-hidden="true"
        />
        <div
          className={`pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-gradient-to-br from-brand-600 to-indigo-600 opacity-25 blur-3xl`}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-40 -right-40 h-[28rem] w-[28rem] rounded-full bg-brand-500 opacity-10 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative z-10 flex items-center gap-3 p-12">
          <img src="/favicon.svg" alt="Student Connect logo" className="h-10 w-10 rounded-xl shadow-pop" />
          <div>
            <p className="text-sm font-extrabold tracking-tight text-white">Student Connect</p>
            <p className={`text-xs font-semibold ${theme.icon}`}>{theme.portal}</p>
          </div>
        </div>

        <div className="relative z-10 space-y-6 p-12">
          <div className={`inline-flex items-center gap-2 rounded-full border ${theme.border} ${theme.softBg} px-3 py-1`}>
            <span className={`h-1.5 w-1.5 rounded-full ${theme.navDot}`} />
            <span className={`text-[11px] font-bold uppercase tracking-widest ${theme.text}`}>
              {theme.label} access
            </span>
          </div>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white">
            {headline}
          </h1>
          {tagline && <p className="max-w-md text-sm text-ink-5">{tagline}</p>}
        </div>

        <div className="relative z-10 space-y-5 p-12">
          <blockquote className={`max-w-md border-l-2 pl-5 ${theme.border}`}>
            <p className="text-lg font-medium italic leading-relaxed text-slate-300">{quote}</p>
            <cite className={`mt-2 block text-xs font-bold not-italic uppercase tracking-widest ${theme.text}`}>
              {quoteSource}
            </cite>
          </blockquote>
          <p className="text-xs text-ink-4">© 2026 Student Connect · Industrial Attachment Platform</p>
        </div>
      </aside>

      {/* Form panel */}
      <main className="relative flex w-full flex-1 flex-col items-center justify-center bg-surface-2 px-4 py-10 sm:px-8">
        <div className="absolute right-4 top-4">
          <ThemeToggle compact />
        </div>
        <div className="mb-8 flex flex-col items-center lg:hidden">
          <img src="/favicon.svg" alt="Student Connect logo" className="mb-3 h-12 w-12 rounded-2xl shadow-lifted" />
          <p className="text-base font-extrabold tracking-tight text-ink">Student Connect</p>
        </div>

        <div className="w-full max-w-md">
          {children}
          {footer && <div className="mt-8 border-t border-line pt-6">{footer}</div>}
        </div>
      </main>
    </div>
  );
}

export function FormHeader({ title, subtitle }) {
  return (
    <div className="mb-8 space-y-2">
      <h2 className="text-2xl font-extrabold tracking-tight text-ink">{title}</h2>
      <p className="text-sm text-ink-4">{subtitle}</p>
    </div>
  );
}

export function DemoHint({ email, username, password }) {
  return (
    <div className="mt-6 rounded-xl border border-line bg-surface px-4 py-3 text-xs text-ink-4 shadow-soft">
      <p className="mb-1 font-bold uppercase tracking-wider text-ink-5">Demo access</p>
      <p className="font-mono">
        {username ? `Username: ${username}` : `Email: ${email}`}
        <span className="mx-1.5 text-slate-300">·</span>
        Password: {password}
      </p>
    </div>
  );
}