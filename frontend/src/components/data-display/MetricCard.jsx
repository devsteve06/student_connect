export default function MetricCard({ title, value, change, status = 'default' }) {
  const statusStyles = {
    success: { border: "border-l-4 border-l-emerald-500", text: "text-emerald-600 bg-emerald-50/50" },
    warning: { border: "border-l-4 border-l-amber-500", text: "text-amber-600 bg-amber-50/50" },
    info: { border: "border-l-4 border-l-indigo-500", text: "text-indigo-600 bg-indigo-50/50" },
    default: { border: "border-l-4 border-l-slate-400", text: "text-slate-500 bg-slate-50" }
  };

  const currentStyle = statusStyles[status] || statusStyles.default;

  return (
    <div className={`bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between transition-all hover:border-slate-200/80 ${currentStyle.border}`}>
      <div className="space-y-1">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">{title}</span>
        <span className="text-3xl font-extrabold text-slate-900 tracking-tight block font-mono">{value || '0'}</span>
      </div>
      <div className="mt-4">
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wide ${currentStyle.text}`}>
          {change}
        </span>
      </div>
    </div>
  );
}