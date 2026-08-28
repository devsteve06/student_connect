const accentByTone = {
  brand: 'bg-brand-50 text-brand-600 ring-brand-100',
  success: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
  warning: 'bg-amber-50 text-amber-600 ring-amber-100',
  danger: 'bg-rose-50 text-rose-600 ring-rose-100',
  neutral: 'bg-surface-3 text-ink-4 ring-line',
};

export default function MetricCard({ title, value, unit, icon: Icon, tone = 'brand', change, className = '' }) {
  const accent = accentByTone[tone] || accentByTone.brand;

  return (
    <div
      className={`group flex flex-col justify-between space-y-4 rounded-2xl border border-line/80 bg-surface p-5 shadow-soft transition-shadow hover:shadow-lifted ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-ink-5">{title}</span>
        {Icon && (
          <span className={`flex h-9 w-9 items-center justify-center rounded-xl ring-1 ${accent}`}>
            <Icon className="h-4.5 w-4.5" />
          </span>
        )}
      </div>
      <div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-extrabold tracking-tight text-ink">{value}</span>
          {unit && <span className="text-xs font-semibold text-ink-5">{unit}</span>}
        </div>
      </div>
      {change && <p className="text-xs font-medium text-ink-5">{change}</p>}
    </div>
  );
}