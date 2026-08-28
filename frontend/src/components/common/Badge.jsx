const variants = {
  neutral: 'bg-surface-3 text-ink-3 border-line',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  danger: 'bg-rose-50 text-rose-700 border-rose-200',
  info: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  brand: 'bg-brand-50 text-brand-700 border-brand-200',
};

export default function Badge({ children, variant = 'neutral', dot = false, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${variants[variant]} ${className}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${variants[variant]} bg-current`} />}
      {children}
    </span>
  );
}