const variants = {
  card: 'rounded-2xl border border-slate-200/80',
  table: 'rounded-xl border border-slate-100',
};

export default function Skeleton({ variant = 'card', lines = 3, className = '' }) {
  return (
    <div className={`animate-pulse bg-slate-100 ${variants[variant]} ${className}`}>
      <div className="space-y-3 p-5">
        <div className="h-3 w-1/3 rounded-full bg-slate-200" />
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="h-2.5 rounded-full bg-slate-200"
            style={{ width: `${[88, 70, 94][i % 3]}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export function MetricSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <div className="h-3 w-24 animate-pulse rounded-full bg-slate-200" />
        <div className="h-8 w-8 animate-pulse rounded-lg bg-slate-100" />
      </div>
      <div className="mt-4 h-8 w-16 animate-pulse rounded-md bg-slate-200" />
    </div>
  );
}