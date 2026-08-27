export default function Card({
  children,
  title,
  eyebrow,
  action,
  className = '',
  bodyClassName = '',
}) {
  return (
    <section className={`rounded-2xl border border-slate-200/80 bg-white shadow-soft ${className}`}>
      {(title || eyebrow || action) && (
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div>
            {eyebrow && (
              <p className="mb-0.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {eyebrow}
              </p>
            )}
            {title && <h2 className="text-sm font-extrabold tracking-tight text-slate-900">{title}</h2>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className={`p-5 ${bodyClassName}`}>{children}</div>
    </section>
  );
}