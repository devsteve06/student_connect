import { useId, forwardRef } from 'react';

const Select = forwardRef(function Select({ label, error, hint, id, className = '', children, ...props }, ref) {
  const autoId = useId();
  const selectId = id || autoId;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={selectId} className="mb-1.5 block text-sm font-semibold text-ink-2">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          className={`w-full appearance-none rounded-xl border border-line bg-surface px-3.5 py-2.5 pr-9 text-sm text-ink shadow-soft transition-colors focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 ${
            error ? 'border-rose-300 dark:border-rose-500/60' : ''
          }`}
          {...props}
        >
          {children}
        </select>
        <svg
          className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 fill-ink-5"
          viewBox="0 0 20 20"
        >
          <path d="M5.3 7.3L10 12l4.7-4.7 1.3 1.3L10 14.6 4 8.6z" />
        </svg>
      </div>
      {error && <p className="mt-1.5 text-xs font-medium text-rose-600">{error}</p>}
      {!error && hint && <p className="mt-1.5 text-xs text-ink-5">{hint}</p>}
    </div>
  );
});

export default Select;