import { useId, forwardRef } from 'react';

const baseField =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-soft transition-colors focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10';

const errorField = 'border-rose-300 bg-rose-50/40 focus:border-rose-400 focus:ring-rose-500/10';

const Input = forwardRef(function Input(
  { label, error, hint, id, type = 'text', icon: Icon, className = '', ...props },
  ref
) {
  const autoId = useId();
  const inputId = id || autoId;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-semibold text-slate-700">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          className={`${baseField} ${Icon ? 'pl-10' : ''} ${error ? errorField : ''}`}
          {...props}
        />
      </div>
      {error && <p className="mt-1.5 text-xs font-medium text-rose-600">{error}</p>}
      {!error && hint && <p className="mt-1.5 text-xs text-slate-400">{hint}</p>}
    </div>
  );
});

export default Input;