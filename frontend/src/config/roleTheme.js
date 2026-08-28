// Single source of truth for per-role visual identity.
// Every portal derives its accent styles from here so the four
// dashboards stay consistent even as branding evolves.
// Each accent carries an explicit dark-mode counterpart so chips,
// links and icon tiles stay legible on dark surfaces.

const roleTheme = {
  student: {
    label: 'Student',
    portal: 'Student Hub',
    breadcrumb: 'Student portal',
    // Primary accents
    text: 'text-violet-700 dark:text-violet-300',
    textStrong: 'text-violet-900 dark:text-violet-200',
    softBg: 'bg-violet-50 dark:bg-violet-500/15',
    border: 'border-violet-200 dark:border-violet-500/35',
    solidBg: 'bg-violet-600',
    icon: 'text-violet-600 dark:text-violet-400',
    // Nav active state
    navActive:
      'bg-violet-50 text-violet-900 border-violet-200 dark:bg-violet-500/15 dark:text-violet-200 dark:border-violet-500/35',
    navHover:
      'hover:bg-violet-50/70 hover:text-violet-900 dark:hover:bg-violet-500/15 dark:hover:text-violet-200',
    navDot: 'bg-violet-500',
  },
  firm: {
    label: 'Firm',
    portal: 'Corporate Gate',
    breadcrumb: 'Firm portal',
    text: 'text-amber-700 dark:text-amber-300',
    textStrong: 'text-amber-900 dark:text-amber-200',
    softBg: 'bg-amber-50 dark:bg-amber-500/15',
    border: 'border-amber-200 dark:border-amber-500/35',
    solidBg: 'bg-amber-600',
    icon: 'text-amber-600 dark:text-amber-400',
    navActive:
      'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-500/15 dark:text-amber-200 dark:border-amber-500/35',
    navHover:
      'hover:bg-amber-50/70 hover:text-amber-900 dark:hover:bg-amber-500/15 dark:hover:text-amber-200',
    navDot: 'bg-amber-500',
  },
  university: {
    label: 'University',
    portal: 'Faculty Console',
    breadcrumb: 'University portal',
    text: 'text-cyan-700 dark:text-cyan-300',
    textStrong: 'text-cyan-900 dark:text-cyan-200',
    softBg: 'bg-cyan-50 dark:bg-cyan-500/15',
    border: 'border-cyan-200 dark:border-cyan-500/35',
    solidBg: 'bg-cyan-600',
    icon: 'text-cyan-600 dark:text-cyan-400',
    navActive:
      'bg-cyan-50 text-cyan-900 border-cyan-200 dark:bg-cyan-500/15 dark:text-cyan-200 dark:border-cyan-500/35',
    navHover:
      'hover:bg-cyan-50/70 hover:text-cyan-900 dark:hover:bg-cyan-500/15 dark:hover:text-cyan-200',
    navDot: 'bg-cyan-500',
  },
  admin: {
    label: 'Admin',
    portal: 'Admin Center',
    breadcrumb: 'Administration',
    text: 'text-rose-700 dark:text-rose-300',
    textStrong: 'text-rose-900 dark:text-rose-200',
    softBg: 'bg-rose-50 dark:bg-rose-500/15',
    border: 'border-rose-200 dark:border-rose-500/35',
    solidBg: 'bg-rose-600',
    icon: 'text-rose-600 dark:text-rose-400',
    navActive:
      'bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-500/15 dark:text-rose-200 dark:border-rose-500/35',
    navHover:
      'hover:bg-rose-50/70 hover:text-rose-900 dark:hover:bg-rose-500/15 dark:hover:text-rose-200',
    navDot: 'bg-rose-500',
  },
};

// Accent chips used for banner-eyebrow labels on each dashboard.
export function roleChip(role) {
  const t = roleTheme[role] || roleTheme.student;
  return {
    label: t.portal,
    classes: `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider ${t.softBg} ${t.text} border ${t.border}`,
  };
}

export default roleTheme;