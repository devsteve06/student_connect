export default function Button({ children, className = '', variant = 'primary', ...props }) {
  const baseStyle = "inline-flex items-center justify-center text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-150 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "bg-slate-950 hover:bg-slate-900 text-white shadow-sm hover:shadow-md border border-slate-900",
    secondary: "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm",
    ghost: "bg-transparent hover:bg-slate-50 text-slate-600"
  };

  return (
    <button
      className={`${baseStyle} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}