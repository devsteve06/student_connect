import { forwardRef } from 'react';

const variants = {
  primary:
    'bg-brand-600 hover:bg-brand-700 text-white shadow-sm shadow-brand-600/30 border border-brand-700/40',
  secondary:
    'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-soft',
  ghost: 'bg-transparent hover:bg-slate-100 text-slate-600',
  danger:
    'bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-600/30 border border-rose-700/40',
};

const sizes = {
  sm: 'h-9 px-3.5 text-sm',
  md: 'h-10 px-5 text-sm',
  lg: 'h-12 px-7 text-sm',
};

const Button = forwardRef(function Button(
  { children, className = '', variant = 'primary', size = 'md', icon: Icon, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {Icon && <Icon className="h-4 w-4 shrink-0" />}
      {children}
    </button>
  );
});

export default Button;