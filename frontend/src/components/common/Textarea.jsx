import { useId, forwardRef } from 'react';

const Textarea = forwardRef(function Textarea(
  { label, error, hint, id, rows = 3, className = '', ...props },
  ref
) {
  const autoId = useId();
  const textareaId = id || autoId;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={textareaId} className="mb-1.5 block text-sm font-semibold text-ink-2">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        className={`w-full resize-y rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm leading-relaxed text-ink placeholder:text-ink-5 shadow-soft transition-colors focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 ${
          error ? 'border-rose-300 bg-rose-50/40 dark:border-rose-500/60 dark:bg-rose-500/10' : ''
        }`}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs font-medium text-rose-600">{error}</p>}
      {!error && hint && <p className="mt-1.5 text-xs text-ink-5">{hint}</p>}
    </div>
  );
});

export default Textarea;